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
  chaewon: /chaewon|채원|kimchaewon/i,
  sakura: /sakura|사쿠라|kkura/i,
  yunjin: /yunjin|윤진|huhyunjin/i,
  kazuha: /kazuha|카즈하/i,
  eunchae: /eunchae|은채|hongeunchae/i,
};
