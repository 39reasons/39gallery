import { NextRequest, NextResponse } from "next/server";

const NON_LATIN_RE = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/u;

function hasNonLatinScript(text: string): boolean {
  const stripped = text.replace(/[\p{Emoji}\p{Emoji_Component}\p{Emoji_Presentation}\p{Extended_Pictographic}\p{P}\p{S}\p{N}\s\u200d\ufe0f]/gu, "");
  return NON_LATIN_RE.test(stripped);
}

export async function POST(request: NextRequest) {
  const { texts } = await request.json() as { texts: string[] };

  if (!texts?.length) {
    return NextResponse.json({ languages: [] });
  }

  const languages = await Promise.all(
    texts.map(async (text) => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        const detected = data[2] as string;
        // Google sometimes misdetects short CJK/non-Latin text as "en"
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
