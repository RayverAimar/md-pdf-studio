import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistedStorage, StorageKey } from "./persistence";

interface RibbonState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

// Word-style ribbon collapse preference. Purely chrome: collapsing only removes the controls band from
// the layout to give the editor/preview more room; it never touches the document theme or its render.
// The default literal matches the static/SSR paint (band shown) so server and first client render agree;
// skipHydration defers the stored value until Studio rehydrates it in the browser, like the sibling stores.
export const useRibbonStore = create<RibbonState>()(
  persist(
    (set) => ({
      collapsed: false,
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: StorageKey.ribbon, storage: persistedStorage, skipHydration: true },
  ),
);
