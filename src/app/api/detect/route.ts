import { NextRequest, NextResponse } from "next/server";
import { GTranslateResponse } from "@/types/google-translate";
import { rateLimit } from "@/lib/rate-limit";

const NON_LATIN_RE = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/u;

const MAX_TEXTS = 50;
const MAX_TEXT_LENGTH = 5000;

function hasNonLatinScript(text: string): boolean {
  const stripped = text.replace(/[\p{Emoji}\p{Emoji_Component}\p{Emoji_Presentation}\p{Extended_Pictographic}\p{P}\p{S}\p{N}\s\u200d\ufe0f]/gu, "");
  return NON_LATIN_RE.test(stripped);
}

export async function POST(request: NextRequest) {
  const { success } = rateLimit(request, { limit: 120, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const texts: unknown = body?.texts;

  if (!Array.isArray(texts)) {
    return NextResponse.json({ error: "texts must be an array" }, { status: 400 });
  }

  if (texts.length === 0) {
    return NextResponse.json({ languages: [] });
  }

  if (texts.length > MAX_TEXTS) {
    return NextResponse.json({ error: "too many texts" }, { status: 400 });
  }

  const validTexts = texts.map((t) => (typeof t === "string" ? t.slice(0, MAX_TEXT_LENGTH) : ""));

  const languages = await Promise.all(
    validTexts.map(async (text) => {
      if (!text) return "unknown";
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) return "unknown";
        const data = (await res.json()) as GTranslateResponse;
        const detected = data?.[2];
        if (detected === "en" && hasNonLatinScript(text)) {
          return "non-en";
        }
        return detected;
      } catch {
        return "unknown";
      }
    })
  );

  return NextResponse.json({ languages });
}
