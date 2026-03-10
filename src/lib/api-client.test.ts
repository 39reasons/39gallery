import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiError, apiFetch } from "./api-client";

describe("ApiError", () => {
  it("stores status and message", () => {
    const err = new ApiError(404, "Not found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const err = new ApiError(500, "Server error");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns parsed JSON on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "hello" }),
    });

    const result = await apiFetch<{ data: string }>("/api/test");
    expect(result).toEqual({ data: "hello" });
  });

  it("throws ApiError with server error message on failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad input" }),
    });

    await expect(apiFetch("/api/test")).rejects.toThrow(ApiError);
    try {
      await apiFetch("/api/test");
    } catch (e) {
      const err = e as ApiError;
      expect(err.status).toBe(400);
      expect(err.message).toBe("Bad input");
    }
  });

  it("falls back to generic message when error body is not JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("not json")),
    });

    try {
      await apiFetch("/api/test");
    } catch (e) {
      const err = e as ApiError;
      expect(err.status).toBe(502);
      expect(err.message).toBe("Request failed (502)");
    }
  });

  it("falls back to generic message when error has no error field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ message: "rate limited" }),
    });

    try {
      await apiFetch("/api/test");
    } catch (e) {
      const err = e as ApiError;
      expect(err.message).toBe("Request failed (429)");
    }
  });

  it("falls back to generic message when error field is non-string", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { nested: true } }),
    });

    try {
      await apiFetch("/api/test");
    } catch (e) {
      const err = e as ApiError;
      expect(err.message).toBe("Request failed (500)");
    }
  });

  it("passes options through to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    await apiFetch("/api/test", { method: "POST", body: "data" });
    expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      method: "POST",
      body: "data",
    }));
  });

  it("preserves timeout when caller provides a signal", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await apiFetch("/api/test", { signal: controller.signal });

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    // Signal should NOT be the caller's raw signal (it should be a combined signal)
    expect(opts.signal).not.toBe(controller.signal);
    expect(opts.signal).toBeDefined();
    // The combined signal should not be aborted
    expect(opts.signal!.aborted).toBe(false);
    // Aborting the caller's controller should abort the combined signal
    controller.abort();
    expect(opts.signal!.aborted).toBe(true);
  });
});
