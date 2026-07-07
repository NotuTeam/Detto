"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallPrompt() {
  const { isInstallable, isStandalone, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isInstallable && !isStandalone && !dismissed) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isStandalone, dismissed]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-[400px] mx-auto"
        >
          <div
            className="flex items-center gap-3 p-4 rounded-2xl shadow-lg"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: "var(--accent-soft)" }}
            >
              <img
                src="/logo/simple-primary.png"
                alt="Detto"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[0.9rem] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Install Detto
              </p>
              <p
                className="text-[0.78rem]"
                style={{ color: "var(--text-secondary)" }}
              >
                Add to home screen for the best experience
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={async () => {
                  await install();
                  setShow(false);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                style={{
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                }}
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => {
                  setDismissed(true);
                  setShow(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
