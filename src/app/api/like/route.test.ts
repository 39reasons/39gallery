import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

let POST: typeof import("./route").POST;

beforeEach(async () => {
  vi.stubEnv("IG_SESSION_ID", "12345%3Aabcdef");
  vi.stubEnv("IG_CSRF_TOKEN", "csrf_token_123");
  const mod = await import("./route");
  POST = mod.POST;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/like", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("POST /api/like", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/like", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 when mediaId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Valid mediaId is required");
  });

  it("returns 400 when mediaId is not a string", async () => {
    const res = await POST(makeRequest({ mediaId: 12345 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when mediaId is not numeric", async () => {
    const res = await POST(makeRequest({ mediaId: "abc" }));
    expect(res.status).toBe(400);
  });

  it("sends like request to Instagram", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    globalThis.fetch = mockFetch;

    const res = await POST(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");

    const [fetchUrl] = mockFetch.mock.calls[0] as [string];
    expect(fetchUrl).toContain("/likes/123456/like/");
  });

  it("sends unlike request when unlike is true", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    globalThis.fetch = mockFetch;

    await POST(makeRequest({ mediaId: "123456", unlike: true }));

    const [fetchUrl] = mockFetch.mock.calls[0] as [string];
    expect(fetchUrl).toContain("/likes/123456/unlike/");
  });

  it("defaults to like when unlike is not true", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    globalThis.fetch = mockFetch;

    await POST(makeRequest({ mediaId: "123456", unlike: "yes" }));

    const [fetchUrl] = mockFetch.mock.calls[0] as [string];
    expect(fetchUrl).toContain("/likes/123456/like/");
  });

  it("returns 502 when Instagram returns non-ok HTTP status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      body: { cancel: vi.fn() },
    });

    const res = await POST(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe("Like action failed");
  });

  it("returns 400 when Instagram response status is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "fail", message: "Rate limited" }),
    });

    const res = await POST(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const res = await POST(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Like action failed");
  });

  it("returns 500 when no session is configured", async () => {
    vi.stubEnv("IG_SESSION_ID", "");
    vi.stubEnv("IG_CSRF_TOKEN", "");

    const res = await POST(makeRequest({ mediaId: "123456" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("No session configured");
  });
});
