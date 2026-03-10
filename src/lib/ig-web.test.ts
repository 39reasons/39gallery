import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let igWebFetch: typeof import("./ig-web").igWebFetch;

beforeEach(async () => {
  vi.stubEnv("IG_SESSION_ID", "12345%3Aabcdef");
  vi.stubEnv("IG_CSRF_TOKEN", "csrf_token_123");
  const mod = await import("./ig-web");
  igWebFetch = mod.igWebFetch;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("igWebFetch", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns parsed JSON on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok", comments: [] }),
    });

    const result = await igWebFetch<{ status: string }>("https://www.instagram.com/api/v1/test");
    expect(result).toEqual({ status: "ok", comments: [] });
  });

  it("passes Instagram headers to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    await igWebFetch("https://www.instagram.com/api/v1/test");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers["X-CSRFToken"]).toBe("csrf_token_123");
    expect(options.headers["X-IG-App-ID"]).toBe("936619743392459");
    expect(options.headers["Cookie"]).toContain("sessionid=12345%3Aabcdef");
  });

  it("includes abort signal with timeout", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    await igWebFetch("https://www.instagram.com/api/v1/test");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("throws on non-ok response with error body text", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Login required"),
    });

    await expect(igWebFetch("https://www.instagram.com/api/v1/test"))
      .rejects.toThrow("Instagram API error 401: Login required");
  });

  it("truncates long error body text", async () => {
    const longText = "x".repeat(500);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(longText),
    });

    await expect(igWebFetch("https://www.instagram.com/api/v1/test"))
      .rejects.toThrow("Instagram API error 500: " + "x".repeat(200));
  });

  it("propagates fetch errors (network failure)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    await expect(igWebFetch("https://www.instagram.com/api/v1/test"))
      .rejects.toThrow("Network failure");
  });
});
