"use client";

import { resolveLocale } from "@md-pdf-studio/core";
import { useEffect, useState } from "react";
import { useColorSchemeStore } from "../store/colorSchemeStore";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { StorageKey } from "../store/persistence";
import { useThemeStore } from "../store/themeStore";
import { AppShell } from "./AppShell";

/**
 * Entry point. Stores skip automatic hydration to keep the server and first client render identical;
 * this rehydrates them in the browser, then derives the locale from the browser when none was stored.
 */
export function Studio() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const init = async (): Promise<void> => {
      // Read the raw keys before rehydrate so an explicit stored value wins over the system default.
      const storedLocale = window.localStorage.getItem(StorageKey.locale);
      const storedScheme = window.localStorage.getItem(StorageKey.colorScheme);
      await Promise.all([
        useDocumentStore.persist.rehydrate(),
        useThemeStore.persist.rehydrate(),
        useLocaleStore.persist.rehydrate(),
        useColorSchemeStore.persist.rehydrate(),
      ]);
      if (storedLocale === null)
        useLocaleStore.getState().setLocale(resolveLocale(navigator.language));
      if (storedScheme === null) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        useColorSchemeStore.getState().setScheme(prefersDark ? "dark" : "light");
      }
      setHydrated(true);
    };
    void init();
  }, []);

  if (!hydrated) return null;
  return <AppShell />;
}
