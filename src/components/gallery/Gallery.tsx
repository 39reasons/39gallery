"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { MemberTabs } from "./MemberTabs";
import { PhotoGrid } from "./PhotoGrid";
import { Lightbox } from "./Lightbox";
import { MEMBERS, type MemberKey, type InstagramPost } from "@/types/instagram";

export function Gallery() {
  const [selected, setSelected] = useState<MemberKey>("le_sserafim");
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxPost, setLightboxPost] = useState<InstagramPost | null>(null);

  const fetchPosts = useCallback(async (memberKey: MemberKey) => {
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

  useEffect(() => {
    fetchPosts(selected);
  }, [selected, fetchPosts]);

  return (
    <div className="space-y-6">
      <MemberTabs selected={selected} onSelect={setSelected} />

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={() => fetchPosts(selected)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <PhotoGrid posts={posts} onSelect={setLightboxPost} />
      )}

      {lightboxPost && (
        <Lightbox post={lightboxPost} onClose={() => setLightboxPost(null)} />
      )}
    </div>
  );
}
