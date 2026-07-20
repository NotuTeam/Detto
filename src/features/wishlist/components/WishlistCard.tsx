"use client";

import {
  Star,
  Trash2,
  ExternalLink,
  Heart,
  ShoppingBag,
  Clapperboard,
  Plane,
  UtensilsCrossed,
  Coffee,
  CheckCircle2,
  Circle,
  Calendar,
  Cake,
  Gift,
  Users,
  Pin,
  Music,
  Dumbbell,
  Gamepad2,
  Edit3,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { WishlistDetail } from "./WishlistDetailSheet";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
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

interface WishlistCardProps {
  item: WishlistDetail;
  currentUserId?: string;
  onOpenDetail: (item: WishlistDetail) => void;
  onDelete: (id: string) => void;
  onEdit: (item: WishlistDetail) => void;
  onToggleFavourite: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onSchedule: (item: WishlistDetail) => void;
}

export function WishlistCard({
  item,
  currentUserId,
  onOpenDetail,
  onDelete,
  onEdit,
  onToggleFavourite,
  onToggleCheck,
  onSchedule,
}: WishlistCardProps) {
  const isCreator = item.createdBy === currentUserId;
  const Icon = CATEGORY_ICON_MAP[item.category] || CATEGORY_ICON_MAP.OTHER;

  return (
    <div
      className="rounded-[var(--radius-lg)] p-4 relative overflow-hidden transition-opacity cursor-pointer hover:brightness-[0.98]"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        opacity: item.isChecked ? 0.6 : 1,
      }}
      onClick={() => onOpenDetail(item)}
    >
      {/* Decorative giant icon, bottom-right */}
      <Icon
        className="absolute -right-3 -bottom-3 opacity-[0.05] pointer-events-none"
        style={{ color: "var(--text-primary)" }}
        size={100}
        strokeWidth={1}
      />

      {/* Favourite ribbon (top-left) */}
      {item.isFavourite && (
        <div
          className="absolute top-0 left-0 px-2 py-0.5 rounded-br-[var(--radius-md)] flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-[0.06em]"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          <Star size={9} fill="currentColor" />
          Pinned
        </div>
      )}

      <div className="flex items-start gap-3 relative">
        {/* Check button (any partner can toggle) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck(item.id);
          }}
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
              {item.imageUrls.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-14 h-14 rounded-[var(--radius-sm)] object-cover shrink-0"
                />
              ))}
              {item.imageUrls.length > 3 && (
                <div
                  className="w-14 h-14 rounded-[var(--radius-sm)] shrink-0 flex items-center justify-center text-[0.7rem] font-semibold"
                  style={{
                    background: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                  }}
                >
                  +{item.imageUrls.length - 3}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.linkUrls.slice(0, 1).map((link, i) => (
              <span
                key={i}
                className="flex items-center gap-1 text-[0.72rem] font-medium"
                style={{ color: "var(--accent)" }}
              >
                <ExternalLink size={12} />
                {item.linkUrls.length > 1
                  ? `${item.linkUrls.length} links`
                  : "Link"}
              </span>
            ))}
            <span
              className="flex items-center gap-1 text-[0.65rem]"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.creator.avatarUrl ? (
                <img
                  src={item.creator.avatarUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[0.55rem] font-bold"
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-on-accent)",
                  }}
                >
                  {item.creator.displayName.charAt(0).toUpperCase()}
                </span>
              )}
              {item.creator.displayName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite(item.id);
            }}
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

          {/* Schedule: available to both partners, only if not yet
              linked to an event and not already done */}
          {!item.linkedEvent && !item.isChecked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(item);
              }}
              className="p-1.5 cursor-pointer transition-colors"
              style={{ color: "var(--text-secondary)" }}
              title="Schedule as event"
            >
              <Sparkles size={16} />
            </button>
          )}

          {/* Edit + delete: creator-only */}
          {isCreator && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 cursor-pointer transition-colors"
                style={{ color: "var(--text-secondary)" }}
                title="Edit"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 cursor-pointer transition-colors"
                style={{ color: "var(--text-secondary)" }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer badges */}
      {(item.linkedEvent || (item.isChecked && item.checkedAt)) && (
        <div className="mt-2 ml-8 flex flex-wrap gap-2 relative">
          {item.linkedEvent && (
            <span
              className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Calendar size={10} /> Event on{" "}
              {new Date(item.linkedEvent.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {item.isChecked && item.checkedAt && (
            <span
              className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                color: "var(--success)",
              }}
            >
              Done{" "}
              {new Date(item.checkedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
