"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className={cn("w-full h-1", className)} style={{ background: "var(--border-subtle)" }}>
      <div
        className="h-full transition-all duration-500 ease-[var(--ease-smooth)]"
        style={{ width: `${pct}%`, background: "var(--accent)" }}
      />
    </div>
  );
}
