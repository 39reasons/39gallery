import { describe, it, expect } from "vitest";
import { timeAgo } from "./time";

describe("timeAgo", () => {
  const now = () => Math.floor(Date.now() / 1000);

  it("returns 'now' for current timestamp", () => {
    expect(timeAgo(now())).toBe("now");
  });

  it("returns 'now' for future timestamps", () => {
    expect(timeAgo(now() + 100)).toBe("now");
  });

  it("returns seconds for < 60s", () => {
    expect(timeAgo(now() - 30)).toBe("30s");
  });

  it("returns minutes for < 60m", () => {
    expect(timeAgo(now() - 300)).toBe("5m");
  });

  it("returns hours for < 24h", () => {
    expect(timeAgo(now() - 7200)).toBe("2h");
  });

  it("returns days for < 7d", () => {
    expect(timeAgo(now() - 86400 * 3)).toBe("3d");
  });

  it("returns weeks for >= 7d", () => {
    expect(timeAgo(now() - 86400 * 14)).toBe("2w");
  });
});
