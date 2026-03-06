import { InstagramPost } from "@/types/instagram";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = "https://instagram-scraper-api2.p.rapidapi.com/v1";

interface RapidApiMediaItem {
  id: string;
  code: string;
  image_versions?: { items?: { url: string; width: number; height: number }[] };
  carousel_media?: { image_versions?: { items?: { url: string }[] } }[];
  caption?: { text: string };
  taken_at: number;
  like_count?: number;
  comment_count?: number;
  media_type: number;
  video_versions?: { url: string }[];
}

interface RapidApiResponse {
  data?: {
    items?: RapidApiMediaItem[];
  };
}

export async function fetchUserPosts(username: string): Promise<InstagramPost[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }

  const response = await fetch(`${BASE_URL}/posts?username_or_id_or_url=${username}`, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status}`);
  }

  const json: RapidApiResponse = await response.json();
  const items = json.data?.items ?? [];

  return items.map((item) => {
    const imageVersions = item.image_versions?.items ?? [];
    const mainImage = imageVersions[0]?.url ?? "";
    const thumbnail = imageVersions.length > 1 ? imageVersions[imageVersions.length - 1]?.url ?? mainImage : mainImage;

    const carouselImages = item.carousel_media?.map(
      (cm) => cm.image_versions?.items?.[0]?.url ?? ""
    ).filter(Boolean);

    return {
      id: item.id,
      shortcode: item.code,
      imageUrl: mainImage,
      thumbnailUrl: thumbnail,
      caption: item.caption?.text ?? "",
      timestamp: item.taken_at,
      likeCount: item.like_count ?? 0,
      commentCount: item.comment_count ?? 0,
      isVideo: item.media_type === 2,
      videoUrl: item.video_versions?.[0]?.url,
      carouselImages: carouselImages && carouselImages.length > 0 ? carouselImages : undefined,
    };
  });
}
