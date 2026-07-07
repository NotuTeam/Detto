import { create } from "zustand";
import { getUnreadCount } from "@/features/notifications/actions";

interface NotificationState {
  unreadCount: number;
  lastFetchedAt: number;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  lastFetchedAt: 0,
  fetchUnreadCount: async () => {
    // Skip if fetched less than 10 seconds ago
    const now = Date.now();
    if (now - get().lastFetchedAt < 10_000) return;
    set({ lastFetchedAt: now });

    const result = await getUnreadCount();
    if (result.success) set({ unreadCount: result.data });
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
