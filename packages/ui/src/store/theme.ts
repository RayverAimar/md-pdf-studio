import type { Theme, ThemeValue } from "@md-pdf-studio/core";
import { create } from "zustand";

interface ThemeStore {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
  setValue: (id: string, value: ThemeValue) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: null,
  setTheme: (theme) => set({ theme }),
  setValue: (id, value) =>
    set((state) =>
      state.theme
        ? { theme: { ...state.theme, values: { ...state.theme.values, [id]: value } } }
        : state,
    ),
}));
