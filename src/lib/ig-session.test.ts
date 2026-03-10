import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must import after env setup since module has side effects
let getSession: typeof import("./ig-session").getSession;
let igHeaders: typeof import("./ig-session").igHeaders;

beforeEach(async () => {
  vi.stubEnv("IG_SESSION_ID", "12345%3Aabcdef");
  vi.stubEnv("IG_CSRF_TOKEN", "csrf_token_123");
  // Re-import to pick up env changes
  const mod = await import("./ig-session");
  getSession = mod.getSession;
  igHeaders = mod.igHeaders;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSession", () => {
  it("returns session data from env vars", () => {
    const session = getSession();
    expect(session.sessionId).toBe("12345%3Aabcdef");
    expect(session.csrfToken).toBe("csrf_token_123");
  });

  it("extracts dsUserId from sessionId before %3A", () => {
    const session = getSession();
    expect(session.dsUserId).toBe("12345");
  });

  it("uses full sessionId as dsUserId when no %3A delimiter", () => {
    vi.stubEnv("IG_SESSION_ID", "plain_session_id");
    const session = getSession();
    expect(session.dsUserId).toBe("plain_session_id");
  });

  it("throws when IG_SESSION_ID is not set", () => {
    vi.stubEnv("IG_SESSION_ID", "");
    expect(() => getSession()).toThrow("No session configured");
  });

  it("throws when IG_CSRF_TOKEN is not set", () => {
    vi.stubEnv("IG_CSRF_TOKEN", "");
    expect(() => getSession()).toThrow("No session configured");
  });
});

describe("igHeaders", () => {
  it("includes required Instagram headers for GET", () => {
    const headers = igHeaders();
    expect(headers["X-CSRFToken"]).toBe("csrf_token_123");
    expect(headers["X-IG-App-ID"]).toBe("936619743392459");
    expect(headers["Cookie"]).toContain("sessionid=12345%3Aabcdef");
    expect(headers["Cookie"]).toContain("csrftoken=csrf_token_123");
    expect(headers["Cookie"]).toContain("ds_user_id=12345");
  });

  it("does not include Content-Type for GET requests", () => {
    const headers = igHeaders();
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("does not include Content-Type for GET with explicit method", () => {
    const headers = igHeaders("GET");
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("includes Content-Type and Origin for POST requests", () => {
    const headers = igHeaders("POST");
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(headers["Origin"]).toBe("https://www.instagram.com");
  });

  it("sets Referer to Instagram", () => {
    const headers = igHeaders();
    expect(headers["Referer"]).toBe("https://www.instagram.com/");
  });
});
