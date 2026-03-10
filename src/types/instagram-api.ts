export interface IgImageCandidate {
  url: string;
  width: number;
  height: number;
}

export interface IgImageVersions2 {
  candidates: IgImageCandidate[];
}

export interface IgVideoVersion {
  url: string;
  width: number;
  height: number;
  type: number;
}

export interface IgUser {
  pk: number;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
}

export interface IgCarouselMedia {
  pk: string;
  media_type: number;
  image_versions2: IgImageVersions2;
  video_versions?: IgVideoVersion[];
}

export interface IgFeedItem {
  pk: string;
  code: string;
  media_type: number;
  image_versions2: IgImageVersions2;
  video_versions?: IgVideoVersion[];
  carousel_media?: IgCarouselMedia[];
  caption?: { text: string };
  taken_at: number;
  like_count: number;
  comment_count: number;
  has_liked: boolean;
  user?: IgUser | null;
}

export interface IgFeedResponse {
  items?: IgFeedItem[];
  next_max_id?: string | number;
  status: string;
}

export interface IgWebProfileResponse {
  data?: { user?: { id: string } };
}

export interface IgComment {
  pk: string;
  user: IgUser;
  text: string;
  created_at: number;
  comment_like_count: number;
  child_comment_count: number;
}

export interface IgCommentsResponse {
  comments?: IgComment[];
  child_comments?: IgComment[];
  status: string;
}
