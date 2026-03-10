"use client";

import { useRef } from "react";
import { Instagram, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types/instagram";

interface ViewToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const MODES: { key: ViewMode; label: string; icon: typeof Instagram }[] = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "weverse", label: "Weverse DM", icon: MessageSquare },
];

export function ViewToggle({ mode, onModeChange }: ViewToggleProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % MODES.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + MODES.length) % MODES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = MODES.length - 1;

    const target = next !== null ? MODES[next] : undefined;
    if (target) {
      e.preventDefault();
      tabsRef.current[next!]?.focus();
      onModeChange(target.key);
    }
  };

  return (
    <div className="inline-flex rounded-lg bg-secondary p-1 gap-1" role="tablist" aria-label="View mode">
      {MODES.map((m, i) => {
        const Icon = m.icon;
        return (
          <button
            key={m.key}
            ref={(el) => { tabsRef.current[i] = el; }}
            onClick={() => onModeChange(m.key)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            role="tab"
            aria-selected={mode === m.key}
            tabIndex={mode === m.key ? 0 : -1}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              mode === m.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
