import { NextResponse } from "next/server";
import { igHeaders } from "@/lib/ig-session";

const NUMERIC_ID = /^\d{1,30}$/;

export async function POST(request: Request) {
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
