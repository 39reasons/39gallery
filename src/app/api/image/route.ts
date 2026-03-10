import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export async function GET(request: NextRequest) {
  const { success } = rateLimit(request, { limit: 120, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const allowedHosts = [
      ".cdninstagram.com",
      ".fbcdn.net",
      "nitter.net",
      "pbs.twimg.com",
    ];
    const isAllowed = allowedHosts.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(host)
    );
    if (!isAllowed) {
      return NextResponse.json({ error: "Invalid image host" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("[image-proxy] upstream fetch failed:", error instanceof Error ? error.message : error);
    return new NextResponse(null, { status: 502 });
  }

  if (!response.ok && response.status !== 206) {
    return new NextResponse(null, { status: response.status });
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const contentLength = response.headers.get("content-length");
  const isVideo = contentType.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    return NextResponse.json({ error: "Response too large" }, { status: 413 });
  }

  // Reject responses without content-length to prevent unbounded streaming
  if (!contentLength && !rangeHeader) {
    return NextResponse.json({ error: "Missing content length" }, { status: 502 });
  }

  const responseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400",
    "Accept-Ranges": "bytes",
  };

  if (contentLength) {
    responseHeaders["Content-Length"] = contentLength;
  }

  const contentRange = response.headers.get("content-range");
  if (contentRange) {
    responseHeaders["Content-Range"] = contentRange;
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
