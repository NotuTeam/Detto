"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, X, ExternalLink, Camera, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createWishlistItem,
  updateWishlistItem,
  getWishlistImageSignature,
} from "../actions";
import {
  uploadAssetDirect,
  IMAGE_MAX_SIZE_MB,
  validateUploadSize,
} from "@/lib/upload-asset";
import { UploadOverlay } from "@/components/ui/UploadOverlay";

export const CATEGORIES = [
  { value: "DATE", label: "Date", icon: "Calendar" },
  { value: "RESTAURANT", label: "Restaurant", icon: "UtensilsCrossed" },
  { value: "CAFE", label: "Cafe", icon: "Coffee" },
  { value: "MOVIE", label: "Movie", icon: "Clapperboard" },
  { value: "TRAVEL", label: "Travel", icon: "Plane" },
  { value: "SHOPPING", label: "Shopping", icon: "ShoppingBag" },
  { value: "ANNIVERSARY", label: "Anniversary", icon: "Heart" },
  { value: "BIRTHDAY", label: "Birthday", icon: "Cake" },
  { value: "HOLIDAY", label: "Holiday", icon: "Gift" },
  { value: "FAMILY", label: "Family", icon: "Users" },
  { value: "CONCERT", label: "Concert", icon: "Music" },
  { value: "WORKOUT", label: "Workout", icon: "Dumbbell" },
  { value: "PLAYTIME", label: "Playtime", icon: "Gamepad2" },
  { value: "OTHER", label: "Other", icon: "Pin" },
] as const;

export interface WishlistFormInitial {
  id: string;
  title: string;
  content: string | null;
  imageUrls: string[];
  linkUrls: string[];
  category: string;
}

interface WishlistFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** If provided, form is in edit mode. Otherwise creates a new item. */
  editItem?: WishlistFormInitial | null;
}

export function WishlistForm({
  isOpen,
  onClose,
  onSaved,
  editItem,
}: WishlistFormProps) {
  const isEdit = !!editItem;
  // Initialise state from editItem on first render only. Parent uses a `key`
  // prop to remount this component when switching between create/edit targets,
  // so we don't need an effect to resync.
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [content, setContent] = useState(editItem?.content ?? "");
  const [linkUrls, setLinkUrls] = useState<string[]>(editItem?.linkUrls ?? []);
  const [newLink, setNewLink] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(
    editItem?.imageUrls ?? [],
  );
  const [category, setCategory] = useState<string>(editItem?.category ?? "DATE");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

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

    const sizeError = validateUploadSize(file, IMAGE_MAX_SIZE_MB);
    if (sizeError) {
      alert(sizeError);
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const sigResult = await getWishlistImageSignature();
      if (!sigResult.success || !sigResult.data) {
        setUploadingImage(false);
        setUploadProgress(null);
        return;
      }
      const result = await uploadAssetDirect(
        file,
        sigResult.data,
        "image",
        (pct) => setUploadProgress(pct),
      );
      setImageUrls((prev) => [...prev, result.secure_url]);
    } catch {
      /* noop */
    }
    setUploadingImage(false);
    setUploadProgress(null);
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      content: content.trim() || undefined,
      linkUrls: linkUrls.length > 0 ? linkUrls : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      category,
    };

    const result = isEdit && editItem
      ? await updateWishlistItem(editItem.id, payload)
      : await createWishlistItem(payload);

    if (result.success) {
      onSaved();
      onClose();
    }
    setSubmitting(false);
  }, [
    title,
    content,
    linkUrls,
    imageUrls,
    category,
    submitting,
    isEdit,
    editItem,
    onSaved,
    onClose,
  ]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Wishlist Item" : "New Wishlist Item"}
    >
      <UploadOverlay progress={uploadProgress} />
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
                  <ExternalLink size={12} style={{ color: "var(--accent)" }} />
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
            <span className="text-[0.78rem] font-medium">
              {imageUrls.length > 0 ? "Add Another" : "Add Photo"}
            </span>
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
          onClick={handleSubmit}
        >
          {isEdit ? "Save Changes" : "Add to Wishlist"}
        </Button>
      </div>
    </BottomSheet>
  );
}
