"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function StarRating({ value = 0, onChange, readOnly = false, size = "md", showValue = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const starSize = sizeMap[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readOnly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={cn(
              "transition-transform duration-100",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default"
            )}
          >
            <Star
              size={starSize}
              className={cn(
                "transition-colors",
                filled ? "fill-[var(--accent)] text-[var(--accent)]" : "fill-transparent text-[var(--text-secondary)]/30"
              )}
            />
          </button>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1 text-[var(--text-secondary)] text-sm">{value}</span>
      )}
    </div>
  );
}
