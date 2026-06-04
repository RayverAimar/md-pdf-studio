"use client";

import { message } from "@md-pdf-studio/core";
import { useState } from "react";
import { exportPdf } from "../render/renderClient";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { toast } from "../store/toastStore";
import { UiClass } from "../theme/chrome";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { DocumentMenu } from "./DocumentMenu";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { PresetSelector } from "./PresetSelector";

export function Toolbar() {
  const locale = useLocaleStore((state) => state.locale);
  const dirty = useThemeStore((state) => state.dirty);
  const reset = useThemeStore((state) => state.reset);
  const [busy, setBusy] = useState(false);

  const onExport = async (): Promise<void> => {
    setBusy(true);
    // Read at click time so the export reflects the current document and theme, not a stale capture.
    const { markdown } = useDocumentStore.getState();
    const { theme } = useThemeStore.getState();
    const { locale: currentLocale } = useLocaleStore.getState();
    const outcome = await exportPdf(markdown, theme, currentLocale);
    if (outcome.ok) toast.success(message("pdfExported", currentLocale));
    else toast.error(`${message("exportFailed", currentLocale)} — ${outcome.message}`);
    setBusy(false);
  };

  return (
    <header className={UiClass.toolbar}>
      <Logo locale={locale} />

      <div className={UiClass.toolbarGroup}>
        <PresetSelector />
        <button
          type="button"
          className={`${UiClass.btn} ${UiClass.btnGhost}`}
          disabled={!dirty}
          onClick={reset}
        >
          {message("resetAll", locale)}
        </button>
      </div>

      <DocumentMenu />

      <div className={UiClass.toolbarGroup}>
        <ColorSchemeToggle />
        <LanguageSelector />
        <button
          type="button"
          className={`${UiClass.btn} ${UiClass.btnPrimary}`}
          disabled={busy}
          onClick={() => {
            void onExport();
          }}
        >
          {busy ? message("generating", locale) : message("exportPdf", locale)}
        </button>
      </div>
    </header>
  );
}
