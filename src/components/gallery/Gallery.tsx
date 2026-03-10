"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { ViewToggle } from "./ViewToggle";
import { MemberTabs } from "./MemberTabs";
import { PhotoGrid } from "./PhotoGrid";
import { Lightbox } from "./Lightbox";
import { DMGrid } from "./DMGrid";
import { DMLightbox } from "./DMLightbox";
import { MEMBERS, type MemberKey, type ViewMode, type InstagramPost, type WeversePost } from "@/types/instagram";

export function Gallery() {
  const [viewMode, setViewMode] = useState<ViewMode>("instagram");
  const [selected, setSelected] = useState<MemberKey>("le_sserafim");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [weversePosts, setWeversePosts] = useState<WeversePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dmLightboxIndex, setDmLightboxIndex] = useState<number | null>(null);
  const nextMaxIdRef = useRef<string | undefined>(undefined);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const fetchInstagramPosts = useCallback(async (memberKey: MemberKey) => {
    const member = MEMBERS.find((m) => m.key === memberKey);
    if (!member) return;

    setLoading(true);
    setError(null);
    nextMaxIdRef.current = undefined;

    try {
      const res = await fetch(`/api/posts/${member.username}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");
      setPosts(data.posts);
      nextMaxIdRef.current = data.nextMaxId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMorePosts = useCallback(async () => {
    if (!nextMaxIdRef.current || loadingMoreRef.current) return;
    const member = MEMBERS.find((m) => m.key === selectedRef.current);
    if (!member) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/posts/${member.username}?max_id=${nextMaxIdRef.current}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");
      setPosts((prev) => [...prev, ...data.posts]);
      nextMaxIdRef.current = data.nextMaxId;
    } catch {
      // silently fail on load-more
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const fetchWeverseDMs = useCallback(async (memberKey: MemberKey) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/weverse/${memberKey}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch DM updates");
      setWeversePosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch DM updates");
      setWeversePosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "instagram") {
      fetchInstagramPosts(selected);
    } else {
      fetchWeverseDMs(selected);
    }
  }, [selected, viewMode, fetchInstagramPosts, fetchWeverseDMs]);

  // Infinite scroll observer
  useEffect(() => {
    if (viewMode !== "instagram") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, loading, fetchMorePosts]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ViewToggle mode={viewMode} onModeChange={setViewMode} />
        <MemberTabs selected={selected} onSelect={setSelected} />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={() =>
              viewMode === "instagram"
                ? fetchInstagramPosts(selected)
                : fetchWeverseDMs(selected)
            }
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && viewMode === "instagram" && (
        <>
          <PhotoGrid posts={posts} onSelect={(post) => setLightboxIndex(posts.indexOf(post))} />
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {!loading && !error && viewMode === "weverse" && (
        <DMGrid posts={weversePosts} onSelect={(post) => setDmLightboxIndex(weversePosts.indexOf(post))} />
      )}

      {lightboxIndex !== null && posts[lightboxIndex] && (
        <Lightbox
          post={posts[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrevPost={lightboxIndex > 0 ? () => setLightboxIndex((i) => i! - 1) : undefined}
          onNextPost={lightboxIndex < posts.length - 1 ? () => setLightboxIndex((i) => i! + 1) : undefined}
          onLikeToggle={(postId, liked) => {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === postId
                  ? { ...p, hasLiked: liked, likeCount: p.likeCount + (liked ? 1 : -1) }
                  : p
              )
            );
          }}
        />
      )}

      {dmLightboxIndex !== null && weversePosts[dmLightboxIndex] && (
        <DMLightbox
          post={weversePosts[dmLightboxIndex]}
          onClose={() => setDmLightboxIndex(null)}
          onPrevPost={() => setDmLightboxIndex((i) => (i! > 0 ? i! - 1 : weversePosts.length - 1))}
          onNextPost={() => setDmLightboxIndex((i) => (i! < weversePosts.length - 1 ? i! + 1 : 0))}
        />
      )}
    </div>
  );
}
