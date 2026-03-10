"use client";

import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { WeversePost } from "@/types/instagram";
import { LightboxShell } from "./LightboxShell";

interface DMLightboxProps {
  post: WeversePost;
  onClose: () => void;
  onPrevPost?: () => void;
  onNextPost?: () => void;
}

export function DMLightbox({ post, onClose, onPrevPost, onNextPost }: DMLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevImage = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : post.imageUrls.length - 1));
  }, [post.imageUrls.length]);

  const handleNextImage = useCallback(() => {
    setCurrentIndex((i) => (i < post.imageUrls.length - 1 ? i + 1 : 0));
  }, [post.imageUrls.length]);

  // Carousel keyboard shortcuts (Shift+Arrow)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && e.shiftKey) handlePrevImage();
      if (e.key === "ArrowRight" && e.shiftKey) handleNextImage();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handlePrevImage, handleNextImage]);

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
          src={post.imageUrls[currentIndex]}
          alt={`Weverse DM from ${post.memberName}`}
          className="max-h-[70vh] md:max-h-[85vh] w-full object-contain"
          referrerPolicy="no-referrer"
        />
        {post.imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.imageUrls.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </LightboxShell>
  );
}
