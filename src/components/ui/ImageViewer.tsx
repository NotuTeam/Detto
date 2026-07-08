"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  children: (onClick: () => void) => React.ReactNode;
}

export function ImageViewer({ src, alt, children }: ImageViewerProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = alt || src.split("/").pop() || "image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [src, alt]);

  return (
    <>
      {children(handleOpen)}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.9)" }}
            onClick={handleClose}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-end gap-2 p-4 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              >
                <Download size={20} />
              </button>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Image */}
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={src}
              alt={alt || ""}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
