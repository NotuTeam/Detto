"use client";

import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Tag({ label, selected, onClick, className }: TagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-3.5 py-[7px] rounded-[var(--radius-sm)] text-[0.8rem] font-semibold border-[1.5px] cursor-pointer transition-all duration-150 ease-[var(--ease-smooth)]",
        selected
          ? "bg-[var(--surface-inverse)] border-[var(--surface-inverse)] text-[var(--text-inverse)]"
          : "border-[var(--border-subtle)] text-[var(--text-secondary)] bg-transparent hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      {label}
    </button>
  );
}
