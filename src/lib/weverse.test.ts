import { describe, it, expect } from "vitest";
import {
  isWeverseDm,
  extractImageUrls,
  stripHtml,
  detectMember,
  tweetUrlFromLink,
} from "./weverse";

describe("isWeverseDm", () => {
  it("matches 'weverse dm'", () => {
    expect(isWeverseDm("New weverse dm from Sakura")).toBe(true);
  });

  it("matches 'weverse message'", () => {
    expect(isWeverseDm("weverse message update")).toBe(true);
  });

  it("matches 'Weverse Update'", () => {
    expect(isWeverseDm("Weverse Update")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isWeverseDm("WEVERSE DM")).toBe(true);
  });

  it("rejects unrelated text", () => {
    expect(isWeverseDm("Instagram post")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isWeverseDm("")).toBe(false);
  });
});

describe("extractImageUrls", () => {
  it("extracts single image URL", () => {
    const html = '<img src="https://example.com/img.jpg" />';
    expect(extractImageUrls(html)).toEqual(["https://example.com/img.jpg"]);
  });

  it("extracts multiple image URLs", () => {
    const html = '<img src="https://a.com/1.jpg" /><img src="https://b.com/2.jpg" />';
    expect(extractImageUrls(html)).toEqual(["https://a.com/1.jpg", "https://b.com/2.jpg"]);
  });

  it("returns empty array for no images", () => {
    expect(extractImageUrls("<p>No images here</p>")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractImageUrls("")).toEqual([]);
  });
});

describe("stripHtml", () => {
  it("converts br tags to newlines", () => {
    expect(stripHtml("line1<br/>line2")).toBe("line1\nline2");
  });

  it("extracts link text", () => {
    expect(stripHtml('<a href="https://x.com">click here</a>')).toBe("click here");
  });

  it("removes other HTML tags", () => {
    expect(stripHtml("<p><strong>bold</strong> text</p>")).toBe("bold text");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("&amp; &lt; &gt; &quot;")).toBe('& < > "');
  });

  it("trims whitespace", () => {
    expect(stripHtml("  hello  ")).toBe("hello");
  });
});

describe("detectMember", () => {
  it("detects Chaewon", () => {
    const result = detectMember("Chaewon weverse update");
    expect(result).toEqual({ key: "chaewon", name: "Chaewon" });
  });

  it("detects Sakura by alias", () => {
    const result = detectMember("kkura posted on weverse");
    expect(result).toEqual({ key: "sakura", name: "Sakura" });
  });

  it("detects Yunjin", () => {
    const result = detectMember("Yunjin DM update");
    expect(result).toEqual({ key: "yunjin", name: "Yunjin" });
  });

  it("detects Kazuha by Korean name", () => {
    const result = detectMember("카즈하 weverse message");
    expect(result).toEqual({ key: "kazuha", name: "Kazuha" });
  });

  it("detects Eunchae", () => {
    const result = detectMember("Eunchae new update");
    expect(result).toEqual({ key: "eunchae", name: "Eunchae" });
  });

  it("returns null for unrecognized text", () => {
    expect(detectMember("random text")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectMember("")).toBeNull();
  });
});

describe("tweetUrlFromLink", () => {
  it("converts nitter URL to x.com URL", () => {
    expect(tweetUrlFromLink("https://nitter.net/sserapics/status/123#m"))
      .toBe("https://x.com/sserapics/status/123");
  });

  it("removes trailing #m", () => {
    expect(tweetUrlFromLink("https://nitter.net/user/status/456#m"))
      .toBe("https://x.com/user/status/456");
  });

  it("handles URLs without #m", () => {
    expect(tweetUrlFromLink("https://nitter.net/user/status/789"))
      .toBe("https://x.com/user/status/789");
  });

  it("passes through non-nitter URLs unchanged", () => {
    expect(tweetUrlFromLink("https://example.com/path"))
      .toBe("https://example.com/path");
  });

  it("handles empty string", () => {
    expect(tweetUrlFromLink("")).toBe("");
  });
});
