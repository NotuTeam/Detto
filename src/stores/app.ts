import { create } from "zustand";

interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  isInitialized: false,
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: () => set({ isInitialized: true }),
}));
