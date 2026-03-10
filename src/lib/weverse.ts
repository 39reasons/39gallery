import { readFile, writeFile, rename, mkdir } from "fs/promises";
import { join } from "path";
import { XMLParser } from "fast-xml-parser";
import { MemberKey, WeversePost, WEVERSE_MEMBER_PATTERNS, MEMBERS } from "@/types/instagram";
import { WEB_UA } from "@/lib/ig-session";
import { proxyUrl } from "@/lib/instagram";

const RSS_SOURCES = [
  "https://nitter.net/sserapics/rss",
];

const CACHE_DIR = join(process.cwd(), ".cache", "weverse");
const CACHE_FILE = join(CACHE_DIR, "posts.json");

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  processEntities: false,
});

// --- Cache ---

async function loadCache(): Promise<WeversePost[]> {
  try {
    const data = await readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data) as WeversePost[];
  } catch {
    return [];
  }
}

const CACHE_TMP_FILE = join(CACHE_DIR, "posts.json.tmp");

async function saveCache(posts: WeversePost[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_TMP_FILE, JSON.stringify(posts, null, 2));
  await rename(CACHE_TMP_FILE, CACHE_FILE);
}

// --- RSS fetching ---

interface RssItem {
  title: string;
  description: string;
  pubDate: string;
  guid: string;
  link: string;
}

async function fetchRss(): Promise<string | null> {
  for (const url of RSS_SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": WEB_UA },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        await res.text();
        continue;
      }
      const xml = await res.text();
      if (xml.includes("<item>")) return xml;
    } catch {
      continue;
    }
  }
  return null;
}

function parseRssItems(xml: string): RssItem[] {
  let parsed;
  try {
    parsed = xmlParser.parse(xml);
  } catch (err) {
    console.error("[weverse] Failed to parse RSS XML:", err instanceof Error ? err.message : err);
    return [];
  }
  const rawItems = parsed?.rss?.channel?.item;
  if (!rawItems) return [];

  const arr: unknown[] = Array.isArray(rawItems) ? rawItems : [rawItems];
  return arr.map((item) => {
    const obj = item as Record<string, unknown>;
    const guid = typeof obj.guid === "object" && obj.guid !== null
      ? String((obj.guid as Record<string, unknown>)["#text"] ?? "")
      : String(obj.guid ?? "");

    return {
      title: String(obj.title ?? ""),
      description: String(obj.description ?? ""),
      pubDate: String(obj.pubDate ?? ""),
      guid,
      link: String(obj.link ?? ""),
    };
  });
}

export function isWeverseDm(text: string): boolean {
  return /weverse\s+(dm|message|update)/i.test(text);
}

export function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img\s[^>]*?src="([^"]+)"/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const raw = match[1] ?? "";
    urls.push(raw.replace(/&amp;/g, "&").replace(/&quot;/g, '"'));
  }
  return urls;
}

function safeProxyUrl(url: string): string {
  try {
    new URL(url);
  } catch {
    return "";
  }
  return proxyUrl(url);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export function detectMember(text: string): { key: MemberKey; name: string } | null {
  for (const [key, pattern] of Object.entries(WEVERSE_MEMBER_PATTERNS)) {
    if (pattern.test(text)) {
      const member = MEMBERS.find((m) => m.key === key);
      return { key: key as MemberKey, name: member?.displayName ?? key };
    }
  }
  return null;
}

export function tweetUrlFromLink(nitterLink: string): string {
  return nitterLink
    .replace(/https:\/\/nitter\.net/, "https://x.com")
    .replace(/#m$/, "");
}

// --- Merge RSS into cache ---

async function fetchAndMerge(): Promise<WeversePost[]> {
  const cached = await loadCache();
  const cachedIds = new Set(cached.map((p) => p.id));

  const xml = await fetchRss();
  if (!xml) return cached;

  const items = parseRssItems(xml);
  const dmItems = items.filter((item) => isWeverseDm(item.title));

  let added = false;
  for (const item of dmItems) {
    if (cachedIds.has(item.guid)) continue;

    const detected = detectMember(item.title);
    if (!detected) continue;

    const imageUrls = extractImageUrls(item.description).map(safeProxyUrl).filter(Boolean);
    if (imageUrls.length === 0) continue;

    cached.push({
      id: item.guid,
      imageUrls,
      memberKey: detected.key,
      memberName: detected.name,
      tweetUrl: tweetUrlFromLink(item.link),
      tweetText: stripHtml(item.title),
      timestamp: Math.floor(new Date(item.pubDate).getTime() / 1000) || Math.floor(Date.now() / 1000),
    });
    added = true;
  }

  if (added) {
    cached.sort((a, b) => b.timestamp - a.timestamp);
    const MAX_CACHED_POSTS = 500;
    if (cached.length > MAX_CACHED_POSTS) cached.length = MAX_CACHED_POSTS;
    try {
      await saveCache(cached);
    } catch (err) {
      console.error("[weverse] Failed to save cache:", err instanceof Error ? err.message : err);
    }
  }

  return cached;
}

// --- Public API ---

export async function fetchWeversePosts(memberKey: MemberKey): Promise<WeversePost[]> {
  const allPosts = await fetchAndMerge();

  if (memberKey === "le_sserafim") return allPosts;

  return allPosts.filter((p) => p.memberKey === memberKey);
}
