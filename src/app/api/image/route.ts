import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { WEB_UA } from "@/lib/ig-session";

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

  if (url.length > 2048) {
    return NextResponse.json({ error: "URL too long" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Only HTTPS URLs are allowed" }, { status: 400 });
    }
    const allowedSuffixes = [
      ".cdninstagram.com",
      ".fbcdn.net",
      ".nitter.net",
      ".pbs.twimg.com",
    ];
    const isAllowed = allowedSuffixes.some(
      (suffix) => parsed.hostname === suffix.slice(1) || parsed.hostname.endsWith(suffix)
    );
    if (!isAllowed) {
      return NextResponse.json({ error: "Invalid image host" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const upstreamHeaders: Record<string, string> = {
    "User-Agent": WEB_UA,
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
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  if (!response.ok && response.status !== 206) {
    response.body?.cancel();
    return NextResponse.json({ error: "Upstream returned an error" }, { status: response.status });
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
    response.body?.cancel();
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const contentLength = response.headers.get("content-length");
  const isVideo = contentType.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const parsedSize = contentLength ? parseInt(contentLength, 10) : NaN;
  if (contentLength && (isNaN(parsedSize) || parsedSize < 0 || parsedSize > maxSize)) {
    response.body?.cancel();
    return NextResponse.json({ error: "Response too large" }, { status: 413 });
  }

  const responseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
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

  // If no Content-Length, cap the stream at maxSize to prevent unbounded streaming
  if (!contentLength && response.body) {
    let received = 0;
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > maxSize) {
          controller.error(new Error("Response too large"));
          return;
        }
        controller.enqueue(chunk);
      },
    });
    return new NextResponse(response.body.pipeThrough(transform), {
      status: response.status,
      headers: responseHeaders,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
