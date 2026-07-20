"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Plus } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useUserStore } from "@/stores/user";
import {
  getWishlistItems,
  deleteWishlistItem,
  toggleFavourite,
  toggleWishlistCheck,
  createEventFromWishlist,
} from "@/features/wishlist/actions";
import { WishlistCard, CATEGORY_ICON_MAP } from "@/features/wishlist/components/WishlistCard";
import { WishlistForm } from "@/features/wishlist/components/WishlistForm";
import {
  WishlistDetailSheet,
  type WishlistDetail,
} from "@/features/wishlist/components/WishlistDetailSheet";

import Love from "@/assets/illustration/love.svg";

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
  { value: "CONCERT", label: "Concert" },
  { value: "WORKOUT", label: "Workout" },
  { value: "PLAYTIME", label: "Playtime" },
  { value: "OTHER", label: "Other" },
] as const;

export default function WishlistPage() {
  const user = useUserStore((s) => s.user);
  const [items, setItems] = useState<WishlistDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  // Sheet states
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistDetail | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Schedule flow state
  const [scheduleItem, setScheduleItem] = useState<WishlistDetail | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const fetchItems = useCallback(async () => {
    const result = await getWishlistItems();
    if (result.success) setItems(result.data as WishlistDetail[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    getWishlistItems().then((result) => {
      if (ignore) return;
      if (result.success) setItems(result.data as WishlistDetail[]);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Refetch when any sheet closes so detail/card stay in sync
  const refreshAndKeepDetail = useCallback(async () => {
    await fetchItems();
    // Sync detailItem with the latest data (if still present)
    setDetailItem((prev) => {
      if (!prev) return prev;
      const fresh = items.find((i) => i.id === prev.id);
      return fresh ?? prev;
    });
  }, [fetchItems, items]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this wish? This cannot be undone.")) return;
    const result = await deleteWishlistItem(id);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (detailItem?.id === id) {
        setDetailOpen(false);
        setDetailItem(null);
      }
    }
  };

  const handleToggleFavourite = async (id: string) => {
    const result = await toggleFavourite(id);
    if (result.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, isFavourite: result.data!.isFavourite }
            : i,
        ),
      );
      setDetailItem((prev) =>
        prev && prev.id === id
          ? { ...prev, isFavourite: result.data!.isFavourite }
          : prev,
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
      setDetailItem((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              isChecked: result.data!.isChecked,
              checkedAt: result.data!.isChecked
                ? new Date().toISOString()
                : null,
            }
          : prev,
      );
    }
  };

  const handleOpenDetail = (item: WishlistDetail) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleOpenEditFromCard = (item: WishlistDetail) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleOpenEditFromDetail = (item: WishlistDetail) => {
    setDetailOpen(false);
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleScheduleOpen = (item: WishlistDetail) => {
    setScheduleItem(item);
    setScheduleDate("");
  };

  const handleScheduleConfirm = async () => {
    if (!scheduleItem || !scheduleDate) return;
    setScheduling(true);
    const result = await createEventFromWishlist(scheduleItem.id, scheduleDate);
    if (result.success) {
      setScheduleItem(null);
      setScheduleDate("");
      fetchItems();
    }
    setScheduling(false);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleFormSaved = () => {
    fetchItems();
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  // When detail sheet data changes, refresh the list silently
  const handleDetailChanged = () => {
    fetchItems().then(() => {
      // After refresh, refresh the detail item from the list
    });
    refreshAndKeepDetail();
  };

  const filtered = filter ? items.filter((i) => i.category === filter) : items;
  const unchecked = filtered.filter((i) => !i.isChecked);
  const checked = filtered.filter((i) => i.isChecked);
  const favourites = unchecked.filter((i) => i.isFavourite);
  const rest = unchecked.filter((i) => !i.isFavourite);

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
            Wishlist
          </h1>
          <p
            className="text-[0.8rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            {items.length} thing{items.length !== 1 ? "s" : ""} you both want
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
        >
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
            const Icon = CATEGORY_ICON_MAP[cat.value] || CATEGORY_ICON_MAP.OTHER;
            return (
              <button
                key={cat.value}
                onClick={() => setFilter(isActive ? null : cat.value)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all"
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
          action={{
            label: "Add Item",
            onClick: () => {
              setEditingItem(null);
              setFormOpen(true);
            },
          }}
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
                    currentUserId={user?.id}
                    onOpenDetail={handleOpenDetail}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditFromCard}
                    onToggleFavourite={handleToggleFavourite}
                    onToggleCheck={handleToggleCheck}
                    onSchedule={handleScheduleOpen}
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
                    currentUserId={user?.id}
                    onOpenDetail={handleOpenDetail}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditFromCard}
                    onToggleFavourite={handleToggleFavourite}
                    onToggleCheck={handleToggleCheck}
                    onSchedule={handleScheduleOpen}
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
                    currentUserId={user?.id}
                    onOpenDetail={handleOpenDetail}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditFromCard}
                    onToggleFavourite={handleToggleFavourite}
                    onToggleCheck={handleToggleCheck}
                    onSchedule={handleScheduleOpen}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit form */}
      <WishlistForm
        key={editingItem?.id ?? "new"}
        isOpen={formOpen}
        onClose={handleFormClose}
        onSaved={handleFormSaved}
        editItem={editingItem}
      />

      {/* Detail sheet */}
      <WishlistDetailSheet
        item={detailItem}
        isOpen={detailOpen}
        onClose={handleDetailClose}
        currentUserId={user?.id}
        onChanged={handleDetailChanged}
        onEdit={handleOpenEditFromDetail}
      />

      {/* Schedule from wishlist BottomSheet */}
      <BottomSheet
        isOpen={!!scheduleItem}
        onClose={() => {
          setScheduleItem(null);
          setScheduleDate("");
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
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
          <Button
            fullWidth
            loading={scheduling}
            disabled={!scheduleDate}
            onClick={handleScheduleConfirm}
          >
            Create Event
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
