"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { CalendarGrid } from "@/features/events/components/CalendarGrid";
import { EventCard, type EventItem } from "@/features/events/components/EventCard";
import { EventForm } from "@/features/events/components/EventForm";
import { EventDetailSheet } from "@/features/events/components/EventDetailSheet";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { getEventsByMonth, deleteEvent } from "@/features/events/actions";
import { useUserStore } from "@/stores/user";

export default function EventsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();

  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const currentUserId = useUserStore((s) => s.user?.id);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const result = await getEventsByMonth(year, month);
    if (result.success) {
      setEvents(result.data as EventItem[]);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    let ignore = false;
    getEventsByMonth(year, month).then((result) => {
      if (ignore) return;
      if (result.success) setEvents(result.data as EventItem[]);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, [year, month]);

  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleCreateNew = useCallback(() => {
    setEditEvent(null);
    setInitialDate(
      selectedDay
        ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
        : undefined
    );
    setFormOpen(true);
  }, [selectedDay, year, month]);

  const handleEventClick = useCallback((event: EventItem) => {
    setDetailEvent(event);
    setDetailOpen(true);
  }, []);

  const handleEdit = useCallback((event: EventItem) => {
    setEditEvent(event);
    setInitialDate(undefined);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (eventId: string) => {
    const result = await deleteEvent(eventId);
    if (result.success) {
      fetchEvents();
    }
  }, [fetchEvents]);

  const handleSaved = useCallback(() => {
    setEditEvent(null);
    fetchEvents();
  }, [fetchEvents]);

  // Filter events for selected day or show all
  const filteredEvents = selectedDay
    ? events.filter((e) => new Date(e.date).getDate() === selectedDay)
    : events;

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      {/* Calendar */}
      <CalendarGrid
        year={year}
        month={month}
        events={events}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Events list header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[1.1rem] font-bold" style={{ color: "var(--text-primary)" }}>
          {selectedDay
            ? new Date(year, month, selectedDay).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })
            : "All Events"}
        </h2>
        <IconButton variant="accent" size="sm" onClick={handleCreateNew}>
          <Plus size={18} />
        </IconButton>
      </div>

      {/* Events list */}
      {loading ? null : filteredEvents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredEvents.map((ev, i) => (
            <EventCard
              key={ev.id}
              event={ev}
              index={i}
              onClick={() => handleEventClick(ev)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--accent-soft)" }}
          >
            <Calendar size={24} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-[0.95rem] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {selectedDay ? "No events this day" : "No events this month"}
          </p>
          <p className="text-[0.8rem] mb-4" style={{ color: "var(--text-secondary)" }}>
            Plan something special together
          </p>
          <Button size="sm" onClick={handleCreateNew}>
            Create Event
          </Button>
        </div>
      )}

      {/* Event Form */}
      <EventForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditEvent(null); }}
        onSaved={handleSaved}
        editEvent={editEvent}
        initialDate={initialDate}
      />

      {/* Event Detail */}
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
