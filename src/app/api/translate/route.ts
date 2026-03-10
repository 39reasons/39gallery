import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TARGETS = new Set([
  "en", "ko", "ja", "zh", "es", "fr", "de", "pt", "ru", "ar", "hi", "th", "vi", "id",
]);
const MAX_TEXT_LENGTH = 5000;

export async function GET(request: NextRequest) {
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
    const data = await res.json();

    // Response format: [[["translated text","original text",...],...],...]
    const translated = (data[0] as [string][])
      .map((segment: [string]) => segment[0])
      .join("");
    const detectedLang = data[2] as string;

    return NextResponse.json({ translated, detectedLang });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
