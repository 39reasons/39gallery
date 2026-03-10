import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock rate limiter to always allow
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

const { POST } = await import("./route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/detect", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("POST /api/detect", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/detect", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 when texts is not an array", async () => {
    const res = await POST(makeRequest({ texts: "hello" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Texts must be an array");
  });

  it("returns 400 when texts is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Texts must be an array");
  });

  it("returns empty array for empty texts array", async () => {
    const res = await POST(makeRequest({ texts: [] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual([]);
  });

  it("returns 400 when texts exceed max count", async () => {
    const texts = Array.from({ length: 51 }, (_, i) => `text${i}`);
    const res = await POST(makeRequest({ texts }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Too many texts");
  });

  it("returns 'unknown' for non-string array items", async () => {
    globalThis.fetch = vi.fn();
    const res = await POST(makeRequest({ texts: [123, null, true] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["unknown", "unknown", "unknown"]);
    // Non-string items become empty strings, which return "unknown" without calling fetch
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("detects language from Google Translate response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([null, null, "ko"]),
    });
    const res = await POST(makeRequest({ texts: ["안녕하세요"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["ko"]);
  });

  it("returns 'unknown' when Google Translate API fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      body: { cancel: vi.fn() },
    });
    const res = await POST(makeRequest({ texts: ["hello"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["unknown"]);
  });

  it("returns 'unknown' when fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network error"));
    const res = await POST(makeRequest({ texts: ["hello"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["unknown"]);
  });

  it("returns 'non-en' when detected as English but has non-Latin script", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([null, null, "en"]),
    });
    const res = await POST(makeRequest({ texts: ["こんにちは"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["non-en"]);
  });

  it("returns 'en' when detected as English and text is Latin", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([null, null, "en"]),
    });
    const res = await POST(makeRequest({ texts: ["hello world"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["en"]);
  });

  it("handles mixed valid and invalid texts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([null, null, "fr"]),
    });
    const res = await POST(makeRequest({ texts: ["bonjour", "", 42] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toEqual(["fr", "unknown", "unknown"]);
  });
});
