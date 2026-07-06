import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "inverse" | "gradient";
  padding?: "sm" | "md" | "lg";
}

const variantStyles: Record<string, string> = {
  default: "bg-[var(--surface)] border border-[var(--border-subtle)]",
  elevated: "bg-[var(--surface)] shadow-[var(--shadow-md)]",
  interactive:
    "bg-[var(--surface)] border border-[var(--border-subtle)] hover:shadow-[var(--shadow-md)] active:scale-[0.98] transition-all duration-150 ease-[var(--ease-smooth)] cursor-pointer",
  inverse: "bg-[var(--surface-inverse)] text-[var(--text-inverse)]",
  gradient:
    "bg-gradient-to-br from-[var(--surface-inverse)] to-[var(--brand-dark)] text-[var(--text-inverse)] relative overflow-hidden",
};

const paddingStyles: Record<string, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "default", padding = "md", className, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)]",
          variantStyles[variant],
          paddingStyles[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
