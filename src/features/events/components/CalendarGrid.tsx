"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  date: string;
  category: string;
}

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarGrid({
  year,
  month,
  events,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Map day -> event count
  const eventDays = useMemo(() => {
    const map = new Map<number, number>();
    for (const ev of events) {
      const d = new Date(ev.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        map.set(day, (map.get(day) || 0) + 1);
      }
    }
    return map;
  }, [events, month, year]);

  const monthName = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      className="rounded-[var(--radius-lg)] p-4"
      style={{ background: "var(--surface)" }}
    >
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <IconButton variant="default" size="sm" onClick={onPrevMonth}>
          <ChevronLeft size={16} />
        </IconButton>
        <span
          className="text-[0.95rem] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {monthName}
        </span>
        <IconButton variant="default" size="sm" onClick={onNextMonth}>
          <ChevronRight size={16} />
        </IconButton>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[0.7rem] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const isToday =
            day === todayDay && month === todayMonth && year === todayYear;
          const isSelected = day === selectedDay;
          const eventCount = eventDays.get(day) || 0;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 rounded-[var(--radius-md)] transition-all duration-150 cursor-pointer",
                (isSelected || isToday) && "font-bold",
              )}
              style={{
                background: isSelected ? "var(--accent)" : "transparent",
                color: isSelected
                  ? "var(--text-on-accent)"
                  : isToday
                    ? "var(--accent)"
                    : "var(--text-primary)",
              }}
            >
              <span className="text-[0.85rem]">{day}</span>
              {eventCount > 0 && (
                <div className="flex items-center gap-[3px] mt-0.5">
                  {Array.from({ length: Math.min(eventCount, 3) }).map(
                    (_, j) => (
                      <span
                        key={j}
                        className="w-[5px] h-[5px] rounded-full"
                        style={{
                          background: isSelected
                            ? "var(--text-on-accent)"
                            : "var(--accent)",
                        }}
                      />
                    ),
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
