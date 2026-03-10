"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { MEMBERS, type MemberKey } from "@/types/instagram";

interface MemberTabsProps {
  selected: MemberKey;
  onSelect: (key: MemberKey) => void;
}

export function MemberTabs({ selected, onSelect }: MemberTabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % MEMBERS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + MEMBERS.length) % MEMBERS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = MEMBERS.length - 1;

    const target = next !== null ? MEMBERS[next] : undefined;
    if (target) {
      e.preventDefault();
      tabsRef.current[next!]?.focus();
      onSelect(target.key);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Members">
      {MEMBERS.map((member, i) => (
        <button
          key={member.key}
          ref={(el) => { tabsRef.current[i] = el; }}
          onClick={() => onSelect(member.key)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          role="tab"
          aria-selected={selected === member.key}
          tabIndex={selected === member.key ? 0 : -1}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selected === member.key
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          {member.displayName}
        </button>
      ))}
    </div>
  );
}
