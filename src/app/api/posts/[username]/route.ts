import { NextRequest, NextResponse } from "next/server";
import { fetchPosts } from "@/lib/instagram";
import { MEMBERS } from "@/types/instagram";

const MAX_ID_RE = /^[\w-]{1,60}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
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
    return NextResponse.json({ posts, nextMaxId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[posts/${username}]`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
