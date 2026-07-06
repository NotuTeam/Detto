"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[0.6rem] font-semibold tracking-[0.06em] uppercase" style={{ color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-[var(--input-bg)] border-[1.5px] border-transparent rounded-[var(--radius-md)] py-[13px] px-4 text-[0.9rem] text-[var(--text-primary)] font-medium outline-none transition-all duration-200 box-border placeholder:text-[var(--text-secondary)] placeholder:font-normal focus:border-[var(--accent)]",
            error && "border-red-500 focus:border-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-[0.7rem] text-[var(--text-secondary)]">{hint}</p>}
        {error && <p className="text-[0.7rem] text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
