import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 100 }),
}));

const { POST } = await import("./route");

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/translate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("POST /api/translate", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/translate", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 when text is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Text is required");
  });

  it("returns 400 when text is not a string", async () => {
    const res = await POST(makeRequest({ text: 123 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Text is required");
  });

  it("returns 400 when text exceeds max length", async () => {
    const res = await POST(makeRequest({ text: "x".repeat(5001) }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Text too long");
  });

  it("returns 400 for unsupported target language", async () => {
    const res = await POST(makeRequest({ text: "hello", target: "xx" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Unsupported target language");
  });

  it("defaults target to 'en' when not provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["hello", "bonjour"]], null, "fr"]),
    });
    globalThis.fetch = mockFetch;

    await POST(makeRequest({ text: "bonjour" }));

    const fetchUrl = (mockFetch.mock.calls[0] as [string])[0];
    expect(fetchUrl).toContain("tl=en");
  });

  it("uses provided target language", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["bonjour", "hello"]], null, "en"]),
    });
    globalThis.fetch = mockFetch;

    await POST(makeRequest({ text: "hello", target: "fr" }));

    const fetchUrl = (mockFetch.mock.calls[0] as [string])[0];
    expect(fetchUrl).toContain("tl=fr");
  });

  it("returns translated text on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["translated text", "original"]], null, "ko"]),
    });
    const res = await POST(makeRequest({ text: "원본 텍스트" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translated).toBe("translated text");
    expect(data.detectedLang).toBe("ko");
  });

  it("joins multiple translation segments", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["Hello ", "안녕 "], ["world", "세계"]], null, "ko"]),
    });
    const res = await POST(makeRequest({ text: "안녕 세계" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translated).toBe("Hello world");
  });

  it("returns 500 when Google Translate API fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      body: { cancel: vi.fn() },
    });
    const res = await POST(makeRequest({ text: "hello" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Translation failed");
  });

  it("returns 500 when response format is unexpected", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ unexpected: true }),
    });
    const res = await POST(makeRequest({ text: "hello" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Translation failed");
  });

  it("includes Cache-Control header on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([[["hi", "hello"]], null, "en"]),
    });
    const res = await POST(makeRequest({ text: "hello" }));
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=3600");
  });
});
