import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

const mockIgWebFetch = vi.fn();
vi.mock("@/lib/ig-web", () => ({
  igWebFetch: (...args: unknown[]) => mockIgWebFetch(...args),
}));

const { GET } = await import("./route");

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/comments");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

describe("GET /api/comments", () => {
  it("returns 400 when mediaId is missing", async () => {
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Valid mediaId is required");
  });

  it("returns 400 when mediaId is not numeric", async () => {
    const res = await GET(makeRequest({ mediaId: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when mediaId exceeds max length", async () => {
    const res = await GET(makeRequest({ mediaId: "1".repeat(31) }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when parentId is invalid", async () => {
    const res = await GET(makeRequest({ mediaId: "123", parentId: "abc" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid parentId");
  });

  it("fetches top-level comments when no parentId", async () => {
    mockIgWebFetch.mockResolvedValue({
      status: "ok",
      comments: [
        { pk: "1", user: { username: "user1", profile_pic_url: "pic1" }, text: "hello", created_at: 1000, comment_like_count: 5, child_comment_count: 2 },
      ],
    });

    const res = await GET(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].username).toBe("user1");
    expect(data.comments[0].text).toBe("hello");
    expect(data.comments[0].likeCount).toBe(5);
    expect(data.comments[0].replyCount).toBe(2);

    expect(mockIgWebFetch).toHaveBeenCalledWith(
      expect.stringContaining("/media/123456/comments/"),
    );
  });

  it("fetches child comments when parentId is provided", async () => {
    mockIgWebFetch.mockResolvedValue({
      status: "ok",
      child_comments: [
        { pk: "2", user: { username: "replier" }, text: "reply", created_at: 2000, comment_like_count: 0, child_comment_count: 0 },
      ],
    });

    const res = await GET(makeRequest({ mediaId: "123456", parentId: "789" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].username).toBe("replier");

    expect(mockIgWebFetch).toHaveBeenCalledWith(
      expect.stringContaining("/comments/789/child_comments/"),
    );
  });

  it("returns empty array when comments are null", async () => {
    mockIgWebFetch.mockResolvedValue({ status: "ok", comments: null });
    const res = await GET(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toEqual([]);
  });

  it("returns 500 when Instagram returns non-ok status", async () => {
    mockIgWebFetch.mockResolvedValue({ status: "fail" });
    const res = await GET(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when igWebFetch throws", async () => {
    mockIgWebFetch.mockRejectedValue(new Error("Network error"));
    const res = await GET(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch comments");
  });

  it("includes no-store Cache-Control header", async () => {
    mockIgWebFetch.mockResolvedValue({ status: "ok", comments: [] });
    const res = await GET(makeRequest({ mediaId: "123456" }));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("handles missing user fields gracefully", async () => {
    mockIgWebFetch.mockResolvedValue({
      status: "ok",
      comments: [{ pk: "1", user: null, text: null, created_at: null, comment_like_count: null, child_comment_count: null }],
    });
    const res = await GET(makeRequest({ mediaId: "123456" }));
    const data = await res.json();
    expect(data.comments[0]).toEqual({
      id: "1",
      username: "",
      profilePicUrl: "",
      text: "",
      createdAt: 0,
      likeCount: 0,
      replyCount: 0,
    });
  });
});
