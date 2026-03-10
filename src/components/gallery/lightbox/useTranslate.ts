"use client";

import { useState, useRef } from "react";

export async function detectLanguages(texts: string[]): Promise<string[]> {
  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    const data = await res.json();
    return data.languages;
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
      const data = await res.json();
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
