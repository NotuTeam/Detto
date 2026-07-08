"use client";

import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type UploadStep = "compressing" | "uploading" | null;

interface UploadOverlayProps {
  step: UploadStep;
}

const STEP_LABELS: Record<NonNullable<UploadStep>, string> = {
  compressing: "Compressing image...",
  uploading: "Uploading...",
};

export function UploadOverlay({ step }: UploadOverlayProps) {
  return (
    <AnimatePresence>
      {step && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl"
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
              {STEP_LABELS[step]}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
