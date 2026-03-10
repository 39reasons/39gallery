import { useState, useEffect, useCallback } from "react";

export function useCarousel(length: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(length - 1, i + 1));
  }, [length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(length - 1, index)));
    },
    [length],
  );

  // Shift+Arrow keyboard shortcuts
  useEffect(() => {
    if (length <= 1) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "ArrowLeft") prev();
      if (e.shiftKey && e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [prev, next, length]);

  return { currentIndex, prev, next, goTo };
}
