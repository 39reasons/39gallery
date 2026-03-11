import { NextRequest, NextResponse } from "next/server";
import { fetchPosts } from "@/lib/instagram";
import { MEMBERS } from "@/types/instagram";
import { rateLimit } from "@/lib/rate-limit";

const MAX_ID_RE = /^[\w-]{1,60}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { success } = rateLimit(request, { limit: 120, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { username } = await params;
  const maxId = request.nextUrl.searchParams.get("max_id") ?? undefined;

  const validUsernames = MEMBERS.map((m) => m.username);
  if (!validUsernames.includes(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  if (maxId && !MAX_ID_RE.test(maxId)) {
    return NextResponse.json({ error: "Invalid max_id" }, { status: 400 });
  }

  try {
    const { posts, nextMaxId } = await fetchPosts(username, maxId);
    return NextResponse.json({ posts, nextMaxId }, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  } catch (error) {
    console.error(`[posts/${username}]`, error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
