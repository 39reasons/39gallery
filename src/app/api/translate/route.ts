import { NextRequest, NextResponse } from "next/server";
import { GTranslateResponse } from "@/types/google-translate";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TARGETS = new Set([
  "en", "ko", "ja", "zh", "es", "fr", "de", "pt", "ru", "ar", "hi", "th", "vi", "id",
]);
const MAX_TEXT_LENGTH = 5000;

export async function GET(request: NextRequest) {
  const { success } = rateLimit(request, { limit: 60, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const text = request.nextUrl.searchParams.get("text");
  const target = request.nextUrl.searchParams.get("target") ?? "en";

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "text too long" }, { status: 400 });
  }

  if (!ALLOWED_TARGETS.has(target)) {
    return NextResponse.json({ error: "unsupported target language" }, { status: 400 });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google Translate API error: ${res.status}`);
    }
    const data = (await res.json()) as GTranslateResponse;

    // Response format: [[["translated text","original text",...],...],...]
    if (!Array.isArray(data?.[0])) {
      throw new Error("Unexpected Google Translate response format");
    }
    const translated = data[0]
      .map((segment) => segment[0])
      .join("");
    const detectedLang = data[2];

    return NextResponse.json({ translated, detectedLang });
  } catch (error) {
    console.error("[translate]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
