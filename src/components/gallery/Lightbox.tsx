"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { InstagramPost } from "@/types/instagram";
import { LightboxShell } from "./LightboxShell";
import { CommentItem, type Comment } from "./lightbox/CommentItem";
import { useTranslateButton, detectLanguages } from "./lightbox/useTranslate";
import { useCarousel } from "./lightbox/useCarousel";
import { CarouselControls } from "./lightbox/CarouselControls";
import { apiFetch } from "@/lib/api-client";
import { CommentsResponse } from "@/types/api-responses";

interface LightboxProps {
  post: InstagramPost;
  onClose: () => void;
  onPrevPost?: () => void;
  onNextPost?: () => void;
  onLikeToggle?: (postId: string, liked: boolean) => void;
}

export function Lightbox({ post, onClose, onPrevPost, onNextPost, onLikeToggle }: LightboxProps) {
  const media = post.carouselMedia?.length ? post.carouselMedia : [{ url: post.imageUrl, isVideo: post.isVideo, videoUrl: post.videoUrl }];
  const { currentIndex, prev, next, goTo } = useCarousel(media.length);
  const [liked, setLiked] = useState(post.hasLiked ?? false);
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(false);
  const [captionLang, setCaptionLang] = useState<string | undefined>(undefined);
  const captionTranslate = useTranslateButton(post.caption ?? "", captionLang);

  useEffect(() => {
    setCaptionLang(undefined);
    if (!post.caption) return;
    let stale = false;
    detectLanguages([post.caption])
      .then((langs) => { if (!stale) setCaptionLang(langs[0]); })
      .catch(() => { /* detection failed, leave as unknown */ });
    return () => { stale = true; };
  }, [post.id, post.caption]);

  const [commentRetry, setCommentRetry] = useState(0);

  useEffect(() => {
    let stale = false;
    setComments([]);
    setCommentsLoading(true);
    setCommentsError(false);
    apiFetch<CommentsResponse>(`/api/comments?mediaId=${encodeURIComponent(post.id)}`)
      .then(async (data) => {
        if (stale) return;
        const rawComments: Comment[] = data.comments ?? [];
        setComments(rawComments);
        const texts = rawComments.map((c) => c.text);
        if (texts.length > 0) {
          const langs = await detectLanguages(texts);
          if (!stale) setComments(rawComments.map((c, i) => ({ ...c, lang: langs[i] })));
        }
      })
      .catch(() => {
        if (!stale) {
          setComments([]);
          setCommentsError(true);
        }
      })
      .finally(() => { if (!stale) setCommentsLoading(false); });
    return () => { stale = true; };
  }, [post.id, commentRetry]);

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
        signal: AbortSignal.timeout(10000),
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
  const heartTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked && !liking) {
        handleLike();
        setShowHeartAnim(true);
        clearTimeout(heartTimerRef.current);
        heartTimerRef.current = setTimeout(() => setShowHeartAnim(false), 800);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [liked, liking, handleLike]);

  useEffect(() => {
    return () => clearTimeout(heartTimerRef.current);
  }, []);

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
                loading="lazy"
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
          <div className="border-t pt-3 mt-1" aria-live="polite">
            {commentsLoading ? (
              <div className="flex justify-center py-2" role="status">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading comments</span>
              </div>
            ) : commentsError ? (
              <div className="text-center py-2">
                <p className="text-xs text-destructive">Failed to load comments</p>
                <button
                  onClick={() => setCommentRetry((n) => n + 1)}
                  className="text-xs text-muted-foreground hover:text-foreground underline mt-1"
                >
                  Retry
                </button>
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
        {media[currentIndex]?.isVideo && media[currentIndex]?.videoUrl ? (
          <video
            key={currentIndex}
            src={media[currentIndex]?.videoUrl}
            controls
            autoPlay
            muted
            playsInline
            title="Post video"
            className="max-h-[70vh] md:max-h-[85vh] w-full object-contain"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={media[currentIndex]?.url || post.imageUrl}
            alt={post.caption?.slice(0, 100) || "Post image"}
            className="max-h-[70vh] md:max-h-[85vh] w-full object-contain select-none"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        )}
        {showHeartAnim && (
          <Heart className="absolute h-20 w-20 fill-white text-white animate-ping pointer-events-none" />
        )}
        <CarouselControls
          currentIndex={currentIndex}
          total={media.length}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
      </div>
    </LightboxShell>
  );
}
