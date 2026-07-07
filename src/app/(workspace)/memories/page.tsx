"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Plus,
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
  type LucideIcon,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn } from "@/lib/utils";
import {
  getGalleryPhotos,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  getRelationshipEvents,
} from "@/features/gallery/actions";

import Camera from "@/assets/illustration/camera.svg";

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

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
  event: { id: string; title: string; category: string; date: string };
  uploader: { id: string; displayName: string; avatarUrl: string | null };
}

interface EventOption {
  id: string;
  title: string;
  category: string;
  date: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPhotos = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    const result = await getGalleryPhotos(cursor);
    if (result.success && result.data) {
      if (cursor) {
        setPhotos((prev) => [...prev, ...result.data.photos]);
      } else {
        setPhotos(result.data.photos);
      }
      setNextCursor(result.data.nextCursor);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    getGalleryPhotos().then((result) => {
      if (ignore) return;
      if (result.success && result.data) {
        setPhotos(result.data.photos);
        setNextCursor(result.data.nextCursor);
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          fetchPhotos(nextCursor);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPhotos]);

  const handleOpenUpload = async () => {
    const result = await getRelationshipEvents();
    if (result.success) setEvents(result.data as EventOption[]);
    setUploadOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;
    setUploading(true);
    const result = await uploadGalleryPhoto(selectedEventId, file);
    if (result.success) {
      fetchPhotos();
      setUploadOpen(false);
      setSelectedEventId("");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (mediaId: string) => {
    const result = await deleteGalleryPhoto(mediaId);
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
      setPreviewIndex(null);
    }
  };

  const currentPhoto = previewIndex !== null ? photos[previewIndex] : null;

  if (loading) return null;

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[1.3rem] font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            Memories
          </h1>
          <p
            className="text-[0.8rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            {photos.length} photo{photos.length !== 1 ? "s" : ""} from your
            journey
          </p>
        </div>
        <Button size="sm" onClick={handleOpenUpload}>
          <Plus size={14} /> Upload
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          illustration={Camera}
          title="The gallery is still empty"
          description="Upload photos from your dates, and watch it fill up"
          action={{ label: "Upload Photo", onClick: handleOpenUpload }}
        />
      ) : (
        <>
          {/* Masonry-ish bento grid */}
          <div className="columns-2 gap-2 space-y-2">
            {photos.map((photo, i) => {
              const isTall = i % 5 === 0;
              return (
                <div
                  key={photo.id}
                  className={cn(
                    "relative break-inside-avoid rounded-[var(--radius-md)] overflow-hidden cursor-pointer group",
                    isTall ? "aspect-[3/4]" : "aspect-square",
                  )}
                  onClick={() => setPreviewIndex(i)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || ""}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Bottom gradient with event info */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-1">
                      {(() => {
                        const EvIcon =
                          CATEGORY_ICON[photo.event.category] || Pin;
                        return <EvIcon size={10} className="text-white/70" />;
                      })()}
                      <span className="text-[0.6rem] text-white/70 truncate">
                        {photo.event.title}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2
                size={24}
                className="animate-spin"
                style={{ color: "var(--accent)" }}
              />
            </div>
          )}
        </>
      )}

      {/* Lightbox preview */}
      {currentPhoto && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/90"
            onClick={() => setPreviewIndex(null)}
          />
          <div className="fixed inset-0 z-[60] flex flex-col pointer-events-none">
            {/* Top bar */}
            <div className="flex items-center justify-between p-4 max-w-[430px] mx-auto w-full pointer-events-auto">
              <button
                onClick={() => setPreviewIndex(null)}
                className="p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <X size={24} />
              </button>
              <span className="text-[0.78rem] text-white/60">
                {previewIndex! + 1} / {photos.length}
              </span>
              <button
                onClick={() => handleDelete(currentPhoto.id)}
                className="p-2 text-white/80 hover:text-red-400 cursor-pointer"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center px-4 pointer-events-auto">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || ""}
                className="max-h-[65vh] max-w-full object-contain rounded-[var(--radius-md)]"
              />
            </div>

            {/* Caption + nav */}
            <div className="max-w-[430px] mx-auto w-full px-4 pb-6 pointer-events-auto">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() =>
                    setPreviewIndex((prev) =>
                      prev! > 0 ? prev! - 1 : photos.length - 1,
                    )
                  }
                  className="p-2 text-white/60 hover:text-white cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex-1 text-center">
                  {currentPhoto.caption && (
                    <p className="text-white text-[0.9rem] mb-1">
                      {currentPhoto.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    {(() => {
                      const EvIcon =
                        CATEGORY_ICON[currentPhoto.event.category] || Pin;
                      return <EvIcon size={12} className="text-white/50" />;
                    })()}
                    <span className="text-[0.7rem] text-white/50">
                      {currentPhoto.event.title} ·{" "}
                      {currentPhoto.uploader.displayName}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPreviewIndex((prev) =>
                      prev! < photos.length - 1 ? prev! + 1 : 0,
                    )
                  }
                  className="p-2 text-white/60 hover:text-white cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload bottom sheet */}
      <BottomSheet
        isOpen={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setSelectedEventId("");
        }}
        title="Upload Photo"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              className="text-[0.8rem] font-semibold mb-2 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Select Event
            </label>
            {events.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-50 overflow-y-auto">
                {events.map((ev) => {
                  const Icon = CATEGORY_ICON[ev.category] || Pin;
                  const isActive = selectedEventId === ev.id;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] text-left cursor-pointer transition-all"
                      style={{
                        background: isActive
                          ? "var(--accent-soft)"
                          : "var(--surface-alt)",
                        border: `1px solid ${isActive ? "var(--accent)" : "var(--border-subtle)"}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: isActive
                            ? "var(--accent)"
                            : "var(--surface)",
                          color: isActive
                            ? "var(--text-on-accent)"
                            : "var(--text-secondary)",
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[0.85rem] font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {ev.title}
                        </p>
                        <span
                          className="text-[0.7rem]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {new Date(ev.date).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p
                className="text-[0.85rem]"
                style={{ color: "var(--text-secondary)" }}
              >
                Create an event first, so your photos have somewhere to live.
              </p>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            fullWidth
            disabled={!selectedEventId || uploading}
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={16} /> Choose Photo
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
