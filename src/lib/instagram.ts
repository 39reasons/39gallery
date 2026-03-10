import { execSync } from "child_process";
import { InstagramPost } from "@/types/instagram";

const IG_APP_ID = "936619743392459";
const MOBILE_UA = "Instagram 275.0.0.27.98 Android";

function proxyUrl(igUrl: string): string {
  return `/api/image?url=${encodeURIComponent(igUrl)}`;
}

function igCurl(url: string): string {
  const sessionId = process.env.IG_SESSION_ID;
  const cookieHeader = sessionId ? ` -H "Cookie: sessionid=${sessionId}"` : "";

  const stdout = execSync(
    `curl -s "${url}" -H "x-ig-app-id: ${IG_APP_ID}" -H "User-Agent: ${MOBILE_UA}"${cookieHeader}`,
    { timeout: 15000, maxBuffer: 50 * 1024 * 1024 }
  );
  return stdout.toString();
}

const USER_IDS: Record<string, string> = {
  "le_sserafim": "49655035864",
  "_chaechae_1": "47653240204",
  "39saku_chan": "3720950457",
  "jenaissante": "54361831717",
  "zuhazana": "52769062851",
  "hhh.e_c.v": "57275466802",
};

function getUserId(username: string): string {
  const cached = USER_IDS[username];
  if (cached) return cached;

  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const json = JSON.parse(igCurl(url));

  const userId = json?.data?.user?.id;
  if (!userId) {
    throw new Error(`Could not resolve user ID for ${username}`);
  }
  return userId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bestImageUrl(item: any): string {
  const candidates = item?.image_versions2?.candidates;
  if (!candidates?.length) return "";
  // Pick the largest image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const best = candidates.reduce((a: any, b: any) =>
    a.width * a.height > b.width * b.height ? a : b
  );
  return best.url;
}

export function fetchPosts(username: string, maxId?: string): { posts: InstagramPost[]; nextMaxId?: string } {
  const userId = getUserId(username);

  let url = `https://i.instagram.com/api/v1/feed/user/${userId}/`;
  if (maxId) url += `?max_id=${maxId}`;
  const json = JSON.parse(igCurl(url));

  if (!json?.items) {
    throw new Error(`Instagram returned no items for ${username}`);
  }

  const nextMaxId = json.next_max_id ? String(json.next_max_id) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = json.items.map((item: any) => {
    const caption = item.caption?.text ?? "";
    const isVideo = item.media_type === 2;

    const carouselImages = item.carousel_media?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cm: any) => proxyUrl(bestImageUrl(cm))
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
