import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "./rate-limit";

function mockRequest(ip: string): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimit", () => {
  beforeEach(() => {
    // Use unique IPs per test to avoid cross-test pollution
  });

  it("allows requests within limit", () => {
    const ip = `test-allow-${Date.now()}`;
    const { success, remaining } = rateLimit(mockRequest(ip), { limit: 5, windowMs: 60_000 });
    expect(success).toBe(true);
    expect(remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    const ip = `test-block-${Date.now()}`;
    const opts = { limit: 3, windowMs: 60_000 };

    rateLimit(mockRequest(ip), opts);
    rateLimit(mockRequest(ip), opts);
    rateLimit(mockRequest(ip), opts);
    const { success, remaining } = rateLimit(mockRequest(ip), opts);

    expect(success).toBe(false);
    expect(remaining).toBe(0);
  });

  it("treats different IPs independently", () => {
    const ts = Date.now();
    const opts = { limit: 1, windowMs: 60_000 };

    rateLimit(mockRequest(`ip-a-${ts}`), opts);
    const { success } = rateLimit(mockRequest(`ip-b-${ts}`), opts);

    expect(success).toBe(true);
  });

  it("uses x-real-ip when x-forwarded-for is missing", () => {
    const ip = `real-ip-${Date.now()}`;
    const req = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": ip },
    });
    const { success } = rateLimit(req, { limit: 5, windowMs: 60_000 });
    expect(success).toBe(true);
  });

  it("defaults to 'unknown' when no IP headers present", () => {
    const req = new Request("http://localhost/api/test");
    const { success } = rateLimit(req, { limit: 100, windowMs: 60_000 });
    expect(success).toBe(true);
  });
});
