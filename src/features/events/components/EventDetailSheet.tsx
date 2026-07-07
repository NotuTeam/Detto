"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  UtensilsCrossed,
  Coffee,
  Clapperboard,
  Plane,
  ShoppingBag,
  Heart,
  Cake,
  Gift,
  Users,
  Pin,
  MapPin,
  Navigation,
  Trash2,
  Edit3,
  Camera,
  X,
  Loader2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { getEventMedia, uploadEventMedia, deleteEventMedia, getWishlistItemForEvent } from "../actions";
import type { EventItem } from "./EventCard";

interface WishlistEventData {
  imageUrls: string[];
  linkUrls: string[];
  isChecked: boolean;
  checkedAt: string | null;
}

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

function getComputedStatus(dateStr: string): {
  label: string;
  variant: "accent" | "success" | "default";
} {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  if (eventDate < today) return { label: "Past", variant: "default" };
  if (eventDate.getTime() === today.getTime())
    return { label: "Today", variant: "accent" };
  return { label: "Upcoming", variant: "success" };
}

interface EventMedia {
  id: string;
  url: string;
  caption: string | null;
  mimeType: string;
  uploadedBy: string;
  uploader?: { id: string; displayName: string };
}

interface EventDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onEdit: (event: EventItem) => void;
  onDelete: (eventId: string) => void;
  currentUserId?: string;
}

export function EventDetailSheet({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  currentUserId,
}: EventDetailSheetProps) {
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [wishlistData, setWishlistData] = useState<WishlistEventData | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !event) return;
    let cancelled = false;
    (async () => {
      const [mediaResult, wishlistResult] = await Promise.all([
        getEventMedia(event.id),
        event.wishlistItemId
          ? getWishlistItemForEvent(event.id)
          : Promise.resolve({ success: true, data: null }),
      ]);
      if (cancelled) return;
      if (mediaResult.success) setMedia(mediaResult.data as EventMedia[]);
      if (wishlistResult.success)
        setWishlistData(wishlistResult.data as WishlistEventData | null);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, event]);

  if (!event) return null;

  const Icon = CATEGORY_ICON[event.category] || Pin;
  const status = getComputedStatus(event.date);
  const isOwner = event.createdBy === currentUserId;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadEventMedia(event.id, file);
    if (result.success && result.data) {
      setMedia((prev) => [
        {
          id: result.data!.id,
          url: result.data!.url,
          caption: null,
          mimeType: file.type,
          uploadedBy: currentUserId || "",
        },
        ...prev,
      ]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const result = await deleteEventMedia(mediaId);
    if (result.success)
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="flex flex-col gap-5">
        {/* Event Info Card — large bg icon on left, content overlaid */}
        <div
          className="rounded-[var(--radius-lg)] p-5 relative overflow-hidden"
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Large background icon — left side, full card height */}
          <Icon
            className="absolute -left-2 top-1/3 -translate-y-1/2 opacity-[0.06]"
            style={{ color: "var(--text-primary)" }}
            size={140}
            strokeWidth={1}
          />

          {/* Content (relative so it sits above the bg icon) */}
          <div className="relative">
            {/* Top row: title + badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <span
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--accent)" }}
                >
                  {event.category.toLowerCase()}
                </span>
                <h3
                  className="text-[1.15rem] font-extrabold leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {event.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className="text-[0.68rem] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0"
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
                <span
                  className="text-[0.7rem]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {event.creator && (
                  <span
                    className="text-[0.65rem] flex items-center gap-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {event.creator.displayName}
                  </span>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-2.5">
              {event.description && !event.description.startsWith("[AUTO:") && (
                <p
                  className="text-[0.85rem] leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--text-primary)" }}
                >
                  {event.description}
                </p>
              )}

              {/* Wishlist links */}
              {wishlistData && wishlistData.linkUrls.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {wishlistData.linkUrls.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2 px-3 rounded-[var(--radius-md)] transition-colors hover:opacity-80"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <ExternalLink
                        size={12}
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="text-[0.78rem] truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {link}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {(event.locationName || event.locationUrl) && (
                <a
                  href={event.locationUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 py-2.5 px-4 rounded-[var(--radius-md)] transition-colors hover:opacity-80"
                  style={{
                    background: event.locationUrl ? "var(--surface)" : "transparent",
                    border: event.locationUrl ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <MapPin
                    size={14}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                  <div className="flex-1 min-w-0">
                    {event.locationName && (
                      <span
                        className="text-[0.85rem] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {event.locationName}
                      </span>
                    )}
                    {event.locationUrl && (
                      <p
                        className="text-[0.72rem] mt-0.5 truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Open in Google Maps
                      </p>
                    )}
                  </div>
                  {event.locationUrl && (
                    <Navigation
                      size={14}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: "var(--accent)" }}
                    />
                  )}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Photos Gallery */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[0.85rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Memories From This Day {media.length > 0 && `(${media.length})`}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            {media.length === 0 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-[0.78rem] font-medium cursor-pointer disabled:opacity-50 transition-colors"
                style={{ color: "var(--accent)" }}
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
                Add Photo
              </button>
            )}
          </div>

          {media.length > 0 ? (
            /* Bento grid */
            <div
              className="grid grid-cols-2 gap-2"
              style={{ gridAutoRows: "120px" }}
            >
              {/* First photo: large (spans 2 rows) */}
              <div
                className="relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group row-span-2"
                onClick={() => setPreviewUrl(media[0].url)}
              >
                <img
                  src={media[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* Uploader label */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                  <span className="text-[0.6rem] text-white/80">
                    {media[0].uploader?.displayName || ""}
                  </span>
                </div>
                {media[0].uploadedBy === currentUserId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedia(media[0].id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Remaining photos (max 3 visible) */}
              {media.slice(1, 4).map((m, i) => (
                <div
                  key={m.id}
                  className="relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group"
                  onClick={() => setPreviewUrl(m.url)}
                >
                  {i === 2 && media.length > 4 ? (
                    /* Last visible slot with count overlay */
                    <div className="relative w-full h-full">
                      <img
                        src={m.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-[1.1rem] font-bold">
                          +{media.length - 3}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={m.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Uploader label */}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/50 to-transparent">
                    <span className="text-[0.55rem] text-white/80">
                      {m.uploader?.displayName || ""}
                    </span>
                  </div>
                  {m.uploadedBy === currentUserId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(m.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add button fills the next empty bento slot */}
              {media.length < 4 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  style={{
                    background: "var(--surface-alt)",
                    border: "1.5px dashed var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {uploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                  <span className="text-[0.65rem] font-medium">Add</span>
                </button>
              )}
            </div>
          ) : (
            /* Empty state dropzone */
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2 py-5 cursor-pointer transition-colors"
              style={{
                background: "var(--surface-alt)",
                border: "1.5px dashed var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Camera size={20} />
              )}
              <span className="text-[0.78rem] font-medium">
                No photos yet — add some from this moment
              </span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onEdit(event);
                  onClose();
                }}
              >
                <Edit3 size={14} /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Full-screen image preview */}
      {previewUrl && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/80"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="relative max-w-[430px] w-full pointer-events-auto">
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors cursor-pointer z-10"
              >
                <X size={24} />
              </button>
              <div className="rounded-[var(--radius-lg)] overflow-hidden">
                <img
                  src={previewUrl}
                  alt=""
                  className="w-full max-h-[75vh] object-contain"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
