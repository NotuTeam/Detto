"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CardDecor } from "@/components/ui/DecorativeBlobs";

interface PremiumCardProps {
  planName?: string;
  price?: string;
  currency?: string;
  onAction?: () => void;
  className?: string;
}

export function PremiumCard({ planName = "Premium", price = "50", currency = "$/mth", onAction, className }: PremiumCardProps) {
  return (
    <div className={cn(
      "bg-[var(--surface-inverse)] rounded-[var(--radius-lg)] p-[18px] px-5 relative overflow-hidden shadow-[var(--shadow-md)]",
      className
    )}>
      <CardDecor seed={7} />
      <div className="text-[0.75rem] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.06em] mb-1 relative">Current plan</div>
      <div className="text-[1.5rem] text-[var(--text-inverse)] font-extrabold mb-3 relative">{planName} ✦</div>
      <div className="absolute top-4 right-5 bg-[var(--accent)] text-[var(--text-on-accent)] text-[0.75rem] font-extrabold px-2.5 py-1 rounded-full">
        {price} <span className="text-[10px]">{currency}</span>
      </div>
      <Button size="sm" className="relative" onClick={onAction}>Change subscription</Button>
    </div>
  );
}
