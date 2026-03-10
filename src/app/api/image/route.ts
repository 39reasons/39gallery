import { NextRequest, NextResponse } from "next/server";

const MAX_RESPONSE_SIZE = 100 * 1024 * 1024; // 100 MB

export async function GET(request: NextRequest) {
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

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    return new NextResponse(null, { status: response.status });
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    return NextResponse.json({ error: "Response too large" }, { status: 413 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
