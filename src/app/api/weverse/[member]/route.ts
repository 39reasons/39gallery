import { NextResponse } from "next/server";
import { fetchWeversePosts } from "@/lib/weverse";
import { MEMBERS, MemberKey } from "@/types/instagram";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ member: string }> }
) {
  const { success } = rateLimit(request, { limit: 30, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { member } = await params;

  const validKeys = MEMBERS.map((m) => m.key);
  if (!validKeys.includes(member as MemberKey)) {
    return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  }

  try {
    const posts = await fetchWeversePosts(member as MemberKey);
    return NextResponse.json({ posts }, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("[weverse]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch DM updates" }, { status: 500 });
  }
}
