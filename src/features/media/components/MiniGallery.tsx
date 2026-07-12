"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
}

interface MiniGalleryProps {
  photos: Photo[];
  className?: string;
}

export function MiniGallery({ photos, className }: MiniGalleryProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, photos.length]);

  if (photos.length === 0) return null;

  return (
    <Link href="/memories" className="block">
      <div
        className={cn(
          "relative w-full aspect-[10/16] rounded-[var(--radius-lg)] overflow-hidden",
          className,
        )}
        style={{ background: "var(--surface-alt)" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={photos[current].id}
            src={photos[current].url}
            alt={photos[current].caption || ""}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge label="Memories" variant="accent" />
        </div>

        {/* Caption */}
        {photos[current].caption && (
          <div className="absolute bottom-3 left-3 right-16">
            <p className="text-[0.8rem] text-white font-medium truncate">
              {photos[current].caption}
            </p>
          </div>
        )}

        {/* Dots indicator */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrent(i);
                }}
                className={cn(
                  "rounded-full transition-all duration-300 cursor-pointer",
                  i === current
                    ? "w-5 h-2"
                    : "w-2 h-2 bg-white/40 hover:bg-white/60",
                )}
                style={
                  i === current ? { background: "var(--accent)" } : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
