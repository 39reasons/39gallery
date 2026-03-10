"use client";

import type { WeversePost } from "@/types/instagram";

interface DMGridProps {
  posts: WeversePost[];
  onSelect: (post: WeversePost) => void;
}

export function DMGrid({ posts, onSelect }: DMGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No Weverse DM updates found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onSelect(post)}
          aria-label={`View Weverse DM from ${post.memberName}`}
          className="relative aspect-[3/4] group overflow-hidden bg-muted rounded-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrls[0]}
            alt={`Weverse DM from ${post.memberName}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {post.imageUrls.length > 1 && (
            <div className="absolute top-2 right-2">
              <svg className="h-5 w-5 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
              </svg>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
            <span className="text-xs font-medium text-white/90">{post.memberName}</span>
            <time className="block text-xs text-white/70">
              {new Date(post.timestamp * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
        </button>
      ))}
    </div>
  );
}
