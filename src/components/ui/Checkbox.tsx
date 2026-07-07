"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked = false, onChange, label, className }: CheckboxProps) {
  return (
    <label className={cn("flex items-center gap-2.5 cursor-pointer select-none", className)}>
      <div
        onClick={() => onChange?.(!checked)}
        className={cn(
          "w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-150",
          checked
            ? "bg-[var(--accent)] border-[var(--accent)]"
            : "border-[var(--border-strong)] bg-transparent"
        )}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-[var(--text-on-accent)]" />}
      </div>
      {label && <span className="text-[0.9rem] text-[var(--text-primary)] font-medium">{label}</span>}
    </label>
  );
}
