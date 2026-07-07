import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "default" | "accent" | "success" | "danger" | "warning" | "dark";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-[var(--border-subtle)] text-[var(--text-secondary)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  danger: "bg-red-500/15 text-red-500",
  warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
  dark: "bg-[var(--surface-inverse)] text-[var(--text-inverse)]",
};

export function Badge({ label, variant = "accent", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-5.5 h-5.5 px-[7px] rounded-full text-[0.7rem] font-extrabold",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
