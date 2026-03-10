"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { InstagramPost, MemberKey } from "@/types/instagram";
import { MEMBERS } from "@/types/instagram";
import { apiFetch } from "@/lib/api-client";
import type { PostsResponse } from "@/types/api-responses";

export function useInstagramPosts(memberKey: MemberKey) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextMaxIdRef = useRef<string | undefined>(undefined);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async (key: MemberKey) => {
    const member = MEMBERS.find((m) => m.key === key);
    if (!member) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    nextMaxIdRef.current = undefined;

    try {
      const data = await apiFetch<PostsResponse>(`/api/posts/${member.username}`, {
        signal: controller.signal,
      });
      setPosts(data.posts);
      nextMaxIdRef.current = data.nextMaxId;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (!nextMaxIdRef.current || loadingMoreRef.current) return;
    const member = MEMBERS.find((m) => m.key === memberKey);
    if (!member) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await apiFetch<PostsResponse>(
        `/api/posts/${member.username}?max_id=${nextMaxIdRef.current}`,
      );
      setPosts((prev) => [...prev, ...data.posts]);
      nextMaxIdRef.current = data.nextMaxId;
    } catch (err) {
      console.error("[load-more]", err instanceof Error ? err.message : err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [memberKey]);

  useEffect(() => {
    fetchPosts(memberKey);
    return () => abortRef.current?.abort();
  }, [memberKey, fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  const retry = useCallback(() => fetchPosts(memberKey), [memberKey, fetchPosts]);

  const updatePost = useCallback(
    (postId: string, updater: (p: InstagramPost) => InstagramPost) => {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    },
    [],
  );

  return { posts, loading, loadingMore, error, sentinelRef, retry, updatePost };
}
