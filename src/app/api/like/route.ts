import { NextResponse } from "next/server";
import { igHeaders } from "@/lib/ig-session";
import { rateLimit } from "@/lib/rate-limit";

const NUMERIC_ID = /^\d{1,30}$/;

export async function POST(request: Request) {
  const { success } = rateLimit(request, { limit: 30, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { mediaId, unlike } = await request.json();

  if (!mediaId || typeof mediaId !== "string" || !NUMERIC_ID.test(mediaId)) {
    return NextResponse.json({ error: "valid mediaId is required" }, { status: 400 });
  }

  let headers: Record<string, string>;
  try {
    headers = igHeaders("POST");
  } catch {
    return NextResponse.json({ error: "No session configured" }, { status: 500 });
  }

  const action = unlike ? "unlike" : "like";
  const url = `https://www.instagram.com/api/v1/web/likes/${mediaId}/${action}/`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: "",
    });

    const json = await res.json();

    if (json.status !== "ok") {
      console.error("[like]", json.message ?? json.error_title ?? "Like failed");
      return NextResponse.json({ error: "Like action failed" }, { status: 400 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[like]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Like action failed" }, { status: 500 });
  }
}
