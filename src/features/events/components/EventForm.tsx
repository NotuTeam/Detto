"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, UtensilsCrossed, Coffee, Clapperboard, Plane, ShoppingBag, Heart, Cake, Gift, Users, Pin, type LucideIcon } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createEvent, updateEvent } from "../actions";
import type { EventItem } from "./EventCard";

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

const CATEGORIES = [
  { value: "DATE", label: "Date" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CAFE", label: "Cafe" },
  { value: "MOVIE", label: "Movie" },
  { value: "TRAVEL", label: "Travel" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "ANNIVERSARY", label: "Anniversary" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "FAMILY", label: "Family" },
  { value: "OTHER", label: "Other" },
];

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editEvent?: EventItem | null;
  initialDate?: string;
}

export function EventForm({ isOpen, onClose, onSaved, editEvent, initialDate }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("DATE");
  const [date, setDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setCategory("DATE");
    setDate("");
    setLocationName("");
    setLocationUrl("");
  }, []);

  // Populate form when opening
  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect -- syncing external props to form state on open */
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description || "");
      setCategory(editEvent.category);
      setDate(editEvent.date.split("T")[0]);
      setLocationName(editEvent.locationName || "");
      setLocationUrl(editEvent.locationUrl || "");
    } else if (initialDate) {
      reset();
      setDate(initialDate);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      date,
      locationName: locationName.trim() || undefined,
      locationUrl: locationUrl.trim() || undefined,
    };

    const result = editEvent
      ? await updateEvent(editEvent.id, payload)
      : await createEvent(payload);

    if (result.success) {
      reset();
      onClose();
      onSaved();
    }
    setSubmitting(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={editEvent ? "Edit Event" : "New Event"}>
      <div className="flex flex-col gap-4">
        {/* Category chips */}
        <div>
          <label className="text-[0.8rem] font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON[cat.value] || Pin;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-medium transition-all cursor-pointer"
                  style={{
                    background: isActive ? "var(--accent)" : "var(--surface-alt)",
                    color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border-subtle)"}`,
                  }}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Dinner at that new place"
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          label="Location"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. The Italian Place"
        />

        <Input
          label="Google Maps Link (optional)"
          value={locationUrl}
          onChange={(e) => setLocationUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
          hint="Paste a Google Maps link so it's easy to find later"
        />

        <div>
          <label className="text-[0.8rem] font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
            Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            maxLength={500}
            className="w-full rounded-[var(--radius-md)] p-3 text-[0.9rem] resize-none outline-none"
            style={{
              background: "var(--surface-alt)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        </div>

        <Button
          fullWidth
          loading={submitting}
          disabled={!title.trim() || !date}
          onClick={handleSubmit}
        >
          {editEvent ? "Save Changes" : "Create Event"}
        </Button>
      </div>
    </BottomSheet>
  );
}
