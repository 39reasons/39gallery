import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

const mockFetchPosts = vi.fn();
vi.mock("@/lib/instagram", () => ({
  fetchPosts: (...args: unknown[]) => mockFetchPosts(...args),
}));

const { GET } = await import("./route");

function makeRequest(username: string, maxId?: string): [NextRequest, { params: Promise<{ username: string }> }] {
  const url = new URL(`http://localhost/api/posts/${username}`);
  if (maxId) url.searchParams.set("max_id", maxId);
  return [new NextRequest(url), { params: Promise.resolve({ username }) }];
}

describe("GET /api/posts/[username]", () => {
  it("returns 400 for invalid username", async () => {
    const res = await GET(...makeRequest("hacker"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid username");
  });

  it("accepts valid member username", async () => {
    mockFetchPosts.mockResolvedValue({ posts: [], nextMaxId: undefined });
    const res = await GET(...makeRequest("le_sserafim"));
    expect(res.status).toBe(200);
  });

  it("accepts all member usernames", async () => {
    mockFetchPosts.mockResolvedValue({ posts: [], nextMaxId: undefined });
    const usernames = ["le_sserafim", "_chaechae_1", "39saku_chan", "jenaissante", "zuhazana", "hhh.e_c.v"];
    for (const username of usernames) {
      const res = await GET(...makeRequest(username));
      expect(res.status).toBe(200);
    }
  });

  it("returns 400 for invalid max_id format", async () => {
    const res = await GET(...makeRequest("le_sserafim", "DROP TABLE;"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid max_id");
  });

  it("returns 400 for max_id exceeding length limit", async () => {
    const res = await GET(...makeRequest("le_sserafim", "a".repeat(61)));
    expect(res.status).toBe(400);
  });

  it("allows valid max_id", async () => {
    mockFetchPosts.mockResolvedValue({ posts: [], nextMaxId: undefined });
    const res = await GET(...makeRequest("le_sserafim", "abc123_def-456"));
    expect(res.status).toBe(200);
    expect(mockFetchPosts).toHaveBeenCalledWith("le_sserafim", "abc123_def-456");
  });

  it("passes undefined max_id when not provided", async () => {
    mockFetchPosts.mockResolvedValue({ posts: [], nextMaxId: undefined });
    await GET(...makeRequest("le_sserafim"));
    expect(mockFetchPosts).toHaveBeenCalledWith("le_sserafim", undefined);
  });

  it("returns posts and nextMaxId from fetchPosts", async () => {
    const mockPosts = [{ id: "1", imageUrl: "url" }];
    mockFetchPosts.mockResolvedValue({ posts: mockPosts, nextMaxId: "next123" });
    const res = await GET(...makeRequest("le_sserafim"));
    const data = await res.json();
    expect(data.posts).toEqual(mockPosts);
    expect(data.nextMaxId).toBe("next123");
  });

  it("returns 500 when fetchPosts throws", async () => {
    mockFetchPosts.mockRejectedValue(new Error("Instagram API down"));
    const res = await GET(...makeRequest("le_sserafim"));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch posts");
  });

  it("includes Cache-Control header on success", async () => {
    mockFetchPosts.mockResolvedValue({ posts: [], nextMaxId: undefined });
    const res = await GET(...makeRequest("le_sserafim"));
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=120");
  });
});
