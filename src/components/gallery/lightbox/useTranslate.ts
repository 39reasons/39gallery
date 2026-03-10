"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DetectResponse, TranslateResponse } from "@/types/api-responses";

const DETECT_BATCH_SIZE = 50;

async function detectBatch(texts: string[]): Promise<string[]> {
  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return texts.map(() => "unknown");
    const data = (await res.json()) as DetectResponse;
    return data.languages ?? texts.map(() => "unknown");
  } catch {
    return texts.map(() => "unknown");
  }
}

export async function detectLanguages(texts: string[]): Promise<string[]> {
  if (texts.length <= DETECT_BATCH_SIZE) return detectBatch(texts);
  const results: string[] = [];
  for (let i = 0; i < texts.length; i += DETECT_BATCH_SIZE) {
    const batch = texts.slice(i, i + DETECT_BATCH_SIZE);
    const langs = await detectBatch(batch);
    results.push(...langs);
  }
  return results;
}

export function useTranslateButton(text: string, lang?: string) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [showing, setShowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTranslated(null);
    setShowing(false);
    setLoading(false);
    abortRef.current?.abort();
    abortRef.current = null;
  }, [text]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const canTranslate = !!lang && lang !== "en";

  const toggle = useCallback(async () => {
    if (showing) {
      setShowing(false);
      return;
    }
    if (translated !== null) {
      setShowing(true);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
      });
      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error("Translation request failed");
      const data = (await res.json()) as TranslateResponse;
      if (controller.signal.aborted) return;
      setTranslated(data.translated ?? "Translation failed");
      setShowing(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setTranslated("Translation failed");
        setShowing(true);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [showing, translated, text]);

  const displayText = showing && translated !== null ? translated : text;

  return { displayText, canTranslate, toggle, loading, showing };
}
