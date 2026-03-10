import { NextResponse } from "next/server";
import { fetchWeversePosts } from "@/lib/weverse";
import { MEMBERS, MemberKey } from "@/types/instagram";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ member: string }> }
) {
  const { member } = await params;

  const validKeys = MEMBERS.map((m) => m.key);
  if (!validKeys.includes(member as MemberKey)) {
    return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  }

  try {
    const posts = await fetchWeversePosts(member as MemberKey);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[weverse]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch DM updates" }, { status: 500 });
  }
}
