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
  Music,
  Dumbbell,
  Gamepad2,
  MapPin,
  Navigation,
  Trash2,
  Edit3,
  Camera,
  Video,
  Play,
  X,
  Loader2,
  ExternalLink,
  Download,
  MessageCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
  getEventMedia,
  uploadEventMedia,
  deleteEventMedia,
  getWishlistItemForEvent,
  getEventComments,
  addEventComment,
  deleteEventComment,
  getVideoUploadSignature,
  saveEventMedia,
} from "../actions";
import { compressImage } from "@/lib/compress-image";
import { uploadVideoDirect } from "@/lib/upload-video";
import { UploadOverlay, type UploadStep } from "@/components/ui/UploadOverlay";
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
  CONCERT: Music,
  WORKOUT: Dumbbell,
  PLAYTIME: Gamepad2,
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
  thumbnailUrl: string | null;
  uploadedBy: string;
  uploader?: { id: string; displayName: string };
}

interface EventComment {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
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
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !event) return;
    let cancelled = false;
    (async () => {
      const [mediaResult, wishlistResult, commentsResult] = await Promise.all([
        getEventMedia(event.id),
        event.wishlistItemId
          ? getWishlistItemForEvent(event.id)
          : Promise.resolve({ success: true, data: null }),
        getEventComments(event.id),
      ]);
      if (cancelled) return;
      if (mediaResult.success) setMedia(mediaResult.data as EventMedia[]);
      if (wishlistResult.success)
        setWishlistData(wishlistResult.data as WishlistEventData | null);
      if (commentsResult.success)
        setComments(commentsResult.data as EventComment[]);
    })();
    setCommentText("");
    return () => {
      cancelled = true;
    };
  }, [isOpen, event]);

  const handleSendComment = async () => {
    if (!commentText.trim() || !event) return;
    setSendingComment(true);
    const result = await addEventComment(event.id, commentText.trim());
    if (result.success && result.data) {
      setComments((prev) => [...prev, result.data as EventComment]);
      setCommentText("");
    } else {
      toast.error("Failed to add note. Please try again.");
    }
    setSendingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteEventComment(commentId);
    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  if (!event) return null;

  const Icon = CATEGORY_ICON[event.category] || Pin;
  const status = getComputedStatus(event.date);
  const isOwner = event.createdBy === currentUserId;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadStep("compressing");
    const compressed = await compressImage(file).catch(() => file);
    setUploadStep("uploading");
    const result = await uploadEventMedia(event.id, compressed);
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
    setUploadStep(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    if (file.size > 40 * 1024 * 1024) {
      toast.error("Video must be under 40MB");
      if (videoRef.current) videoRef.current.value = "";
      return;
    }

    setVideoProgress(0);
    try {
      const sigResult = await getVideoUploadSignature();
      if (!sigResult.success || !sigResult.data) {
        toast.error("Failed to prepare upload");
        return;
      }

      const result = await uploadVideoDirect(file, sigResult.data, (pct) =>
        setVideoProgress(pct),
      );

      // Derive thumbnail URL from the video's public_id
      const thumbUrl = result.secure_url.replace(
        /\.(mp4|webm|mov|avi|mkv)$/i,
        ".jpg",
      );

      const saveResult = await saveEventMedia({
        eventId: event.id,
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.type,
        size: result.bytes,
        thumbnailUrl: thumbUrl,
      });

      if (saveResult.success && saveResult.data) {
        setMedia((prev) => [
          {
            id: saveResult.data!.id,
            url: result.secure_url,
            caption: null,
            mimeType: file.type,
            thumbnailUrl: thumbUrl,
            uploadedBy: currentUserId || "",
          },
          ...prev,
        ]);
      }
    } catch {
      toast.error("Video upload failed. Please try again.");
    }
    setVideoProgress(null);
    if (videoRef.current) videoRef.current.value = "";
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const result = await deleteEventMedia(mediaId);
    if (result.success)
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  return (
    <>
      <UploadOverlay step={uploadStep} />
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
                    className="text-[0.68rem] font-extrabold px-2.5 py-1 rounded-full shrink-0"
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
                      background: event.locationUrl
                        ? "var(--surface)"
                        : "transparent",
                      border: event.locationUrl
                        ? "1px solid var(--border-subtle)"
                        : "none",
                    }}
                  >
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0"
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
                        className="shrink-0 mt-0.5"
                        style={{ color: "var(--accent)" }}
                      />
                    )}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Notes / Comments Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[0.85rem] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Notes {comments.length > 0 && `(${comments.length})`}
              </span>
            </div>

            {/* Comment bubbles */}
            {comments.length > 0 && (
              <div className="flex flex-col gap-3 mb-4">
                {comments.map((c) => {
                  const isMe = c.user.id === currentUserId;
                  return (
                    <div
                      key={c.id}
                      className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar
                        src={c.user.avatarUrl}
                        name={c.user.displayName}
                        size="sm"
                      />
                      <div
                        className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                      >
                        <div
                          className="flex items-center justify-between gap-2 mb-0.5"
                          style={{
                            flexDirection: isMe ? "row-reverse" : "row",
                          }}
                        >
                          <span
                            className="text-[0.7rem] font-semibold"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {isMe ? "You" : c.user.displayName}
                          </span>
                          <span
                            className="text-[0.6rem]"
                            style={{
                              color: "var(--text-secondary)",
                              opacity: 0.6,
                            }}
                          >
                            {new Date(c.createdAt).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div
                          className="rounded-2xl px-3.5 py-2 text-[0.85rem] leading-relaxed relative group"
                          style={{
                            background: isMe
                              ? "var(--accent)"
                              : "var(--surface-alt)",
                            color: isMe
                              ? "var(--text-on-accent)"
                              : "var(--text-primary)",
                            borderTopRightRadius: isMe ? "4px" : undefined,
                            borderTopLeftRadius: !isMe ? "4px" : undefined,
                          }}
                        >
                          <p className="whitespace-pre-line">{c.message}</p>
                          {isMe && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input */}
            <div
              className="flex items-center gap-2 rounded-full px-3 py-2"
              style={{
                background: "var(--surface-alt)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendComment()
                }
                placeholder="Leave some notes about this moment..."
                className="flex-1 bg-transparent text-[0.85rem] outline-none"
                style={{ color: "var(--text-primary)" }}
                disabled={sendingComment}
              />
              <button
                onClick={handleSendComment}
                disabled={!commentText.trim() || sendingComment}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 shrink-0"
                style={{
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                }}
              >
                {sendingComment ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
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
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || videoProgress !== null}
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
                <button
                  onClick={() => videoRef.current?.click()}
                  disabled={uploading || videoProgress !== null}
                  className="flex items-center gap-1.5 text-[0.78rem] font-medium cursor-pointer disabled:opacity-50 transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  <Video size={14} />
                  Add Video
                </button>
              </div>
            </div>

            {media.length > 0 ? (
              /* Bento grid */
              <div
                className="grid grid-cols-2 gap-2"
                style={{ gridAutoRows: "120px" }}
              >
                {/* First media: large (spans 2 rows) */}
                <div
                  className="relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group row-span-2"
                  onClick={() => setPreviewUrl(media[0].url)}
                >
                  <MediaThumb media={media[0]} large />
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

                {/* Remaining media (all) */}
                {media.slice(1).map((m) => (
                  <div
                    key={m.id}
                    className="relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group"
                    onClick={() => setPreviewUrl(m.url)}
                  >
                    <MediaThumb media={m} />
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

                {/* Video upload progress */}
                {videoProgress !== null && (
                  <div
                    className="rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2"
                    style={{
                      background: "var(--surface-alt)",
                      border: "1.5px dashed var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-[0.65rem] font-medium">
                      Uploading {videoProgress}%
                    </span>
                  </div>
                )}

                {/* Add button always available */}
                {videoProgress === null && (
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
            ) : videoProgress !== null ? (
              /* Video uploading with no existing media */
              <div
                className="w-full rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-3 py-8"
                style={{
                  background: "var(--surface-alt)",
                  border: "1.5px dashed var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
                <span className="text-[0.85rem] font-medium">
                  Uploading video... {videoProgress}%
                </span>
                <div className="w-3/4 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress}%`, background: "var(--accent)" }}
                  />
                </div>
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
                  No memories yet — add some from this moment
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

        {/* Full-screen media preview */}
        {previewUrl && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/80"
              onClick={() => setPreviewUrl(null)}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <div className="relative max-w-[430px] w-full pointer-events-auto">
                <div className="absolute -top-10 right-0 flex items-center gap-2 z-10">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch(previewUrl);
                        const blob = await res.blob();
                        const obj = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = obj;
                        a.download = "media";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(obj);
                      } catch {
                        /* noop */
                      }
                    }}
                    className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="rounded-[var(--radius-lg)] overflow-hidden">
                  {previewUrl.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/i) ? (
                    <video
                      src={previewUrl}
                      controls
                      autoPlay
                      className="w-full max-h-[75vh] object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt=""
                      className="w-full max-h-[75vh] object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </BottomSheet>
    </>
  );
}

/* ── Media thumbnail (image or video with play overlay) ────── */

function MediaThumb({
  media,
  large,
}: {
  media: EventMedia;
  large?: boolean;
}) {
  const isVideo = media.mimeType.startsWith("video/");

  if (isVideo) {
    return (
      <>
        <img
          src={media.thumbnailUrl || undefined}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.5)",
              width: large ? 44 : 32,
              height: large ? 44 : 32,
            }}
          >
            <Play
              size={large ? 20 : 16}
              fill="white"
              className="text-white ml-0.5"
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <img src={media.url} alt="" className="w-full h-full object-cover" />
  );
}
