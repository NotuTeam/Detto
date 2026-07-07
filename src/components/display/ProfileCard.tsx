"use client";

import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";
import { Heart, X, Star } from "lucide-react";

interface ProfileCardProps {
  name: string;
  subtitle?: string;
  avatarGradient?: string;
  avatarEmoji?: string;
  matchPercentage?: number;
  className?: string;
  onLike?: () => void;
  onPass?: () => void;
}

export function ProfileCard({ name, subtitle, avatarGradient, avatarEmoji, matchPercentage, className, onLike, onPass }: ProfileCardProps) {
  return (
    <div className={cn(
      "w-50 rounded-[var(--radius-lg)] bg-[var(--surface)] overflow-hidden shadow-[var(--shadow-md)] shrink-0 border border-[var(--border-subtle)]",
      className
    )}>
      <div className="relative w-full h-55 flex flex-col items-center justify-end pb-4"
        style={{ background: avatarGradient || "linear-gradient(160deg, var(--accent-strong) 0%, var(--brand-dark) 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,43,39,0.88)] via-transparent to-transparent" />
        {matchPercentage !== undefined && (
          <div className="absolute top-2.5 right-2.5 bg-[var(--accent)] text-[var(--text-on-accent)] text-[0.6rem] font-extrabold px-[9px] py-[3px] rounded-full flex items-center gap-1 z-10">
            <Heart size={10} fill="currentColor" /> {matchPercentage}%
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-15 h-15 rounded-full flex items-center justify-center text-[26px] mb-2 bg-[var(--accent-soft)]"
          >
            {avatarEmoji || "🧑"}
          </div>
          <span className="text-[1.15rem] text-white font-extrabold text-center">{name}</span>
          {subtitle && <span className="text-[0.8rem] text-white/70 mt-0.5">{subtitle}</span>}
        </div>
      </div>
      <div className="flex justify-center items-center gap-2.5 py-3 px-3.5">
        <IconButton onClick={onPass}><X size={16} /></IconButton>
        <IconButton variant="accent" size="lg"><Star size={20} fill="currentColor" /></IconButton>
        <IconButton variant="danger" onClick={onLike}><Heart size={16} fill="currentColor" /></IconButton>
      </div>
    </div>
  );
}
