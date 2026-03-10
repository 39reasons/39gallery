import { describe, it, expect } from "vitest";
import { bestImageUrl, proxyUrl } from "./instagram";

describe("proxyUrl", () => {
  it("wraps URL with proxy endpoint", () => {
    expect(proxyUrl("https://instagram.com/img.jpg"))
      .toBe("/api/image?url=https%3A%2F%2Finstagram.com%2Fimg.jpg");
  });

  it("returns empty string for empty input", () => {
    expect(proxyUrl("")).toBe("");
  });

  it("encodes special characters in URL", () => {
    const url = "https://example.com/img?a=1&b=2";
    expect(proxyUrl(url)).toBe(`/api/image?url=${encodeURIComponent(url)}`);
  });
});

describe("bestImageUrl", () => {
  it("returns URL of largest image by area", () => {
    const item = {
      image_versions2: {
        candidates: [
          { url: "https://example.com/small.jpg", width: 100, height: 100 },
          { url: "https://example.com/large.jpg", width: 1080, height: 1080 },
          { url: "https://example.com/medium.jpg", width: 640, height: 640 },
        ],
      },
    };
    expect(bestImageUrl(item)).toBe("https://example.com/large.jpg");
  });

  it("returns empty string when no candidates", () => {
    expect(bestImageUrl({ image_versions2: { candidates: [] } })).toBe("");
  });

  it("returns empty string when image_versions2 is undefined", () => {
    expect(bestImageUrl({})).toBe("");
  });

  it("returns empty string when candidates is undefined", () => {
    expect(bestImageUrl({ image_versions2: {} })).toBe("");
  });

  it("returns single candidate URL", () => {
    const item = {
      image_versions2: {
        candidates: [
          { url: "https://example.com/only.jpg", width: 500, height: 500 },
        ],
      },
    };
    expect(bestImageUrl(item)).toBe("https://example.com/only.jpg");
  });

  it("prefers wider image when heights are equal", () => {
    const item = {
      image_versions2: {
        candidates: [
          { url: "https://example.com/narrow.jpg", width: 640, height: 1080 },
          { url: "https://example.com/wide.jpg", width: 1080, height: 1080 },
        ],
      },
    };
    expect(bestImageUrl(item)).toBe("https://example.com/wide.jpg");
  });
});
