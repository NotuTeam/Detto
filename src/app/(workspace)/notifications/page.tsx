"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  Heart,
  Check,
  Trash2,
  CheckCheck,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type NotificationItem,
} from "@/features/notifications/actions";

import Notify from "@/assets/illustration/notify.svg";

function getTypeIcon(type: string) {
  switch (type) {
    case "EVENT_REMINDER":
    case "EVENT_TODAY":
      return Calendar;
    case "NOTE_RECEIVED":
      return Heart;
    default:
      return Bell;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "EVENT_TODAY":
      return "var(--accent)";
    case "EVENT_REMINDER":
      return "var(--warning)";
    case "NOTE_RECEIVED":
      return "var(--accent)";
    default:
      return "var(--text-secondary)";
  }
}

function groupByDate(
  items: NotificationItem[],
): { label: string; items: NotificationItem[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = new Map<string, NotificationItem[]>();

  for (const item of items) {
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() === today.getTime()) {
      label = "Today";
    } else if (d.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getNotifications(50).then((result) => {
      if (ignore) return;
      if (result.success) setNotifications(result.data as NotificationItem[]);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.readAt ? n : { ...n, readAt: new Date().toISOString() },
        ),
      );
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const groups = groupByDate(notifications);

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-[1.4rem] font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p
              className="text-[0.82rem] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-[0.8rem] font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <CheckCheck size={14} />
            Read All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-[var(--radius-lg)] animate-pulse"
              style={{ background: "var(--surface-alt)" }}
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          illustration={Notify}
          title="Nothing new"
          description="Reminders and updates will show up here."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <div
                className="text-[0.72rem] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {group.label}
              </div>

              {/* Notification items */}
              <div className="flex flex-col gap-2">
                {group.items.map((n) => {
                  const TypeIcon = getTypeIcon(n.type);
                  const typeColor = getTypeColor(n.type);
                  const isUnread = !n.readAt;
                  const timeAgo = getTimeAgo(n.createdAt);

                  return (
                    <div
                      key={n.id}
                      className="relative rounded-[var(--radius-lg)] overflow-hidden transition-all"
                      style={{
                        background: isUnread
                          ? "var(--surface)"
                          : "var(--surface-alt)",
                        border: isUnread
                          ? "1px solid color-mix(in srgb, var(--accent) 20%, var(--border-subtle))"
                          : "1px solid var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-start gap-3 p-4">
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            background: isUnread
                              ? `color-mix(in srgb, ${typeColor} 15%, transparent)`
                              : "var(--surface-alt)",
                          }}
                        >
                          <TypeIcon size={16} style={{ color: typeColor }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-[0.88rem] font-bold leading-tight"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {n.title}
                            </p>
                            {isUnread && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                style={{ background: "var(--accent)" }}
                              />
                            )}
                          </div>
                          <p
                            className="text-[0.8rem] mt-1 leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {n.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className="flex items-center gap-1 text-[0.68rem]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <Clock size={10} />
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action row */}
                      <div
                        className="flex items-center justify-end gap-2 px-4 py-2"
                        style={{
                          borderTop: "1px solid var(--border-subtle)",
                          background:
                            "color-mix(in srgb, var(--surface-alt) 50%, transparent)",
                        }}
                      >
                        {isUnread && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="flex items-center gap-1 text-[0.72rem] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                            style={{
                              color: "var(--accent)",
                              background: "var(--accent-soft)",
                            }}
                          >
                            <Check size={11} />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="flex items-center gap-1 text-[0.72rem] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                          style={{
                            color: "var(--text-secondary)",
                            background: "var(--surface-alt)",
                          }}
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
