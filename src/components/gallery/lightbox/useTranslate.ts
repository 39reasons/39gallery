"use client";

import { useState, useRef } from "react";
import { DetectResponse, TranslateResponse } from "@/types/api-responses";

export async function detectLanguages(texts: string[]): Promise<string[]> {
  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    if (!res.ok) return texts.map(() => "unknown");
    const data = (await res.json()) as DetectResponse;
    return data.languages ?? texts.map(() => "unknown");
  } catch {
    return texts.map(() => "unknown");
  }
}

export function useTranslateButton(text: string, lang?: string) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const prevTextRef = useRef(text);
  if (prevTextRef.current !== text) {
    prevTextRef.current = text;
    setTranslated(null);
    setShowing(false);
  }

  const canTranslate = !!lang && lang !== "en";

  const toggle = async () => {
    if (showing) {
      setShowing(false);
      return;
    }
    if (translated !== null) {
      setShowing(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(text)}`);
      const data = (await res.json()) as TranslateResponse;
      setTranslated(data.translated ?? "Translation failed");
      setShowing(true);
    } catch {
      setTranslated("Translation failed");
      setShowing(true);
    } finally {
      setLoading(false);
    }
  };

  const displayText = showing && translated !== null ? translated : text;

  return { displayText, canTranslate, toggle, loading, showing };
}
