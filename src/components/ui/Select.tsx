"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[0.6rem] font-semibold text-[var(--text-on-accent)] tracking-[0.06em] uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "appearance-none w-full bg-[var(--input-bg)] border-[1.5px] border-transparent rounded-[var(--radius-md)] py-[13px] pl-4 pr-10 text-[0.9rem] text-[var(--text-primary)] font-medium outline-none cursor-pointer transition-all duration-200 focus:border-[var(--accent)]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
