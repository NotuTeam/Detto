"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Plus, EyeOff, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { NoteComposer } from "./NoteComposer";
import { getActiveNotes, hideNote, deleteNote } from "../actions";
import { cn } from "@/lib/utils";

interface NoteItem {
  id: string;
  message: string | null;
  imageUrl: string | null;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface NotesStackProps {
  currentUserId?: string;
}

const SWIPE_THRESHOLD = 50;

export function NotesStack({ currentUserId }: NotesStackProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewNote, setPreviewNote] = useState<NoteItem | null>(null);
  const [cardHeight, setCardHeight] = useState(140);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(async () => {
    const result = await getActiveNotes();
    if (result.success) {
      setNotes(result.data as NoteItem[]);
      setActiveIndex(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    getActiveNotes().then((result) => {
      if (ignore) return;
      if (result.success) {
        setNotes(result.data as NoteItem[]);
        setActiveIndex(0);
      }
      setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  // Observe active card height continuously (handles image load, content reflow)
  useEffect(() => {
    const el = activeCardRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      if (h > 0) setCardHeight(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeIndex, notes]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % notes.length);
  }, [notes.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + notes.length) % notes.length);
  }, [notes.length]);

  const handleHide = useCallback(
    async (noteId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const result = await hideNote(noteId);
      if (result.success) {
        setNotes((prev) => {
          const updated = prev.filter((n) => n.id !== noteId);
          setActiveIndex((i) => (i >= updated.length ? 0 : i));
          return updated;
        });
      }
    },
    [],
  );

  const handleDelete = useCallback(
    async (noteId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const result = await deleteNote(noteId);
      if (result.success) {
        setNotes((prev) => {
          const updated = prev.filter((n) => n.id !== noteId);
          setActiveIndex((i) => (i >= updated.length ? 0 : i));
          return updated;
        });
      }
    },
    [],
  );

  const handleCreated = useCallback(() => {
    fetchNotes();
  }, [fetchNotes]);

  if (loading) return null;

  const emptyState = notes.length === 0 && (
    <div
      className="rounded-[var(--radius-lg)] p-5 flex items-center justify-between"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "var(--accent-soft)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
        <div>
          <p
            className="text-[0.9rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Leave a note
          </p>
          <p
            className="text-[0.75rem]"
            style={{ color: "var(--text-secondary)" }}
          >
            A sweet message for your partner
          </p>
        </div>
      </div>
      <IconButton
        variant="accent"
        size="sm"
        onClick={() => setComposerOpen(true)}
      >
        <Plus size={18} />
      </IconButton>
    </div>
  );

  const visibleCount = Math.min(notes.length, 3);
  const stackOffset = 20; // extra height for background card peek

  return (
    <>
      {notes.length === 0 ? (
        emptyState
      ) : (
        <div className="relative">
          {/* Stacked cards container */}
          <div className="relative" style={{ height: cardHeight + stackOffset }}>
            {/* Render background cards (behind active) */}
            {Array.from({ length: visibleCount - 1 }).map((_, offset) => {
              const stackIdx = (activeIndex + visibleCount - 1 - offset) % notes.length;
              const depth = offset + 1;
              const scale = 1 - depth * 0.04;
              const translateY = depth * 10;
              const translateX = depth * 6;
              const opacityVal = 1 - depth * 0.3;

              return (
                <div
                  key={`bg-${stackIdx}`}
                  className="absolute left-0 right-0 top-0 rounded-[var(--radius-lg)] overflow-hidden pointer-events-none"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
                    opacity: opacityVal,
                    zIndex: visibleCount - depth,
                    height: cardHeight,
                  }}
                >
                  <div className="p-4">
                    <NoteCardContent note={notes[stackIdx]} />
                  </div>
                </div>
              );
            })}

            {/* Active card (swipeable) - sits in flow to determine container height */}
            <div ref={activeCardRef} className="relative" style={{ zIndex: visibleCount + 1 }}>
              <SwipeableCard
                key={notes[activeIndex]?.id}
                onSwipeLeft={goNext}
                onSwipeRight={goPrev}
              >
                {notes[activeIndex] && (
                  <NoteCard
                    note={notes[activeIndex]}
                    isOwner={notes[activeIndex].createdBy === currentUserId}
                    onHide={handleHide}
                    onDelete={handleDelete}
                    onImageClick={setPreviewNote}
                  />
                )}
              </SwipeableCard>
            </div>
          </div>

          {/* Dots + add button */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-1.5">
              {notes.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === activeIndex ? "w-5 h-2" : "w-2 h-2",
                  )}
                  style={{
                    background:
                      i === activeIndex
                        ? "var(--accent)"
                        : "var(--border-subtle)",
                  }}
                />
              ))}
            </div>
            <IconButton
              variant="accent"
              size="sm"
              onClick={() => setComposerOpen(true)}
            >
              <Plus size={18} />
            </IconButton>
          </div>
        </div>
      )}

      <NoteComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={handleCreated}
      />

      {/* Full-screen image preview */}
      <AnimatePresence>
        {previewNote && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80"
              onClick={() => setPreviewNote(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative max-w-[430px] w-full pointer-events-auto">
                <button
                  onClick={() => setPreviewNote(null)}
                  className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors cursor-pointer z-10"
                >
                  <X size={24} />
                </button>
                <div className="rounded-[var(--radius-lg)] overflow-hidden">
                  <img
                    src={previewNote.imageUrl!}
                    alt=""
                    className="w-full max-h-[70vh] object-contain"
                  />
                </div>
                {previewNote.message && (
                  <div className="mt-3 px-1">
                    <p className="text-white text-[0.9rem] leading-relaxed">
                      {previewNote.message}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Swipeable card wrapper ─────────────────────────────── */

function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const leftOpacity = useTransform(x, [-200, -50, 0], [1, 0, 0]);
  const rightOpacity = useTransform(x, [0, 50, 200], [0, 0, 1]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      style={{ x, rotate }}
      onDragEnd={(_e, info) => {
        if (info.offset.x < -SWIPE_THRESHOLD) {
          onSwipeLeft();
        } else if (info.offset.x > SWIPE_THRESHOLD) {
          onSwipeRight();
        }
      }}
      className="rounded-[var(--radius-lg)] cursor-grab active:cursor-grabbing"
    >
      <div
        className="rounded-[var(--radius-lg)] p-4 overflow-hidden relative"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {children}
      </div>

      {/* Swipe direction indicators */}
      <motion.div
        style={{ opacity: leftOpacity }}
        className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none"
      >
        <span
          className="text-[0.75rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          Prev
        </span>
      </motion.div>
      <motion.div
        style={{ opacity: rightOpacity }}
        className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none"
      >
        <span
          className="text-[0.75rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          Next
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ── Shared note content (used in bg cards + NoteCard) ──── */

function NoteCardContent({ note }: { note: NoteItem }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Avatar
          src={note.creator.avatarUrl}
          name={note.creator.displayName}
          size="xs"
        />
        <span
          className="text-[0.85rem] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {note.creator.displayName}
        </span>
      </div>
      {note.message && (
        <p
          className="text-[0.8rem] mt-2 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {note.message}
        </p>
      )}
    </div>
  );
}

/* ── NoteCard (active, interactive) ─────────────────────── */

function NoteCard({
  note,
  isOwner,
  onHide,
  onDelete,
  onImageClick,
}: {
  note: NoteItem;
  isOwner: boolean;
  onHide: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onImageClick: (note: NoteItem) => void;
}) {
  const timeLeft = getTimeRemaining(note.expiresAt);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          src={note.creator.avatarUrl}
          name={note.creator.displayName}
          size="xs"
        />
        <div className="flex-1 min-w-0">
          <span
            className="text-[0.85rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {note.creator.displayName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                onClick={(e) => onHide(note.id, e)}
                className="p-1.5 rounded-full transition-colors cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
                title="Hide note"
              >
                <EyeOff size={14} />
              </button>
              <button
                onClick={(e) => onDelete(note.id, e)}
                className="p-1.5 rounded-full transition-colors cursor-pointer"
                style={{ color: "var(--danger, #ef4444)" }}
                title="Delete note"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <span
            className="text-[0.65rem] ml-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Image (tap to preview) */}
      {note.imageUrl && (
        <button
          onClick={(e) => { e.stopPropagation(); onImageClick(note); }}
          className="rounded-[var(--radius-md)] overflow-hidden mb-3 max-h-[200px] w-full cursor-pointer"
        >
          <img
            src={note.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </button>
      )}

      {/* Message */}
      {note.message && (
        <p
          className="text-[0.9rem] leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {note.message}
        </p>
      )}
    </div>
  );
}

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
