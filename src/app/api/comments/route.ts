import { NextRequest, NextResponse } from "next/server";
import { igWebFetch } from "@/lib/ig-web";
import { IgComment, IgCommentsResponse } from "@/types/instagram-api";

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
  const mediaId = request.nextUrl.searchParams.get("mediaId");
  const parentId = request.nextUrl.searchParams.get("parentId");

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  try {
    let url: string;
    if (parentId) {
      url = `https://www.instagram.com/api/v1/media/${mediaId}/comments/${parentId}/child_comments/`;
    } else {
      url = `https://www.instagram.com/api/v1/media/${mediaId}/comments/?can_support_threading=true`;
    }

    const json = (await igWebFetch(url)) as unknown as IgCommentsResponse;

    if (json.status !== "ok") {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const raw = parentId ? json.child_comments : json.comments;
    const comments = (raw ?? []).map(mapComment);

    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
