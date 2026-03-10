"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WeversePost, MemberKey } from "@/types/instagram";
import { apiFetch } from "@/lib/api-client";
import type { WeverseResponse } from "@/types/api-responses";

export function useWeversePosts(memberKey: MemberKey) {
  const [posts, setPosts] = useState<WeversePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPosts = useCallback(async (key: MemberKey) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<WeverseResponse>(`/api/weverse/${key}`, {
        signal: controller.signal,
      });
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch DM updates");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(memberKey);
    return () => abortRef.current?.abort();
  }, [memberKey, fetchPosts]);

  const retry = useCallback(() => fetchPosts(memberKey), [memberKey, fetchPosts]);

  return { posts, loading, error, retry };
}
