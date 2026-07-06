"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  default: "border-[var(--border-subtle)] bg-[var(--surface-alt)] text-[var(--text-primary)] hover:bg-[var(--surface)]",
  accent: "bg-[var(--accent)] border-[var(--accent)] text-[var(--text-on-accent)]",
  danger: "bg-red-500 border-red-500 text-white",
};

const sizeStyles: Record<string, string> = {
  sm: "w-10 h-10",
  md: "w-[46px] h-[46px]",
  lg: "w-[52px] h-[52px]",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150 ease-[var(--ease-smooth)] active:scale-95",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton };
