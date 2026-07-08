"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, UtensilsCrossed, Coffee, Clapperboard, Plane, ShoppingBag, Heart, Cake, Gift, Users, Pin, Music, Dumbbell, Gamepad2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardDecor } from "@/components/ui/DecorativeBlobs";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  DATE: Calendar,
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  MOVIE: Clapperboard,
  TRAVEL: Plane,
  SHOPPING: ShoppingBag,
  ANNIVERSARY: Heart,
  BIRTHDAY: Cake,
  HOLIDAY: Gift,
  FAMILY: Users,
  CONCERT: Music,
  WORKOUT: Dumbbell,
  PLAYTIME: Gamepad2,
  OTHER: Pin,
};

const CATEGORY_LABEL: Record<string, string> = {
  DATE: "Date",
  RESTAURANT: "Restaurant",
  CAFE: "Cafe",
  MOVIE: "Movie",
  TRAVEL: "Travel",
  SHOPPING: "Shopping",
  ANNIVERSARY: "Anniversary",
  BIRTHDAY: "Birthday",
  HOLIDAY: "Holiday",
  FAMILY: "Family",
  CONCERT: "Concert",
  WORKOUT: "Workout",
  PLAYTIME: "Playtime",
  OTHER: "Other",
};

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: string;
  locationName: string | null;
  locationUrl: string | null;
  status: string;
  createdBy: string;
  wishlistItemId?: string | null;
  creator?: { id: string; displayName: string; avatarUrl: string | null };
}

interface EventCardProps {
  event: EventItem;
  index?: number;
  onClick?: () => void;
  className?: string;
}

function getEventStatus(dateStr: string): { label: string; variant: "accent" | "success" | "default" } {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate < today) return { label: "Past", variant: "default" };
  if (eventDate.getTime() === today.getTime()) return { label: "Today", variant: "accent" };
  return { label: "Upcoming", variant: "success" };
}

export function EventCard({ event, index = 0, onClick, className }: EventCardProps) {
  const Icon = CATEGORY_ICON[event.category] || Pin;
  const categoryLabel = CATEGORY_LABEL[event.category] || "Other";
  const computedStatus = getEventStatus(event.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] p-4.5 px-5 relative overflow-hidden shadow-[var(--shadow-md)] cursor-pointer active:scale-[0.98] transition-transform",
        className,
      )}
      style={{ background: "var(--surface-alt)" }}
    >
      {/* Decorative image */}
      <CardDecor seed={parseInt(event.id.slice(-4), 16) || 1} />

      {/* Category label */}
      <div className="text-xs font-semibold uppercase tracking-[0.06em] mb-1 relative flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
        <Icon size={12} />
        {categoryLabel}
      </div>

      {/* Title with ellipsis */}
      <div className="text-[1.25rem] font-extrabold mb-3 relative truncate" style={{ color: "var(--text-primary)" }}>
        {event.title}
      </div>

      {/* Badge top-right */}
      <div
        className={cn(
          "absolute top-4 right-5 text-[0.7rem] font-extrabold px-2.5 py-1 rounded-full",
        )}
        style={{
          background: computedStatus.variant === "accent" ? "var(--accent)" : computedStatus.variant === "success" ? "var(--success)" : "var(--text-secondary)",
          color: "var(--text-on-accent)",
        }}
      >
        {computedStatus.label}
      </div>

      {/* Date + Location */}
      <div className="relative flex items-center gap-3 text-[0.78rem]" style={{ color: "var(--text-secondary)" }}>
        <span>
          {new Date(event.date).toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        {event.locationName && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} />
              {event.locationName}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
