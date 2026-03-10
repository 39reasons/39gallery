import { NextRequest, NextResponse } from "next/server";
import { igWebFetch } from "@/lib/ig-web";
import { IgComment, IgCommentsResponse } from "@/types/instagram-api";
import { rateLimit } from "@/lib/rate-limit";

const NUMERIC_ID = /^\d{1,30}$/;

function mapComment(c: IgComment) {
  return {
    id: String(c.pk),
    username: c.user?.username ?? "",
    profilePicUrl: c.user?.profile_pic_url ?? "",
    text: c.text ?? "",
    createdAt: c.created_at ?? 0,
    likeCount: c.comment_like_count ?? 0,
    replyCount: c.child_comment_count ?? 0,
  };
}

export async function GET(request: NextRequest) {
  const { success } = rateLimit(request, { limit: 60, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const mediaId = request.nextUrl.searchParams.get("mediaId");
  const parentId = request.nextUrl.searchParams.get("parentId");

  if (!mediaId || !NUMERIC_ID.test(mediaId)) {
    return NextResponse.json({ error: "Valid mediaId is required" }, { status: 400 });
  }

  if (parentId && !NUMERIC_ID.test(parentId)) {
    return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
  }

  try {
    let url: string;
    if (parentId) {
      url = `https://www.instagram.com/api/v1/media/${mediaId}/comments/${parentId}/child_comments/`;
    } else {
      url = `https://www.instagram.com/api/v1/media/${mediaId}/comments/?can_support_threading=true`;
    }

    const json = await igWebFetch<IgCommentsResponse>(url);

    if (json.status !== "ok") {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const raw = parentId ? json.child_comments : json.comments;
    const comments = (raw ?? []).map(mapComment);

    return NextResponse.json({ comments }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[comments]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
