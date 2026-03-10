"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ViewToggle } from "./ViewToggle";
import { MemberTabs } from "./MemberTabs";
import { PhotoGrid } from "./PhotoGrid";
import { Lightbox } from "./Lightbox";
import { DMGrid } from "./DMGrid";
import { DMLightbox } from "./DMLightbox";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { MemberKey, ViewMode } from "@/types/instagram";
import { useInstagramPosts } from "@/hooks/useInstagramPosts";
import { useWeversePosts } from "@/hooks/useWeversePosts";

export function Gallery() {
  const [viewMode, setViewMode] = useState<ViewMode>("instagram");
  const [selected, setSelected] = useState<MemberKey>("le_sserafim");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dmLightboxIndex, setDmLightboxIndex] = useState<number | null>(null);

  const {
    posts: igPosts,
    loading: igLoading,
    loadingMore,
    error: igError,
    sentinelRef,
    retry: igRetry,
    updatePost,
  } = useInstagramPosts(selected);
  const {
    posts: wvPosts,
    loading: wvLoading,
    error: wvError,
    retry: wvRetry,
  } = useWeversePosts(selected);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setLightboxIndex(null);
    setDmLightboxIndex(null);
  }, []);

  const handleSelectMember = useCallback((key: MemberKey) => {
    setSelected(key);
    setLightboxIndex(null);
    setDmLightboxIndex(null);
  }, []);

  const handleSelectPost = useCallback((post: { id: string }) => {
    setLightboxIndex(igPosts.findIndex((p) => p.id === post.id));
  }, [igPosts]);

  const handleSelectDmPost = useCallback((post: { id: string }) => {
    setDmLightboxIndex(wvPosts.findIndex((p) => p.id === post.id));
  }, [wvPosts]);

  const handleCloseLightbox = useCallback(() => setLightboxIndex(null), []);
  const handleCloseDmLightbox = useCallback(() => setDmLightboxIndex(null), []);

  const handlePrevPost = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const handleNextPost = useCallback(
    () => setLightboxIndex((i) => (i !== null && i < igPosts.length - 1 ? i + 1 : i)),
    [igPosts.length],
  );
  const handlePrevDmPost = useCallback(() => setDmLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const handleNextDmPost = useCallback(
    () => setDmLightboxIndex((i) => (i !== null && i < wvPosts.length - 1 ? i + 1 : i)),
    [wvPosts.length],
  );

  const handleLikeToggle = useCallback((postId: string, liked: boolean) => {
    updatePost(postId, (p) => ({
      ...p,
      hasLiked: liked,
      likeCount: p.likeCount + (liked ? 1 : -1),
    }));
  }, [updatePost]);

  const loading = viewMode === "instagram" ? igLoading : wvLoading;
  const error = viewMode === "instagram" ? igError : wvError;
  const retry = viewMode === "instagram" ? igRetry : wvRetry;

  return (
    <section className="space-y-6">
      <nav className="space-y-4" aria-label="Gallery filters">
        <ViewToggle mode={viewMode} onModeChange={handleViewModeChange} />
        <MemberTabs selected={selected} onSelect={handleSelectMember} />
      </nav>

      {loading && (
        <div className="flex justify-center py-20" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading posts</span>
        </div>
      )}

      {error && (
        <div className="text-center py-20" role="alert">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={retry}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && viewMode === "instagram" && (
        <>
          <PhotoGrid posts={igPosts} onSelect={handleSelectPost} />
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          {loadingMore && (
            <div className="flex justify-center py-4" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="sr-only">Loading more posts</span>
            </div>
          )}
        </>
      )}

      {!loading && !error && viewMode === "weverse" && (
        <DMGrid posts={wvPosts} onSelect={handleSelectDmPost} />
      )}

      {lightboxIndex !== null && igPosts[lightboxIndex] && (
        <ErrorBoundary resetKey={igPosts[lightboxIndex].id}>
          <Lightbox
            key={igPosts[lightboxIndex].id}
            post={igPosts[lightboxIndex]}
            onClose={handleCloseLightbox}
            onPrevPost={lightboxIndex > 0 ? handlePrevPost : undefined}
            onNextPost={lightboxIndex < igPosts.length - 1 ? handleNextPost : undefined}
            onLikeToggle={handleLikeToggle}
          />
        </ErrorBoundary>
      )}

      {dmLightboxIndex !== null && wvPosts[dmLightboxIndex] && (
        <ErrorBoundary resetKey={wvPosts[dmLightboxIndex].id}>
          <DMLightbox
            key={wvPosts[dmLightboxIndex].id}
            post={wvPosts[dmLightboxIndex]}
            onClose={handleCloseDmLightbox}
            onPrevPost={dmLightboxIndex > 0 ? handlePrevDmPost : undefined}
            onNextPost={dmLightboxIndex < wvPosts.length - 1 ? handleNextDmPost : undefined}
          />
        </ErrorBoundary>
      )}
    </section>
  );
}
