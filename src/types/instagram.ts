export interface InstagramPost {
  id: string;
  shortcode: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  timestamp: number;
  likeCount: number;
  commentCount: number;
  isVideo: boolean;
  videoUrl?: string;
  carouselImages?: string[];
}

export interface MemberProfile {
  username: string;
  displayName: string;
  profilePicUrl?: string;
  followerCount?: number;
  postCount?: number;
}

export type MemberKey = "le_sserafim" | "chaewon" | "sakura" | "yunjin" | "kazuha" | "eunchae";

export interface Member {
  key: MemberKey;
  username: string;
  displayName: string;
}

export const MEMBERS: Member[] = [
  { key: "le_sserafim", username: "le_sserafim", displayName: "LE SSERAFIM" },
  { key: "chaewon", username: "kimchaewon_0801", displayName: "Chaewon" },
  { key: "sakura", username: "miyawaki.sakura", displayName: "Sakura" },
  { key: "yunjin", username: "jenaissansen", displayName: "Yunjin" },
  { key: "kazuha", username: "kazuha_0803", displayName: "Kazuha" },
  { key: "eunchae", username: "hong_eunchae", displayName: "Eunchae" },
];
