"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/time";
import { Avatar } from "./Avatar";
import { useTranslateButton, detectLanguages } from "./useTranslate";
import { CommentsResponse, ApiComment as Comment } from "@/types/api-responses";

function TranslateButton({ canTranslate, toggle, loading, showing }: {
  canTranslate: boolean;
  toggle: () => void;
  loading: boolean;
  showing: boolean;
}) {
  if (!canTranslate) return null;
  return (
    <button
      onClick={toggle}
      className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
      aria-label={loading ? "Translating" : showing ? "Show original" : "Translate"}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin inline" />
      ) : showing ? (
        "Show original"
      ) : (
        "See translation"
      )}
    </button>
  );
}

function ReplyItem({ reply }: { reply: Comment }) {
  const { displayText, ...translateProps } = useTranslateButton(reply.text, reply.lang);

  return (
    <div className="flex gap-2">
      {reply.profilePicUrl && (
        <Avatar src={reply.profilePicUrl} username={reply.username} />
      )}
      <div className="min-w-0">
        <div>
          <span className="font-semibold break-all">{reply.username}</span>{" "}
          <span className="text-muted-foreground break-words">{displayText}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground/60">{timeAgo(reply.createdAt)}</span>
          {reply.likeCount > 0 && (
            <span className="text-xs text-muted-foreground/60">
              {reply.likeCount} {reply.likeCount === 1 ? "like" : "likes"}
            </span>
          )}
          <TranslateButton {...translateProps} />
        </div>
      </div>
    </div>
  );
}

export const CommentItem = memo(function CommentItem({ comment, mediaId }: { comment: Comment; mediaId: string }) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { displayText, ...translateProps } = useTranslateButton(comment.text, comment.lang);
  const abortRef = useRef<AbortController | null>(null);

  const [replyError, setReplyError] = useState(false);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const loadReplies = async () => {
    if (loading) return;
    if (expanded) {
      setExpanded(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setReplyError(false);
    try {
      const url = `/api/comments?mediaId=${encodeURIComponent(mediaId)}&parentId=${encodeURIComponent(comment.id)}`;
      const res = await fetch(url, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      if (!res.ok) throw new Error(`Failed to load replies (${res.status})`);
      const data = (await res.json()) as CommentsResponse;
      const rawReplies: Comment[] = data.comments ?? [];
      if (controller.signal.aborted) return;
      setReplies(rawReplies);
      setExpanded(true);
      const texts = rawReplies.map((r) => r.text);
      if (texts.length > 0) {
        const langs = await detectLanguages(texts);
        if (!controller.signal.aborted) {
          setReplies(rawReplies.map((r, i) => ({ ...r, lang: langs[i] })));
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setReplies([]);
      setReplyError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
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
            <span className="font-semibold break-all">{comment.username}</span>{" "}
            <span className="text-muted-foreground break-words">{displayText}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground/60">{timeAgo(comment.createdAt)}</span>
            {comment.likeCount > 0 && (
              <span className="text-xs text-muted-foreground/60">
                {comment.likeCount} {comment.likeCount === 1 ? "like" : "likes"}
              </span>
            )}
            <TranslateButton {...translateProps} />
            {comment.replyCount > 0 && (
              <button
                onClick={loadReplies}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
                aria-expanded={expanded}
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
      {replyError && (
        <div className="ml-8 mt-1 text-xs">
          <span className="text-destructive">Failed to load replies</span>{" "}
          <button
            onClick={loadReplies}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Retry
          </button>
        </div>
      )}
      {expanded && replies.length > 0 && (
        <div className="ml-8 mt-1.5 space-y-2 border-l pl-3 border-muted">
          {replies.map((r) => (
            <ReplyItem key={r.id} reply={r} />
          ))}
        </div>
      )}
    </div>
  );
});
