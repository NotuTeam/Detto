"use client";

import { cn } from "@/lib/utils";

interface RangeSliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  displayValue?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function RangeSlider({ label, value, min, max, displayValue, onChange, className }: RangeSliderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || displayValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-[0.75rem] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{label}</span>}
          {displayValue && <span className="text-[0.75rem] font-bold text-[var(--accent)]">{displayValue}</span>}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 rounded-full bg-[var(--border-subtle)] outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(255,111,94,0.5)]"
      />
    </div>
  );
}
