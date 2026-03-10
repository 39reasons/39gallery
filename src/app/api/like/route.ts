import { NextResponse } from "next/server";
import { igHeaders } from "@/lib/ig-session";
import { rateLimit } from "@/lib/rate-limit";

const NUMERIC_ID = /^\d{1,30}$/;

export async function POST(request: Request) {
  const { success } = rateLimit(request, { limit: 30, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  let mediaId: unknown;
  let unlike: unknown;
  try {
    const body = await request.json();
    mediaId = body?.mediaId;
    unlike = body?.unlike;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!mediaId || typeof mediaId !== "string" || !NUMERIC_ID.test(mediaId)) {
    return NextResponse.json({ error: "Valid mediaId is required" }, { status: 400 });
  }

  let headers: Record<string, string>;
  try {
    headers = igHeaders("POST");
  } catch {
    return NextResponse.json({ error: "No session configured" }, { status: 500 });
  }

  const action = unlike === true ? "unlike" : "like";
  const url = `https://www.instagram.com/api/v1/web/likes/${mediaId}/${action}/`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: "",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      res.body?.cancel();
      console.error("[like]", `Instagram returned ${res.status}`);
      return NextResponse.json({ error: "Like action failed" }, { status: 502 });
    }

    let json: Record<string, unknown>;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Like action failed" }, { status: 500 });
    }

    if (json?.status !== "ok") {
      const msg = typeof json?.message === "string" ? json.message
        : typeof json?.error_title === "string" ? json.error_title
        : "Like failed";
      console.error("[like]", msg);
      return NextResponse.json({ error: "Like action failed" }, { status: 400 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[like]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Like action failed" }, { status: 500 });
  }
}
