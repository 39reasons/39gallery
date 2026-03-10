"use client";

import { ExternalLink } from "lucide-react";
import type { WeversePost } from "@/types/instagram";
import { LightboxShell } from "./LightboxShell";
import { useCarousel } from "./lightbox/useCarousel";
import { CarouselControls } from "./lightbox/CarouselControls";

interface DMLightboxProps {
  post: WeversePost;
  onClose: () => void;
  onPrevPost?: () => void;
  onNextPost?: () => void;
}

export function DMLightbox({ post, onClose, onPrevPost, onNextPost }: DMLightboxProps) {
  const { currentIndex, prev, next, goTo } = useCarousel(post.imageUrls.length);

  const date = new Date(post.timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <LightboxShell
      onClose={onClose}
      onPrevPost={onPrevPost}
      onNextPost={onNextPost}
      sidebar={
        <div className="md:w-80 p-4 flex flex-col gap-3 overflow-y-auto max-h-[30vh] md:max-h-none">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{post.memberName}</span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Weverse DM
            </span>
          </div>
          <time className="text-xs text-muted-foreground">{date}</time>
          {post.tweetText && (
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {post.tweetText}
            </p>
          )}
          <a
            href={post.tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on X (opens in new tab)"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on X
          </a>
        </div>
      }
    >
      {/* Image */}
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrls[currentIndex] ?? post.imageUrls[0]}
          alt={`Weverse DM from ${post.memberName}`}
          className="max-h-[70vh] md:max-h-[85vh] w-full object-contain select-none"
          referrerPolicy="no-referrer"
          draggable={false}
        />
        <CarouselControls
          currentIndex={currentIndex}
          total={post.imageUrls.length}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
      </div>
    </LightboxShell>
  );
}
