import { create } from "zustand";
import { getUnreadCount } from "@/features/notifications/actions";

interface NotificationState {
  unreadCount: number;
  lastFetchedAt: number;
  fetchUnreadCount: (force?: boolean) => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  lastFetchedAt: 0,
  fetchUnreadCount: async (force?: boolean) => {
    // Skip if fetched less than 5 seconds ago (unless forced)
    const now = Date.now();
    if (!force && now - get().lastFetchedAt < 5_000) return;
    set({ lastFetchedAt: now });

    const result = await getUnreadCount();
    if (result.success) set({ unreadCount: result.data });
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
