"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { X, Heart, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { InstagramPost } from "@/types/instagram";

interface Comment {
  id: string;
  username: string;
  profilePicUrl: string;
  text: string;
  createdAt: number;
  likeCount: number;
  replyCount: number;
  lang?: string;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function proxyPic(url: string) {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function Avatar({ src, username }: { src: string; username: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={proxyPic(src)}
      alt={username}
      className="h-6 w-6 rounded-full object-cover shrink-0"
      referrerPolicy="no-referrer"
    />
  );
}

async function detectLanguages(texts: string[]): Promise<string[]> {
  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    const data = await res.json();
    return data.languages;
  } catch {
    return texts.map(() => "unknown");
  }
}

function useTranslateButton(text: string, lang?: string) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTranslated(null);
    setShowing(false);
  }, [text]);

  const canTranslate = !!lang && lang !== "en";

  const toggle = async () => {
    if (showing) {
      setShowing(false);
      return;
    }
    if (translated !== null) {
      setShowing(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(text)}`);
      const data = await res.json();
      setTranslated(data.translated ?? "Translation failed");
      setShowing(true);
    } catch {
      setTranslated("Translation failed");
      setShowing(true);
    } finally {
      setLoading(false);
    }
  };

  const displayText = showing && translated !== null ? translated : text;

  const button = canTranslate ? (
    <button
      onClick={toggle}
      className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin inline" />
      ) : showing ? (
        "Show original"
      ) : (
        "See translation"
      )}
    </button>
  ) : null;

  return { displayText, button };
}

function ReplyItem({ reply }: { reply: Comment }) {
  const { displayText, button } = useTranslateButton(reply.text, reply.lang);

  return (
    <div className="flex gap-2">
      {reply.profilePicUrl && (
        <Avatar src={reply.profilePicUrl} username={reply.username} />
      )}
      <div className="min-w-0">
        <div>
          <span className="font-semibold">{reply.username}</span>{" "}
          <span className="text-muted-foreground">{displayText}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground/60">{timeAgo(reply.createdAt)}</span>
          {reply.likeCount > 0 && (
            <span className="text-xs text-muted-foreground/60">
              {reply.likeCount} {reply.likeCount === 1 ? "like" : "likes"}
            </span>
          )}
          {button}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, mediaId }: { comment: Comment; mediaId: string }) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { displayText, button } = useTranslateButton(comment.text, comment.lang);

  const loadReplies = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?mediaId=${mediaId}&parentId=${comment.id}`);
      const data = await res.json();
      const rawReplies: Comment[] = data.comments ?? [];
      // Detect languages for replies
      const texts = rawReplies.map((r) => r.text);
      const langs = await detectLanguages(texts);
      setReplies(rawReplies.map((r, i) => ({ ...r, lang: langs[i] })));
      setExpanded(true);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-sm">
      <div className="flex gap-2">
        {comment.profilePicUrl && (
          <Avatar src={comment.profilePicUrl} username={comment.username} />
        )}
        <div className="min-w-0">
          <div>
            <span className="font-semibold">{comment.username}</span>{" "}
            <span className="text-muted-foreground">{displayText}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground/60">{timeAgo(comment.createdAt)}</span>
            {comment.likeCount > 0 && (
              <span className="text-xs text-muted-foreground/60">
                {comment.likeCount} {comment.likeCount === 1 ? "like" : "likes"}
              </span>
            )}
            {button}
            {comment.replyCount > 0 && (
              <button
                onClick={loadReplies}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : expanded ? (
                  "Hide replies"
                ) : (
                  `View ${comment.replyCount} ${comment.replyCount === 1 ? "reply" : "replies"}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {expanded && replies.length > 0 && (
        <div className="ml-8 mt-1.5 space-y-2 border-l pl-3 border-muted">
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // Reset carousel index and like state when post changes
  useEffect(() => {
    setCurrentIndex(0);
    setLiked(post.hasLiked ?? false);
  }, [post.id, post.hasLiked]);

  // Detect caption language when post changes
  useEffect(() => {
    setCaptionLang(undefined);
    if (!post.caption) return;
    detectLanguages([post.caption]).then((langs) => setCaptionLang(langs[0]));
  }, [post.id, post.caption]);

  // Fetch comments and detect their languages when post changes
  useEffect(() => {
    setComments([]);
    setCommentsLoading(true);
    fetch(`/api/comments?mediaId=${post.id}`)
      .then((res) => res.json())
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && e.shiftKey) handlePrevImage();
      else if (e.key === "ArrowRight" && e.shiftKey) handleNextImage();
      else if (e.key === "ArrowLeft") onPrevPost?.();
      else if (e.key === "ArrowRight") onNextPost?.();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, handlePrevImage, handleNextImage, onPrevPost, onNextPost]);

  const date = new Date(post.timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onPrevPost?.(); }}
        disabled={!onPrevPost}
        className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 z-10 ${onPrevPost ? "text-white/60 hover:text-white" : "text-white/20 cursor-default"}`}
        aria-label="Previous post"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNextPost?.(); }}
        disabled={!onNextPost}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 z-10 ${onNextPost ? "text-white/60 hover:text-white" : "text-white/20 cursor-default"}`}
        aria-label="Next post"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      <div
        className="relative max-w-5xl w-full mx-4 flex flex-col md:flex-row bg-card rounded-lg overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
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

        {/* Info panel */}
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
              {captionTranslate.button}
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
      </div>
    </div>
  );
}
