import { NextResponse } from "next/server";

const IG_APP_ID = "936619743392459";
const WEB_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function POST(request: Request) {
  const { mediaId, unlike } = await request.json();

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  const sessionId = process.env.IG_SESSION_ID;
  const csrfToken = process.env.IG_CSRF_TOKEN;
  if (!sessionId || !csrfToken) {
    return NextResponse.json({ error: "No session configured" }, { status: 500 });
  }

  const action = unlike ? "unlike" : "like";
  const url = `https://www.instagram.com/api/v1/web/likes/${mediaId}/${action}/`;
  const dsUserId = sessionId.split("%3A")[0];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": WEB_UA,
        "X-CSRFToken": csrfToken,
        "X-IG-App-ID": IG_APP_ID,
        "X-IG-WWW-Claim": "0",
        "X-Instagram-AJAX": "1",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://www.instagram.com",
        Referer: "https://www.instagram.com/",
        Cookie: `sessionid=${sessionId}; csrftoken=${csrfToken}; ds_user_id=${dsUserId}`,
      },
      body: "",
    });

    const json = await res.json();

    if (json.status !== "ok") {
      return NextResponse.json(
        { error: json.message ?? json.error_title ?? "Like failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
