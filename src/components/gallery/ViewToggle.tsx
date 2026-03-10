"use client";

import { Instagram, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types/instagram";

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onModeChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-secondary p-1 gap-1" role="tablist" aria-label="View mode">
      <button
        onClick={() => onModeChange("instagram")}
        role="tab"
        aria-selected={mode === "instagram"}
        className={cn(
          "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
          mode === "instagram"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Instagram className="h-4 w-4" />
        Instagram
      </button>
      <button
        onClick={() => onModeChange("weverse")}
        role="tab"
        aria-selected={mode === "weverse"}
        className={cn(
          "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
          mode === "weverse"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MessageSquare className="h-4 w-4" />
        Weverse DM
      </button>
    </div>
  );
}
