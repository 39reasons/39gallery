"use client";

import { cn } from "@/lib/utils";
import { MEMBERS, type MemberKey } from "@/types/instagram";

interface MemberTabsProps {
  selected: MemberKey;
  onSelect: (key: MemberKey) => void;
}

export function MemberTabs({ selected, onSelect }: MemberTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {MEMBERS.map((member) => (
        <button
          key={member.key}
          onClick={() => onSelect(member.key)}
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
