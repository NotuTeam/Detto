import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      {illustration && (
        <Image
          src={illustration}
          alt="Meet"
          width={100}
          height={100}
          className="mb-8 w-auto h-25 rotate-10"
        />
      )}
      {Icon && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--accent-soft)" }}
        >
          <Icon size={28} style={{ color: "var(--accent)" }} />
        </div>
      )}
      <h3
        className="text-[1.15rem] font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-[0.8rem] max-w-70 mb-6 "
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
