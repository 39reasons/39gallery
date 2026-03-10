"use client";

import { Heart, MessageCircle, Play } from "lucide-react";
import { InstagramPost } from "@/types/instagram";

interface PhotoGridProps {
  posts: InstagramPost[];
  onSelect: (post: InstagramPost) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function PhotoGrid({ posts, onSelect }: PhotoGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No posts found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onSelect(post)}
          aria-label={`View post by ${post.ownerUsername ?? "user"}`}
          className="relative aspect-square group overflow-hidden bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.caption?.slice(0, 100) || "Post image"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {post.isVideo && (
            <div className="absolute top-2 right-2">
              <Play className="h-5 w-5 text-white drop-shadow-md fill-white" />
            </div>
          )}
          {!post.isVideo && post.carouselMedia && (
            <div className="absolute top-2 right-2">
              <svg className="h-5 w-5 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-4 text-white font-semibold text-sm">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4 fill-white" />
                {formatCount(post.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 fill-white" />
                {formatCount(post.commentCount)}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
