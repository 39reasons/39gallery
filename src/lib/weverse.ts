import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { XMLParser } from "fast-xml-parser";
import { MemberKey, WeversePost, WEVERSE_MEMBER_PATTERNS, MEMBERS } from "@/types/instagram";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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

async function saveCache(posts: WeversePost[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(posts, null, 2));
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
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(15000),
      });
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

function isWeverseDm(text: string): boolean {
  return /weverse\s*(dm|message|update)/i.test(text);
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img\s+src="([^"]+)"/g;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1] ?? "");
  }
  return urls;
}

function proxyUrl(url: string): string {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<a[^>]*>([^<]*)<\/a>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function detectMember(text: string): { key: MemberKey; name: string } | null {
  for (const [key, pattern] of Object.entries(WEVERSE_MEMBER_PATTERNS)) {
    if (pattern.test(text)) {
      const member = MEMBERS.find((m) => m.key === key);
      return { key: key as MemberKey, name: member?.displayName ?? key };
    }
  }
  return null;
}

function tweetUrlFromLink(nitterLink: string): string {
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

    const imageUrls = extractImageUrls(item.description).map(proxyUrl);
    if (imageUrls.length === 0) continue;

    cached.push({
      id: item.guid,
      imageUrls,
      memberKey: detected.key,
      memberName: detected.name,
      tweetUrl: tweetUrlFromLink(item.link),
      tweetText: stripHtml(item.title),
      timestamp: Math.floor(new Date(item.pubDate).getTime() / 1000) || 0,
    });
    added = true;
  }

  if (added) {
    cached.sort((a, b) => b.timestamp - a.timestamp);
    await saveCache(cached);
  }

  return cached;
}

// --- Public API ---

export async function fetchWeversePosts(memberKey: MemberKey): Promise<WeversePost[]> {
  const allPosts = await fetchAndMerge();

  if (memberKey === "le_sserafim") return allPosts;

  return allPosts.filter((p) => p.memberKey === memberKey);
}
