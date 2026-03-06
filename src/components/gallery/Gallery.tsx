"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [lightboxPost, setLightboxPost] = useState<InstagramPost | null>(null);
  const [dmLightboxPost, setDmLightboxPost] = useState<WeversePost | null>(null);

  const fetchInstagramPosts = useCallback(async (memberKey: MemberKey) => {
    const member = MEMBERS.find((m) => m.key === memberKey);
    if (!member) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${member.username}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch posts");
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
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
        <PhotoGrid posts={posts} onSelect={setLightboxPost} />
      )}

      {!loading && !error && viewMode === "weverse" && (
        <DMGrid posts={weversePosts} onSelect={setDmLightboxPost} />
      )}

      {lightboxPost && (
        <Lightbox post={lightboxPost} onClose={() => setLightboxPost(null)} />
      )}

      {dmLightboxPost && (
        <DMLightbox post={dmLightboxPost} onClose={() => setDmLightboxPost(null)} />
      )}
    </div>
  );
}
