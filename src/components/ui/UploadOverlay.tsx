"use client";

import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadOverlayProps {
  /** When set (0-100), shows a percentage progress bar. */
  progress?: number | null;
  /** Optional label; defaults derived from progress. */
  label?: string;
}

const DEFAULT_LABEL = "Uploading...";

export function UploadOverlay({ progress, label }: UploadOverlayProps) {
  const hasProgress = progress !== null && progress !== undefined;
  const pct = hasProgress ? Math.min(100, Math.max(0, progress!)) : 0;
  const displayLabel =
    label ?? (hasProgress ? `Uploading... ${pct}%` : DEFAULT_LABEL);

  return (
    <AnimatePresence>
      {progress !== null && progress !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl min-w-[240px]"
            style={{
              background: "var(--surface)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
            <p
              className="text-[0.9rem] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {displayLabel}
            </p>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ background: "var(--border-subtle)" }}
            >
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
