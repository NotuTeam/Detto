"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showPercentage = true, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-[0.75rem] font-semibold text-[var(--text-secondary)] tracking-[0.04em] uppercase">{label}</span>}
          {showPercentage && <span className="text-[0.75rem] font-bold text-[var(--accent)]">{pct}%</span>}
        </div>
      )}
      <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-400 ease-[var(--ease-smooth)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
