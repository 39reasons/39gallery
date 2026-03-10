import { InstagramPost } from "@/types/instagram";
import { IgFeedItem, IgFeedResponse, IgImageCandidate, IgCarouselMedia, IgWebProfileResponse } from "@/types/instagram-api";
import { IG_APP_ID, MOBILE_UA } from "@/lib/ig-session";

function proxyUrl(igUrl: string): string {
  return `/api/image?url=${encodeURIComponent(igUrl)}`;
}

async function igFetch<T>(url: string): Promise<T> {
  const sessionId = process.env.IG_SESSION_ID;
  const headers: Record<string, string> = {
    "x-ig-app-id": IG_APP_ID,
    "User-Agent": MOBILE_UA,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
  };
  if (sessionId) {
    headers["Cookie"] = `sessionid=${sessionId}`;
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram API error ${res.status}: ${text.slice(0, 100)}`);
  }

  return res.json() as Promise<T>;
}

const userIdCache = new Map<string, string>([
  ["le_sserafim", "49655035864"],
  ["_chaechae_1", "47653240204"],
  ["39saku_chan", "3720950457"],
  ["jenaissante", "54361831717"],
  ["zuhazana", "52769062851"],
  ["hhh.e_c.v", "57275466802"],
]);

async function getUserId(username: string): Promise<string> {
  const cached = userIdCache.get(username);
  if (cached) return cached;

  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const json = await igFetch<IgWebProfileResponse>(url);

  const userId = json?.data?.user?.id;
  if (!userId) {
    throw new Error(`Could not resolve user ID for ${username}`);
  }
  userIdCache.set(username, userId);
  return userId;
}

function bestImageUrl(item: { image_versions2?: { candidates?: IgImageCandidate[] } }): string {
  const candidates = item?.image_versions2?.candidates;
  if (!candidates?.length) return "";
  const best = candidates.reduce((a, b) =>
    a.width * a.height > b.width * b.height ? a : b
  );
  return best.url;
}

export async function fetchPosts(username: string, maxId?: string): Promise<{ posts: InstagramPost[]; nextMaxId?: string }> {
  const userId = await getUserId(username);

  let url = `https://i.instagram.com/api/v1/feed/user/${userId}/`;
  if (maxId) url += `?max_id=${maxId}`;
  const json = await igFetch<IgFeedResponse>(url);

  if (!json?.items) {
    throw new Error(`Instagram returned no items for ${username}`);
  }

  const nextMaxId = json.next_max_id ? String(json.next_max_id) : undefined;

  const posts: InstagramPost[] = json.items.map((item: IgFeedItem) => {
    const caption = item.caption?.text ?? "";
    const isVideo = item.media_type === 2;

    const carouselImages = item.carousel_media?.map(
      (cm: IgCarouselMedia) => proxyUrl(bestImageUrl(cm))
    );

    const videoUrl = isVideo ? item.video_versions?.[0]?.url : undefined;

    return {
      id: String(item.pk),
      shortcode: item.code,
      imageUrl: proxyUrl(bestImageUrl(item)),
      thumbnailUrl: proxyUrl(bestImageUrl(item)),
      caption,
      timestamp: item.taken_at,
      likeCount: item.like_count ?? 0,
      commentCount: item.comment_count ?? 0,
      isVideo,
      videoUrl: videoUrl ? proxyUrl(videoUrl) : undefined,
      carouselImages:
        carouselImages && carouselImages.length > 0
          ? carouselImages
          : undefined,
      hasLiked: item.has_liked ?? false,
      ownerUsername: item.user?.username ?? "",
      ownerProfilePicUrl: item.user?.profile_pic_url
        ? proxyUrl(item.user.profile_pic_url)
        : undefined,
    };
  });

  return { posts, nextMaxId };
}
