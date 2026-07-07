import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  gradient?: string;
  className?: string;
}

const sizeStyles: Record<string, string> = {
  xs: "w-9 h-9 text-[13px]",
  sm: "w-12 h-12 text-base",
  md: "w-16 h-16 text-xl",
  lg: "w-20 h-20 text-2xl",
  xl: "w-24 h-24 text-3xl",
};

export function Avatar({ src, name, size = "md", online, gradient, className }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden font-bold",
          gradient
            ? ""
            : "bg-[var(--accent)] text-[var(--text-on-accent)]",
          sizeStyles[size],
          className
        )}
        style={gradient ? { background: gradient } : undefined}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--success)] rounded-full border-2 border-[var(--surface)]" />
      )}
    </div>
  );
}
