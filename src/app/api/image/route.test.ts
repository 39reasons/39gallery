import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

const { GET } = await import("./route");

function makeRequest(params: Record<string, string>, headers?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/image");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url, { headers });
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockUpstream(overrides: Partial<{
  ok: boolean;
  status: number;
  contentType: string | null;
  contentLength: string | null;
  contentRange: string | null;
  body: ReadableStream | null;
}> = {}) {
  const {
    ok = true,
    status = 200,
    contentType = "image/jpeg",
    contentLength = "1024",
    contentRange = null,
    body = null,
  } = overrides;

  const headers = new Map<string, string | null>();
  headers.set("content-type", contentType);
  headers.set("content-length", contentLength);
  headers.set("content-range", contentRange);

  return vi.fn().mockResolvedValue({
    ok,
    status,
    headers: { get: (key: string) => headers.get(key) ?? null },
    body: body ?? { cancel: vi.fn() },
  });
}

describe("GET /api/image", () => {
  it("returns 400 when url parameter is missing", async () => {
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing url parameter");
  });

  it("returns 400 for invalid URL", async () => {
    const res = await GET(makeRequest({ url: "not-a-url" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid URL");
  });

  it("returns 400 when URL exceeds max length", async () => {
    const res = await GET(makeRequest({ url: "https://nitter.net/" + "a".repeat(2048) }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("URL too long");
  });

  it("returns 400 for non-HTTPS URL", async () => {
    const res = await GET(makeRequest({ url: "http://nitter.net/img.jpg" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Only HTTPS URLs are allowed");
  });

  it("returns 400 for disallowed hostname", async () => {
    const res = await GET(makeRequest({ url: "https://evil.com/image.jpg" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid image host");
  });

  it("allows cdninstagram.com subdomains", async () => {
    globalThis.fetch = mockUpstream();
    const res = await GET(makeRequest({ url: "https://scontent.cdninstagram.com/img.jpg" }));
    expect(res.status).toBe(200);
  });

  it("allows fbcdn.net subdomains", async () => {
    globalThis.fetch = mockUpstream();
    const res = await GET(makeRequest({ url: "https://scontent-lax3-1.fbcdn.net/img.jpg" }));
    expect(res.status).toBe(200);
  });

  it("allows exact nitter.net", async () => {
    globalThis.fetch = mockUpstream();
    const res = await GET(makeRequest({ url: "https://nitter.net/pic/media/abc.jpg" }));
    expect(res.status).toBe(200);
  });

  it("allows exact pbs.twimg.com", async () => {
    globalThis.fetch = mockUpstream();
    const res = await GET(makeRequest({ url: "https://pbs.twimg.com/media/img.jpg" }));
    expect(res.status).toBe(200);
  });

  it("rejects hostname spoofing (evilnitter.net)", async () => {
    const res = await GET(makeRequest({ url: "https://evilnitter.net/img.jpg" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid image host");
  });

  it("returns 502 when upstream fetch fails", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("timeout"));
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("Upstream fetch failed");
  });

  it("returns upstream status when response is not ok", async () => {
    globalThis.fetch = mockUpstream({ ok: false, status: 404 });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Upstream returned an error");
  });

  it("returns 400 for non-media content type", async () => {
    globalThis.fetch = mockUpstream({ contentType: "text/html" });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid content type");
  });

  it("returns 400 when content type is missing", async () => {
    globalThis.fetch = mockUpstream({ contentType: null });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(400);
  });

  it("returns 413 when image exceeds size limit", async () => {
    globalThis.fetch = mockUpstream({ contentLength: String(16 * 1024 * 1024) });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toBe("Response too large");
  });

  it("allows larger video files", async () => {
    globalThis.fetch = mockUpstream({ contentType: "video/mp4", contentLength: String(50 * 1024 * 1024) });
    const res = await GET(makeRequest({ url: "https://nitter.net/video.mp4" }));
    expect(res.status).toBe(200);
  });

  it("returns 413 when video exceeds size limit", async () => {
    globalThis.fetch = mockUpstream({ contentType: "video/mp4", contentLength: String(101 * 1024 * 1024) });
    const res = await GET(makeRequest({ url: "https://nitter.net/video.mp4" }));
    expect(res.status).toBe(413);
  });

  it("returns 413 when content-length is malformed (NaN)", async () => {
    globalThis.fetch = mockUpstream({ contentLength: "not-a-number" });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(413);
  });

  it("returns 413 when content-length is negative", async () => {
    globalThis.fetch = mockUpstream({ contentLength: "-1" });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(413);
  });

  it("returns 502 when content-length is missing (non-range request)", async () => {
    globalThis.fetch = mockUpstream({ contentLength: null });
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("Missing content length");
  });

  it("sets Cache-Control, Content-Type, and Content-Disposition headers on success", async () => {
    globalThis.fetch = mockUpstream();
    const res = await GET(makeRequest({ url: "https://nitter.net/img.jpg" }));
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Content-Length")).toBe("1024");
    expect(res.headers.get("Content-Disposition")).toBe("inline");
  });

  it("forwards range request header to upstream", async () => {
    const mockFetch = mockUpstream({ status: 206, contentRange: "bytes 0-999/2000", contentLength: "1000" });
    globalThis.fetch = mockFetch;

    const res = await GET(makeRequest(
      { url: "https://nitter.net/img.jpg" },
      { range: "bytes=0-999" },
    ));
    expect(res.status).toBe(206);

    const [, fetchOptions] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(fetchOptions.headers["Range"]).toBe("bytes=0-999");
  });
});
