import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

const mockFetchWeversePosts = vi.fn();
vi.mock("@/lib/weverse", () => ({
  fetchWeversePosts: (...args: unknown[]) => mockFetchWeversePosts(...args),
}));

const { GET } = await import("./route");

function makeRequest(member: string): [Request, { params: Promise<{ member: string }> }] {
  return [
    new Request(`http://localhost/api/weverse/${member}`),
    { params: Promise.resolve({ member }) },
  ];
}

describe("GET /api/weverse/[member]", () => {
  it("returns 400 for invalid member key", async () => {
    const res = await GET(...makeRequest("invalid_key"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid member");
  });

  it("accepts all valid member keys", async () => {
    mockFetchWeversePosts.mockResolvedValue([]);
    const keys = ["le_sserafim", "chaewon", "sakura", "yunjin", "kazuha", "eunchae"];
    for (const key of keys) {
      const res = await GET(...makeRequest(key));
      expect(res.status).toBe(200);
    }
  });

  it("returns posts from fetchWeversePosts", async () => {
    const mockPosts = [{ id: "1", memberKey: "sakura" }];
    mockFetchWeversePosts.mockResolvedValue(mockPosts);
    const res = await GET(...makeRequest("sakura"));
    const data = await res.json();
    expect(data.posts).toEqual(mockPosts);
  });

  it("passes member key to fetchWeversePosts", async () => {
    mockFetchWeversePosts.mockResolvedValue([]);
    await GET(...makeRequest("chaewon"));
    expect(mockFetchWeversePosts).toHaveBeenCalledWith("chaewon");
  });

  it("returns 500 when fetchWeversePosts throws", async () => {
    mockFetchWeversePosts.mockRejectedValue(new Error("RSS fetch failed"));
    const res = await GET(...makeRequest("sakura"));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to fetch DM updates");
  });

  it("includes Cache-Control header on success", async () => {
    mockFetchWeversePosts.mockResolvedValue([]);
    const res = await GET(...makeRequest("le_sserafim"));
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=300");
  });
});
