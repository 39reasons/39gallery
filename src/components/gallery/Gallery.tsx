"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ViewToggle } from "./ViewToggle";
import { MemberTabs } from "./MemberTabs";
import { PhotoGrid } from "./PhotoGrid";
import { Lightbox } from "./Lightbox";
import { DMGrid } from "./DMGrid";
import { DMLightbox } from "./DMLightbox";
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
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
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
          <PhotoGrid posts={igPosts} onSelect={(post) => setLightboxIndex(igPosts.indexOf(post))} />
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
        <DMGrid posts={wvPosts} onSelect={(post) => setDmLightboxIndex(wvPosts.indexOf(post))} />
      )}

      {lightboxIndex !== null && igPosts[lightboxIndex] && (
        <Lightbox
          key={igPosts[lightboxIndex].id}
          post={igPosts[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrevPost={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
          onNextPost={lightboxIndex < igPosts.length - 1 ? () => setLightboxIndex(lightboxIndex + 1) : undefined}
          onLikeToggle={(postId, liked) => {
            updatePost(postId, (p) => ({
              ...p,
              hasLiked: liked,
              likeCount: p.likeCount + (liked ? 1 : -1),
            }));
          }}
        />
      )}

      {dmLightboxIndex !== null && wvPosts[dmLightboxIndex] && (
        <DMLightbox
          key={wvPosts[dmLightboxIndex].id}
          post={wvPosts[dmLightboxIndex]}
          onClose={() => setDmLightboxIndex(null)}
          onPrevPost={dmLightboxIndex > 0 ? () => setDmLightboxIndex(dmLightboxIndex - 1) : undefined}
          onNextPost={dmLightboxIndex < wvPosts.length - 1 ? () => setDmLightboxIndex(dmLightboxIndex + 1) : undefined}
        />
      )}
    </section>
  );
}
