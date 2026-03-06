import { execSync } from "child_process";
import { InstagramPost } from "@/types/instagram";

const IG_APP_ID = "936619743392459";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface IgEdgeNode {
  node: {
    __typename: string;
    id: string;
    shortcode: string;
    display_url: string;
    thumbnail_src: string;
    is_video: boolean;
    video_url?: string;
    taken_at_timestamp: number;
    edge_media_preview_like: { count: number };
    edge_media_to_comment: { count: number };
    edge_media_to_caption: { edges: { node: { text: string } }[] };
    edge_sidecar_to_children?: { edges: { node: { display_url: string } }[] };
  };
}

interface IgProfileResponse {
  data: {
    user: {
      edge_owner_to_timeline_media: {
        edges: IgEdgeNode[];
      };
    };
  };
}

function proxyUrl(igUrl: string): string {
  return `/api/image?url=${encodeURIComponent(igUrl)}`;
}

export function fetchPosts(username: string): InstagramPost[] {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

  const stdout = execSync(
    `curl -s "${url}" -H "x-ig-app-id: ${IG_APP_ID}" -H "User-Agent: ${USER_AGENT}"`,
    { timeout: 15000 }
  );

  const json: IgProfileResponse = JSON.parse(stdout.toString());
  const edges = json.data.user.edge_owner_to_timeline_media.edges;

  return edges.map(({ node }) => {
    const caption =
      node.edge_media_to_caption.edges[0]?.node.text ?? "";

    const carouselImages = node.edge_sidecar_to_children?.edges.map(
      (e) => proxyUrl(e.node.display_url)
    );

    return {
      id: node.id,
      shortcode: node.shortcode,
      imageUrl: proxyUrl(node.display_url),
      thumbnailUrl: proxyUrl(node.thumbnail_src),
      caption,
      timestamp: node.taken_at_timestamp,
      likeCount: node.edge_media_preview_like.count,
      commentCount: node.edge_media_to_comment.count,
      isVideo: node.is_video,
      videoUrl: node.video_url,
      carouselImages: carouselImages && carouselImages.length > 0 ? carouselImages : undefined,
    };
  });
}
