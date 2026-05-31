import { DEFAULT_LOCALE, type Locale } from "@md-pdf-studio/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistedStorage, StorageKey } from "./persistence";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/** UI language. The store owns the locale; components pass it into core's i18n lookups. */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    { name: StorageKey.locale, storage: persistedStorage, skipHydration: true },
  ),
);
