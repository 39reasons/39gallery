import { NextResponse } from "next/server";
import { fetchPosts } from "@/lib/instagram";
import { MEMBERS } from "@/types/instagram";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const validUsernames = MEMBERS.map((m) => m.username);
  if (!validUsernames.includes(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const posts = fetchPosts(username);
    return NextResponse.json({ posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
