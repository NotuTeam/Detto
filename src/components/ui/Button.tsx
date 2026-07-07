"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark" | "plain";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--text-on-accent)] font-bold hover:brightness-108 active:scale-[0.97]",
  secondary:
    "bg-[var(--surface)] text-[var(--text-primary)] font-bold border border-[var(--border-subtle)] hover:brightness-95 active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--text-primary)] font-semibold border-[1.5px] border-[var(--border-strong)] hover:bg-[var(--surface-alt)]",
  danger:
    "bg-red-500 text-white font-bold hover:opacity-90 active:scale-[0.97]",
  dark: "bg-[var(--surface-inverse)] text-[var(--text-inverse)] font-bold hover:opacity-90 active:scale-[0.97]",
  plain: "bg-transparent text-[var(--text-primary)] font-semibold",
};

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-5 text-[0.8rem] font-bold",
  md: "py-[13px] px-5.5 text-[0.9rem]",
  lg: "py-4 px-8 text-[0.9rem] font-semibold",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      rounded = true,
      loading,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 ease-[var(--ease-smooth)] cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          rounded ? "rounded-full" : "rounded-sm",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
