import { InstagramPost, WeversePost } from "./instagram";

export interface ApiComment {
  id: string;
  username: string;
  profilePicUrl: string;
  text: string;
  createdAt: number;
  likeCount: number;
  replyCount: number;
  lang?: string;
}

export interface PostsResponse { posts: InstagramPost[]; nextMaxId?: string }
export interface WeverseResponse { posts: WeversePost[] }
export interface CommentsResponse { comments: ApiComment[] }
export interface DetectResponse { languages: string[] }
export interface TranslateResponse { translated: string; detectedLang: string }
