"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Clock, Sun, Moon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/providers";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notifications";

interface AppHeaderProps {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  className?: string;
}

export function AppHeader({
  displayName,
  username,
  avatarUrl,
  className,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchUnreadCount(true);

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    const handleFocus = () => fetchUnreadCount(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchUnreadCount(true);
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  return (
    <header className={cn("top-0 z-40", className)}>
      <div className="max-w-[430px] mx-auto flex items-center justify-between p-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar src={avatarUrl} name={displayName || "?"} size="xs" />
          <div className="flex flex-col">
            <span
              className="text-[0.95rem] font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName || "User"}
            </span>
            <span
              className="text-[0.7rem]"
              style={{ color: "var(--text-secondary)" }}
            >
              {username ? `@${username}` : "Detto"}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <Link
            href="/timeline"
            className="p-2 transition-colors duration-150"
            style={{ color: "var(--text-secondary)" }}
          >
            <Clock size={20} />
          </Link>
          <Link
            href="/notifications"
            className="relative p-2 transition-colors duration-150"
            style={{ color: "var(--text-secondary)" }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-[0.55rem] font-bold flex items-center justify-center"
                style={{
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
