"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeversePost, MemberKey } from "@/types/instagram";
import { apiFetch } from "@/lib/api-client";
import type { WeverseResponse } from "@/types/api-responses";

export function useWeversePosts(memberKey: MemberKey) {
  const [posts, setPosts] = useState<WeversePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (key: MemberKey) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<WeverseResponse>(`/api/weverse/${key}`);
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch DM updates");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(memberKey);
  }, [memberKey, fetchPosts]);

  const retry = useCallback(() => fetchPosts(memberKey), [memberKey, fetchPosts]);

  return { posts, loading, error, retry };
}
