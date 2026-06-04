import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistedStorage, StorageKey } from "./persistence";

export type ColorScheme = "light" | "dark";

interface ColorSchemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggle: () => void;
}

// The editor chrome's light/dark preference. Independent of the document theme (useThemeStore):
// changing it never alters generateCss output or the previewed/exported page. The default literal
// matches the :root chrome vars so the server render and first client paint agree; system resolution
// (prefers-color-scheme) happens in Studio after mount, only when no value was stored.
export const useColorSchemeStore = create<ColorSchemeState>()(
  persist(
    (set) => ({
      scheme: "light",
      setScheme: (scheme) => set({ scheme }),
      toggle: () => set((s) => ({ scheme: s.scheme === "dark" ? "light" : "dark" })),
    }),
    { name: StorageKey.colorScheme, storage: persistedStorage, skipHydration: true },
  ),
);
