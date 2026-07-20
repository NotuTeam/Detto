"use client";

import {
  Star,
  Trash2,
  ExternalLink,
  Calendar,
  Edit3,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { CATEGORY_ICON_MAP } from "./WishlistCard";

export interface WishlistDetail {
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

interface WishlistDetailSheetProps {
  item: WishlistDetail | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  /** Called after a destructive action (delete) so the parent can refresh. */
  onChanged: () => void;
  onEdit: (item: WishlistDetail) => void;
}

export function WishlistDetailSheet({
  item,
  isOpen,
  onClose,
  currentUserId,
  onChanged,
  onEdit,
}: WishlistDetailSheetProps) {
  if (!item) return null;

  const isCreator = item.createdBy === currentUserId;
  const Icon = CATEGORY_ICON_MAP[item.category] || CATEGORY_ICON_MAP.OTHER;
  const formattedCreated = new Date(item.createdAt).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );

  const handleDelete = async () => {
    if (!confirm("Delete this wish? This cannot be undone.")) return;
    const { deleteWishlistItem } = await import("../actions");
    const result = await deleteWishlistItem(item.id);
    if (result.success) {
      onChanged();
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Wishlist Item">
      <div className="flex flex-col gap-5">
        {/* Header: category badge + title */}
        <div
          className="rounded-[var(--radius-lg)] p-4 relative overflow-hidden"
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Icon
            className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-[0.07]"
            style={{ color: "var(--text-primary)" }}
            size={120}
            strokeWidth={1}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[0.68rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                {item.category.toLowerCase()}
              </span>
              {item.isFavourite && (
                <Star
                  size={12}
                  fill="var(--accent)"
                  style={{ color: "var(--accent)" }}
                />
              )}
              {item.isChecked && (
                <span
                  className="text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "var(--success)",
                  }}
                >
                  Done
                </span>
              )}
            </div>
            <h3
              className="text-[1.15rem] font-extrabold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {item.title}
            </h3>
          </div>
        </div>

        {/* Creator + created at */}
        <div className="flex items-center gap-3">
          <Avatar
            src={item.creator.avatarUrl}
            name={item.creator.displayName}
            size="sm"
          />
          <div className="flex flex-col">
            <span
              className="text-[0.82rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {item.creator.displayName}
            </span>
            <span
              className="text-[0.68rem]"
              style={{ color: "var(--text-secondary)" }}
            >
              Added {formattedCreated}
            </span>
          </div>
          {isCreator && (
            <span
              className="ml-auto text-[0.6rem] font-bold uppercase tracking-[0.06em] px-2 py-1 rounded-full"
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-secondary)",
              }}
            >
              You
            </span>
          )}
        </div>

        {/* Notes */}
        {item.content && (
          <div
            className="rounded-[var(--radius-md)] p-3"
            style={{ background: "var(--surface-alt)" }}
          >
            <p
              className="text-[0.82rem] leading-relaxed whitespace-pre-line"
              style={{ color: "var(--text-primary)" }}
            >
              {item.content}
            </p>
          </div>
        )}

        {/* Photos */}
        {item.imageUrls.length > 0 && (
          <div>
            <span
              className="text-[0.8rem] font-semibold mb-2 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Photos
            </span>
            <div className="grid grid-cols-3 gap-2">
              {item.imageUrls.map((url, i) => (
                <ImageViewer
                  key={i}
                  src={url}
                  alt={`${item.title} ${i + 1}`}
                >
                  {(onClick) => (
                    <button
                      onClick={onClick}
                      className="aspect-square w-full rounded-[var(--radius-md)] overflow-hidden cursor-pointer"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </ImageViewer>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {item.linkUrls.length > 0 && (
          <div>
            <span
              className="text-[0.8rem] font-semibold mb-2 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Links
            </span>
            <div className="flex flex-col gap-1.5">
              {item.linkUrls.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-2.5 px-3 rounded-[var(--radius-md)] transition-colors hover:opacity-80"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <ExternalLink
                    size={14}
                    style={{ color: "var(--accent)" }}
                  />
                  <span
                    className="text-[0.78rem] truncate flex-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {link}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Linked event */}
        {item.linkedEvent && (
          <div
            className="rounded-[var(--radius-md)] p-3 flex items-center gap-2"
            style={{ background: "var(--accent-soft)" }}
          >
            <Calendar size={14} style={{ color: "var(--accent)" }} />
            <span
              className="text-[0.78rem] font-medium"
              style={{ color: "var(--accent)" }}
            >
              Scheduled for{" "}
              {new Date(item.linkedEvent.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Completion date */}
        {item.isChecked && item.checkedAt && (
          <p
            className="text-[0.68rem] text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            Completed{" "}
            {new Date(item.checkedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        {/* Actions: only creator can edit / delete */}
        {isCreator && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Edit3 size={14} /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
