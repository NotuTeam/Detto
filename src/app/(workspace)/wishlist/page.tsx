"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Star,
  Plus,
  Trash2,
  ExternalLink,
  Heart,
  ShoppingBag,
  Clapperboard,
  Plane,
  UtensilsCrossed,
  Coffee,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  Circle,
  Calendar,
  Cake,
  Gift,
  Users,
  Pin,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  getWishlistItems,
  createWishlistItem,
  deleteWishlistItem,
  toggleFavourite,
  uploadWishlistImage,
  toggleWishlistCheck,
  createEventFromWishlist,
} from "@/features/wishlist/actions";
import { compressImage } from "@/lib/compress-image";
import { UploadOverlay, type UploadStep } from "@/components/ui/UploadOverlay";

import Love from "@/assets/illustration/love.svg";

const CATEGORIES = [
  { value: "DATE", label: "Date", icon: Calendar },
  { value: "RESTAURANT", label: "Restaurant", icon: UtensilsCrossed },
  { value: "CAFE", label: "Cafe", icon: Coffee },
  { value: "MOVIE", label: "Movie", icon: Clapperboard },
  { value: "TRAVEL", label: "Travel", icon: Plane },
  { value: "SHOPPING", label: "Shopping", icon: ShoppingBag },
  { value: "ANNIVERSARY", label: "Anniversary", icon: Heart },
  { value: "BIRTHDAY", label: "Birthday", icon: Cake },
  { value: "HOLIDAY", label: "Holiday", icon: Gift },
  { value: "FAMILY", label: "Family", icon: Users },
  { value: "OTHER", label: "Other", icon: Pin },
] as const;

interface WishlistItem {
  id: string;
  title: string;
  content: string | null;
  imageUrls: string[];
  linkUrls: string[];
  category: string;
  isFavourite: boolean;
  isChecked: boolean;
  checkedAt: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; displayName: string; avatarUrl: string | null };
  linkedEvent: { id: string; date: string; status: string } | null;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrls, setLinkUrls] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>(null);
  const [category, setCategory] = useState("DATE");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    const result = await getWishlistItems();
    if (result.success) setItems(result.data as WishlistItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    getWishlistItems().then((result) => {
      if (ignore) return;
      if (result.success) setItems(result.data as WishlistItem[]);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const reset = () => {
    setTitle("");
    setContent("");
    setLinkUrls([]);
    setNewLink("");
    setImageUrls([]);
    setCategory("DATE");
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await createWishlistItem({
      title: title.trim(),
      content: content.trim() || undefined,
      linkUrls: linkUrls.length > 0 ? linkUrls : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      category,
    });
    if (result.success) {
      reset();
      setFormOpen(false);
      fetchItems();
    }
    setSubmitting(false);
  };

  const handleAddLink = () => {
    const trimmed = newLink.trim();
    if (!trimmed || linkUrls.includes(trimmed)) return;
    try {
      new URL(trimmed);
    } catch {
      return;
    }
    setLinkUrls((prev) => [...prev, trimmed]);
    setNewLink("");
  };

  const handleRemoveLink = (idx: number) => {
    setLinkUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setUploadStep("compressing");
    const compressed = await compressImage(file).catch(() => file);
    setUploadStep("uploading");
    const result = await uploadWishlistImage(compressed);
    if (result.success && result.data) {
      setImageUrls((prev) => [...prev, result.data!.url]);
    }
    setUploadingImage(false);
    setUploadStep(null);
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDelete = async (id: string) => {
    const result = await deleteWishlistItem(id);
    if (result.success) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleFavourite = async (id: string) => {
    const result = await toggleFavourite(id);
    if (result.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, isFavourite: result.data!.isFavourite } : i,
        ),
      );
    }
  };

  const handleToggleCheck = async (id: string) => {
    const result = await toggleWishlistCheck(id);
    if (result.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                isChecked: result.data!.isChecked,
                checkedAt: result.data!.isChecked
                  ? new Date().toISOString()
                  : null,
              }
            : i,
        ),
      );
    }
  };

  // Create Event from wishlist
  const [eventFromWishlist, setEventFromWishlist] = useState<string | null>(
    null,
  );
  const [eventDate, setEventDate] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  const handleCreateEventFromWishlist = async () => {
    if (!eventFromWishlist || !eventDate) return;
    setCreatingEvent(true);
    const result = await createEventFromWishlist(eventFromWishlist, eventDate);
    if (result.success) {
      setEventFromWishlist(null);
      setEventDate("");
    }
    setCreatingEvent(false);
  };

  const filtered = filter ? items.filter((i) => i.category === filter) : items;
  const unchecked = filtered.filter((i) => !i.isChecked);
  const checked = filtered.filter((i) => i.isChecked);
  const favourites = unchecked.filter((i) => i.isFavourite);
  const rest = unchecked.filter((i) => !i.isFavourite);

  if (loading) return null;

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <UploadOverlay step={uploadStep} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[1.3rem] font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            Wishlist
          </h1>
          <p
            className="text-[0.8rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            {items.length} thing{items.length !== 1 ? "s" : ""} you both want
          </p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* Category filter chips */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter(null)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
            style={{
              background:
                filter === null ? "var(--accent)" : "var(--surface-alt)",
              color:
                filter === null
                  ? "var(--text-on-accent)"
                  : "var(--text-secondary)",
              border: `1px solid ${filter === null ? "var(--accent)" : "var(--border-subtle)"}`,
            }}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const isActive = filter === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setFilter(isActive ? null : cat.value)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: isActive ? "var(--accent)" : "var(--surface-alt)",
                  color: isActive
                    ? "var(--text-on-accent)"
                    : "var(--text-secondary)",
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--border-subtle)"}`,
                }}
              >
                <Icon size={12} />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          illustration={Love}
          title="The list is still empty"
          description="Write down what you want to do, buy, or experience together"
          action={{ label: "Add Item", onClick: () => setFormOpen(true) }}
        />
      ) : (
        <>
          {/* Favourites */}
          {favourites.length > 0 && (
            <div>
              <h2
                className="text-[0.85rem] font-semibold mb-3 flex items-center gap-1.5"
                style={{ color: "var(--accent)" }}
              >
                <Star size={14} fill="var(--accent)" /> Favourites
              </h2>
              <div className="flex flex-col gap-2">
                {favourites.map((item) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onToggleFavourite={handleToggleFavourite}
                    onToggleCheck={handleToggleCheck}
                    onCreateEvent={(id) => {
                      setEventFromWishlist(id);
                      setEventDate("");
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              {favourites.length > 0 && (
                <h2
                  className="text-[0.85rem] font-semibold mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  All items
                </h2>
              )}
              <div className="flex flex-col gap-2">
                {rest.map((item) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onToggleFavourite={handleToggleFavourite}
                    onToggleCheck={handleToggleCheck}
                    onCreateEvent={(id) => {
                      setEventFromWishlist(id);
                      setEventDate("");
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Done items */}
          {checked.length > 0 && (
            <div>
              <h2
                className="text-[0.85rem] font-semibold mb-3"
                style={{ color: "var(--success)" }}
              >
                Done ({checked.length})
              </h2>
              <div className="flex flex-col gap-2">
                {checked.map((item) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onToggleFavourite={handleToggleFavourite}
                    onToggleCheck={handleToggleCheck}
                    onCreateEvent={(id) => {
                      setEventFromWishlist(id);
                      setEventDate("");
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create bottom sheet */}
      <BottomSheet
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          reset();
        }}
        title="New Wishlist Item"
      >
        <div className="flex flex-col gap-4">
          {/* Category chips */}
          <div>
            <label
              className="text-[0.8rem] font-semibold mb-2 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.78rem] font-medium transition-all cursor-pointer"
                    style={{
                      background: isActive
                        ? "var(--accent)"
                        : "var(--surface-alt)",
                      color: isActive
                        ? "var(--text-on-accent)"
                        : "var(--text-secondary)",
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
            placeholder="e.g. Visit that new cafe"
          />

          {/* Links */}
          <div>
            <label
              className="text-[0.8rem] font-semibold mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Links
            </label>
            {linkUrls.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2">
                {linkUrls.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2"
                    style={{ background: "var(--surface-alt)" }}
                  >
                    <ExternalLink
                      size={12}
                      style={{ color: "var(--accent)" }}
                    />
                    <span
                      className="text-[0.78rem] truncate flex-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {link}
                    </span>
                    <button
                      onClick={() => handleRemoveLink(i)}
                      className="cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-stretch">
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddLink())
                }
                placeholder="https://..."
                className="flex-1 rounded-[var(--radius-md)] py-2.5 px-3 text-[0.85rem] outline-none"
                style={{
                  background: "var(--input-bg)",
                  color: "var(--text-primary)",
                  border: "1.5px solid var(--border-subtle)",
                }}
              />
              <Button
                variant="primary"
                rounded={false}
                className="h-12! aspect-square p-0! shrink-0"
                onClick={handleAddLink}
                disabled={!newLink.trim()}
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>

          {/* Images */}
          <div>
            <label
              className="text-[0.8rem] font-semibold mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Photos
            </label>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            {imageUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                {imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 shrink-0 rounded-[var(--radius-md)] overflow-hidden"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => imageRef.current?.click()}
              disabled={uploadingImage}
              className="w-full rounded-[var(--radius-md)] flex items-center justify-center gap-2 py-3 cursor-pointer transition-colors disabled:opacity-50"
              style={{
                background: "var(--surface-alt)",
                border: "1.5px dashed var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {uploadingImage ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
              <span className="text-[0.78rem] font-medium">Add Photo</span>
            </button>
          </div>

          <div>
            <label
              className="text-[0.8rem] font-semibold mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Notes
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
            disabled={!title.trim()}
            onClick={handleCreate}
          >
            Add to Wishlist
          </Button>
        </div>
      </BottomSheet>

      {/* Create Event from Wishlist BottomSheet */}
      <BottomSheet
        isOpen={!!eventFromWishlist}
        onClose={() => {
          setEventFromWishlist(null);
          setEventDate("");
        }}
        title="Create Event from Wishlist"
      >
        <div className="flex flex-col gap-4">
          <p
            className="text-[0.85rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            Pick a date, and this wish becomes a plan. Once the day passes, it
            checks itself off — one more wish, made real.
          </p>
          <Input
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <Button
            fullWidth
            loading={creatingEvent}
            disabled={!eventDate}
            onClick={handleCreateEventFromWishlist}
          >
            Create Event
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ── Wishlist Card ──────────────────────────────────────────── */

function WishlistCard({
  item,
  onDelete,
  onToggleFavourite,
  onToggleCheck,
  onCreateEvent,
}: {
  item: WishlistItem;
  onDelete: (id: string) => void;
  onToggleFavourite: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onCreateEvent: (id: string) => void;
}) {
  return (
    <div
      className="rounded-[var(--radius-lg)] p-4 relative overflow-hidden transition-opacity"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        opacity: item.isChecked ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Check button */}
        <button
          onClick={() => onToggleCheck(item.id)}
          className="mt-1 cursor-pointer transition-colors shrink-0"
          title={item.isChecked ? "Mark as not done" : "Mark as done"}
        >
          {item.isChecked ? (
            <CheckCircle2
              size={20}
              style={{ color: "var(--success)" }}
              fill="var(--success)"
            />
          ) : (
            <Circle size={20} style={{ color: "var(--text-secondary)" }} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[0.95rem] font-semibold truncate"
            style={{
              color: "var(--text-primary)",
              textDecoration: item.isChecked ? "line-through" : "none",
            }}
          >
            {item.title}
          </p>
          {item.content && (
            <p
              className="text-[0.8rem] mt-0.5 line-clamp-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.content}
            </p>
          )}
          {/* Images */}
          {item.imageUrls.length > 0 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto">
              {item.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-14 h-14 rounded-[var(--radius-sm)] object-cover shrink-0"
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.linkUrls.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[0.72rem] font-medium"
                style={{ color: "var(--accent)" }}
              >
                <ExternalLink size={12} /> Link{" "}
                {item.linkUrls.length > 1 ? i + 1 : ""}
              </a>
            ))}
            <span
              className="text-[0.65rem]"
              style={{ color: "var(--text-secondary)" }}
            >
              by {item.creator.displayName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavourite(item.id)}
            className="p-1.5 cursor-pointer transition-colors"
            title={
              item.isFavourite ? "Remove from favourites" : "Add to favourites"
            }
          >
            <Star
              size={18}
              className={item.isFavourite ? "" : "opacity-30"}
              style={{ color: "var(--accent)" }}
              fill={item.isFavourite ? "var(--accent)" : "none"}
            />
          </button>
          {!item.isChecked && !item.linkedEvent && (
            <button
              onClick={() => onCreateEvent(item.id)}
              className="p-1.5 cursor-pointer transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title="Create event from this"
            >
              <Calendar size={14} />
            </button>
          )}
          {item.createdBy === item.creator.id && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 cursor-pointer transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {item.linkedEvent && (
        <div className="mt-2 ml-8">
          <span
            className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <Calendar size={10} /> Event on{" "}
            {new Date(item.linkedEvent.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
      {item.isChecked && item.checkedAt && (
        <div className="mt-2 ml-8">
          <span className="text-[0.65rem]" style={{ color: "var(--success)" }}>
            Done{" "}
            {new Date(item.checkedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
