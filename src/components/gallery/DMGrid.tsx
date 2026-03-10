"use client";

import { memo } from "react";
import type { WeversePost } from "@/types/instagram";
import { CarouselIcon } from "./CarouselIcon";

interface DMGridProps {
  posts: WeversePost[];
  onSelect: (post: WeversePost) => void;
}

export const DMGrid = memo(function DMGrid({ posts, onSelect }: DMGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No Weverse DM updates found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {posts.filter((post) => post.imageUrls.length > 0).map((post) => (
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
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              img.parentElement?.classList.add("bg-muted");
            }}
          />
          {post.imageUrls.length > 1 && (
            <div className="absolute top-2 right-2" aria-hidden="true">
              <CarouselIcon />
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
            <span className="text-xs font-medium text-white/90">{post.memberName}</span>
            <time dateTime={new Date(post.timestamp * 1000).toISOString()} className="block text-xs text-white/70">
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
});
