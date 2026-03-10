"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxShellProps {
  onClose: () => void;
  onPrevPost?: () => void;
  onNextPost?: () => void;
  children: ReactNode;
  sidebar: ReactNode;
}

export function LightboxShell({ onClose, onPrevPost, onNextPost, children, sidebar }: LightboxShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus();

    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && e.shiftKey) return; // let children handle carousel
      if (e.key === "ArrowRight" && e.shiftKey) return;
      if (e.key === "ArrowLeft") onPrevPost?.();
      if (e.key === "ArrowRight") onNextPost?.();

      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]):not(:disabled)'
        );
        if (focusable.length === 0) return;
        const first = focusable.item(0);
        const last = focusable.item(focusable.length - 1);
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrevPost, onNextPost]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center outline-none"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 rounded-md"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onPrevPost?.(); }}
        disabled={!onPrevPost}
        className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 z-10 rounded-md focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 ${onPrevPost ? "text-white/60 hover:text-white" : "text-white/20 cursor-default"}`}
        aria-label="Previous post"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNextPost?.(); }}
        disabled={!onNextPost}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 z-10 rounded-md focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 ${onNextPost ? "text-white/60 hover:text-white" : "text-white/20 cursor-default"}`}
        aria-label="Next post"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      <div
        className="relative max-w-5xl w-full mx-4 flex flex-col md:flex-row bg-card rounded-lg overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {sidebar}
      </div>
    </div>
  );
}
