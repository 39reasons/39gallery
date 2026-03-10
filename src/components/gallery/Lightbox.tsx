"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { InstagramPost } from "@/types/instagram";
import { CommentsResponse } from "@/types/api-responses";
import { LightboxShell } from "./LightboxShell";
import { CommentItem, type Comment } from "./lightbox/CommentItem";
import { useTranslateButton, detectLanguages } from "./lightbox/useTranslate";

interface LightboxProps {
  post: InstagramPost;
  onClose: () => void;
  onPrevPost?: () => void;
  onNextPost?: () => void;
  onLikeToggle?: (postId: string, liked: boolean) => void;
}

export function Lightbox({ post, onClose, onPrevPost, onNextPost, onLikeToggle }: LightboxProps) {
  const images = post.carouselImages ?? [post.imageUrl];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(post.hasLiked ?? false);
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [captionLang, setCaptionLang] = useState<string | undefined>(undefined);
  const captionTranslate = useTranslateButton(post.caption ?? "", captionLang);

  useEffect(() => {
    setCaptionLang(undefined);
    if (!post.caption) return;
    detectLanguages([post.caption]).then((langs) => setCaptionLang(langs[0]));
  }, [post.id, post.caption]);

  useEffect(() => {
    setComments([]);
    setCommentsLoading(true);
    fetch(`/api/comments?mediaId=${post.id}`)
      .then((res) => res.json() as Promise<CommentsResponse>)
      .then(async (data) => {
        const rawComments: Comment[] = data.comments ?? [];
        const texts = rawComments.map((c) => c.text);
        const langs = texts.length > 0 ? await detectLanguages(texts) : [];
        setComments(rawComments.map((c, i) => ({ ...c, lang: langs[i] })));
      })
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [post.id]);

  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: post.id, unlike: !newLiked }),
      });
      if (!res.ok) {
        setLiked(!newLiked);
      } else {
        onLikeToggle?.(post.id, newLiked);
      }
    } catch {
      setLiked(!newLiked);
    } finally {
      setLiking(false);
    }
  }, [liked, liking, post.id, onLikeToggle]);

  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked && !liking) {
        handleLike();
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [liked, liking, handleLike]);

  const handlePrevImage = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNextImage = useCallback(() => {
    setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
  }, [images.length]);

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

  const captionTranslateButton = captionTranslate.canTranslate ? (
    <button
      onClick={captionTranslate.toggle}
      className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
    >
      {captionTranslate.loading ? (
        <Loader2 className="h-3 w-3 animate-spin inline" />
      ) : captionTranslate.showing ? (
        "Show original"
      ) : (
        "See translation"
      )}
    </button>
  ) : null;

  return (
    <LightboxShell
      onClose={onClose}
      onPrevPost={onPrevPost}
      onNextPost={onNextPost}
      sidebar={
        <div className="md:w-80 p-4 flex flex-col gap-3 overflow-y-auto max-h-[30vh] md:max-h-none">
          {post.ownerProfilePicUrl && post.ownerUsername && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.ownerProfilePicUrl}
                alt={post.ownerUsername}
                className="h-8 w-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-semibold">{post.ownerUsername}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              disabled={liking}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              {post.likeCount.toLocaleString()}
            </button>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.commentCount.toLocaleString()}
            </span>
          </div>
          <time className="text-xs text-muted-foreground">{date}</time>
          {post.caption && (
            <div>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {captionTranslate.displayText}
              </p>
              {captionTranslateButton}
            </div>
          )}

          {/* Comments */}
          <div className="border-t pt-3 mt-1">
            {commentsLoading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-2.5">
                {comments.map((c) => (
                  <CommentItem key={c.id} comment={c} mediaId={post.id} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No comments</p>
            )}
          </div>
        </div>
      }
    >
      {/* Image / Video */}
      <div
        className="relative flex-1 min-h-0 bg-black flex items-center justify-center"
        onClick={handleDoubleTap}
      >
        {post.isVideo && post.videoUrl ? (
          <video
            src={post.videoUrl}
            controls
            autoPlay
            muted
            playsInline
            className="max-h-[70vh] md:max-h-[85vh] w-full object-contain"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={images[currentIndex]}
            alt={post.caption.slice(0, 100)}
            className="max-h-[70vh] md:max-h-[85vh] w-full object-contain select-none"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        )}
        {showHeartAnim && (
          <Heart className="absolute h-20 w-20 fill-white text-white animate-ping pointer-events-none" />
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              disabled={currentIndex === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 ${currentIndex === 0 ? "bg-black/30 text-white/30 cursor-default" : "bg-black/50 hover:bg-black/70 text-white"}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextImage}
              disabled={currentIndex === images.length - 1}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 ${currentIndex === images.length - 1 ? "bg-black/30 text-white/30 cursor-default" : "bg-black/50 hover:bg-black/70 text-white"}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
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
