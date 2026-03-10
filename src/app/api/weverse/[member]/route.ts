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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
