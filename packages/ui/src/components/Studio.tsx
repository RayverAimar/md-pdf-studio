"use client";

import { resolveLocale } from "@md-pdf-studio/core";
import { useEffect, useState } from "react";
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
      const storedLocale = window.localStorage.getItem(StorageKey.locale);
      await Promise.all([
        useDocumentStore.persist.rehydrate(),
        useThemeStore.persist.rehydrate(),
        useLocaleStore.persist.rehydrate(),
      ]);
      if (storedLocale === null)
        useLocaleStore.getState().setLocale(resolveLocale(navigator.language));
      setHydrated(true);
    };
    void init();
  }, []);

  if (!hydrated) return null;
  return <AppShell />;
}
