"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribePushNotifications } from "@/lib/push-client";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (typeof PushManager === "undefined") return;

    // Only show if permission is still "default" (never asked)
    if (Notification.permission === "default") {
      const timer = setTimeout(() => setShow(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = useCallback(async () => {
    setShow(false);
    await subscribePushNotifications();
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-96 mx-auto"
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
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-soft)" }}
            >
              <Bell size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[0.85rem] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Stay connected
              </p>
              <p
                className="text-[0.72rem]"
                style={{ color: "var(--text-secondary)" }}
              >
                Get notified about notes and reminders from your partner
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAllow}
                className="px-3 py-1.5 rounded-full text-[0.75rem] font-bold cursor-pointer transition-transform active:scale-95"
                style={{
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                }}
              >
                Allow
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
