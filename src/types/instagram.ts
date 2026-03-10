export interface CarouselItem {
  url: string;
  isVideo: boolean;
  videoUrl?: string;
}

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
  carouselMedia?: CarouselItem[];
  hasLiked?: boolean;
  ownerUsername?: string;
  ownerProfilePicUrl?: string;
}

export type MemberKey = "le_sserafim" | "chaewon" | "sakura" | "yunjin" | "kazuha" | "eunchae";

export interface Member {
  key: MemberKey;
  username: string;
  displayName: string;
}

export const MEMBERS: Member[] = [
  { key: "le_sserafim", username: "le_sserafim", displayName: "LE SSERAFIM" },
  { key: "chaewon", username: "_chaechae_1", displayName: "Chaewon" },
  { key: "sakura", username: "39saku_chan", displayName: "Sakura" },
  { key: "yunjin", username: "jenaissante", displayName: "Yunjin" },
  { key: "kazuha", username: "zuhazana", displayName: "Kazuha" },
  { key: "eunchae", username: "hhh.e_c.v", displayName: "Eunchae" },
];

export type ViewMode = "instagram" | "weverse";

export interface WeversePost {
  id: string;
  imageUrls: string[];
  memberKey: MemberKey;
  memberName: string;
  tweetUrl: string;
  tweetText: string;
  timestamp: number;
}

export const WEVERSE_MEMBER_PATTERNS: Record<Exclude<MemberKey, "le_sserafim">, RegExp> = {
  chaewon: /\bchaewon\b|채원|\bkimchaewon\b/i,
  sakura: /\bsakura\b|사쿠라|\bkkura\b/i,
  yunjin: /\byunjin\b|윤진|\bhuhyunjin\b/i,
  kazuha: /\bkazuha\b|카즈하/i,
  eunchae: /\beunchae\b|은채|\bhongeunchae\b/i,
};
