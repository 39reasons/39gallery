import { useState, useEffect, useCallback } from "react";

export function useCarousel(length: number) {
  const safeLength = Math.max(1, length);
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(safeLength - 1, i + 1));
  }, [safeLength]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(safeLength - 1, index)));
    },
    [safeLength],
  );

  // Shift+Arrow keyboard shortcuts
  useEffect(() => {
    if (safeLength <= 1) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "ArrowLeft") prev();
      if (e.shiftKey && e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [prev, next, safeLength]);

  return { currentIndex, prev, next, goTo };
}
