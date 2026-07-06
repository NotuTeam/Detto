"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

interface ConversationCardProps {
  name: string;
  subtitle: string;
  avatarGradient?: string;
  badge?: number;
  online?: boolean;
  className?: string;
}

export function ConversationCard({ name, subtitle, avatarGradient, badge, online, className }: ConversationCardProps) {
  return (
    <div className={cn(
      "bg-[var(--surface)] rounded-[var(--radius-md)] py-[13px] px-4 flex items-center gap-3 border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]",
      className
    )}>
      <Avatar name={name} gradient={avatarGradient || "linear-gradient(135deg, var(--accent), var(--brand-sage))"} online={online} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="text-[0.9rem] font-semibold text-[var(--text-primary)] truncate">{name}</div>
        <div className="text-[0.8rem] text-[var(--text-secondary)] truncate">{subtitle}</div>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-[7px] rounded-full bg-[var(--accent)] text-[var(--text-on-accent)] text-[0.7rem] font-extrabold flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}
