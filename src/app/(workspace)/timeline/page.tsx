"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Camera, Pin, MapPin, Heart, Cake, Gift, Users, UtensilsCrossed, Coffee, Clapperboard, Plane, ShoppingBag, type LucideIcon } from "lucide-react";
import { EventDetailSheet } from "@/features/events/components/EventDetailSheet";
import { getTimelineEvents, type TimelineMonth, type TimelineEvent } from "@/features/timeline/actions";
import { deleteEvent } from "@/features/events/actions";
import type { EventItem } from "@/features/events/components/EventCard";
import { useUserStore } from "@/stores/user";
import { EmptyState } from "@/components/feedback/EmptyState";

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
  OTHER: Pin,
};

function getComputedStatus(dateStr: string): { label: string; variant: "accent" | "success" | "default" } {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  if (eventDate < today) return { label: "Past", variant: "default" };
  if (eventDate.getTime() === today.getTime()) return { label: "Today", variant: "accent" };
  return { label: "Upcoming", variant: "success" };
}

function getRelativeDate(dateStr: string): string {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return eventDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

// Convert TimelineEvent to the shape EventDetailSheet/EventCard expects
function toEventItem(ev: TimelineEvent): EventItem {
  return {
    id: ev.id,
    title: ev.title,
    description: ev.description,
    category: ev.category,
    date: ev.date,
    locationName: ev.locationName,
    locationUrl: ev.locationUrl,
    status: ev.status,
    createdBy: ev.createdBy,
    wishlistItemId: ev.wishlistItemId,
    creator: ev.creator,
  };
}

export default function TimelinePage() {
  const [months, setMonths] = useState<TimelineMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const currentUserId = useUserStore((s) => s.user?.id);

  const fetchData = useCallback(async () => {
    const result = await getTimelineEvents(200);
    if (result.success) {
      setMonths(result.data as TimelineMonth[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    getTimelineEvents(200).then((result) => {
      if (ignore) return;
      if (result.success) setMonths(result.data as TimelineMonth[]);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const handleEventClick = useCallback((ev: TimelineEvent) => {
    setDetailEvent(toEventItem(ev));
    setDetailOpen(true);
  }, []);

  const handleDelete = useCallback(async (eventId: string) => {
    await deleteEvent(eventId);
    fetchData();
  }, [fetchData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = useCallback((_event: EventItem) => {
    window.location.href = "/calendar";
  }, []);

  // Total event count
  const totalEvents = months.reduce((sum, m) => sum + m.events.length, 0);

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-[1.4rem] font-extrabold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Timeline
        </h1>
        <p
          className="text-[0.85rem]"
          style={{ color: "var(--text-secondary)" }}
        >
          {totalEvents > 0 ? `${totalEvents} memories together` : "Your story together"}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div
                className="w-32 h-5 rounded-full animate-pulse"
                style={{ background: "var(--surface-alt)" }}
              />
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="h-20 rounded-[var(--radius-lg)] animate-pulse"
                  style={{ background: "var(--surface-alt)" }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : totalEvents === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events yet"
          description="Your timeline will appear here once you start creating memories together."
          action={{ label: "Create Event", href: "/calendar" }}
        />
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] rounded-full"
            style={{
              left: "11px",
              background: "var(--border-subtle)",
            }}
          />

          {months.map((month) => (
            <div key={`${month.year}-${month.month}`} className="mb-8 last:mb-0">
              {/* Month header */}
              <div className="flex items-center gap-3 mb-4 relative">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{ background: "var(--accent)" }}
                >
                  <Calendar size={12} style={{ color: "var(--text-on-accent)" }} />
                </div>
                <h2
                  className="text-[1rem] font-extrabold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {month.monthLabel}
                </h2>
                <span
                  className="text-[0.72rem] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >
                  {month.events.length}
                </span>
              </div>

              {/* Events in this month */}
              <div className="flex flex-col gap-3">
                {month.events.map((ev) => {
                  const Icon = CATEGORY_ICON[ev.category] || Pin;
                  const status = getComputedStatus(ev.date);
                  const relativeDate = getRelativeDate(ev.date);
                  const fullDate = new Date(ev.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={ev.id}
                      className="ml-9 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => handleEventClick(ev)}
                    >
                      {/* Event dot on the line */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-5 relative z-10 -ml-[21.5px]"
                        style={{
                          background:
                            status.variant === "accent"
                              ? "var(--accent)"
                              : status.variant === "success"
                                ? "var(--success)"
                                : "var(--text-secondary)",
                          boxShadow: `0 0 0 3px var(--bg-page)`,
                        }}
                      />

                      {/* Event card */}
                      <div
                        className="flex-1 rounded-[var(--radius-lg)] p-4 relative overflow-hidden"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {/* Category + status row */}
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <Icon size={12} />
                            {ev.category.toLowerCase()}
                          </div>
                          <span
                            className="text-[0.65rem] font-extrabold px-2 py-0.5 rounded-full"
                            style={{
                              background:
                                status.variant === "accent"
                                  ? "var(--accent)"
                                  : status.variant === "success"
                                    ? "var(--success)"
                                    : "var(--text-secondary)",
                              color: "var(--text-on-accent)",
                            }}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className="text-[1rem] font-extrabold mb-1 leading-tight"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {ev.title}
                        </h3>

                        {/* Description preview */}
                        {ev.description && !ev.description.startsWith("[AUTO:") && (
                          <p
                            className="text-[0.8rem] line-clamp-2 mb-2 leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {ev.description}
                          </p>
                        )}

                        {/* Meta row: date, location, media */}
                        <div
                          className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[0.72rem]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span title={fullDate}>{relativeDate}</span>
                          {ev.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {ev.locationName}
                            </span>
                          )}
                          {ev.mediaCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Camera size={10} />
                              {ev.mediaCount}
                            </span>
                          )}
                          {ev.creator && (
                            <span className="flex items-center gap-1 opacity-60">
                              by {ev.creator.displayName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Sheet */}
      <EventDetailSheet
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        event={detailEvent}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUserId={currentUserId}
      />
    </div>
  );
}
