"use client";

import { message } from "@md-pdf-studio/core";
import { useState } from "react";
import { exportPdf } from "../render/renderClient";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { UiClass } from "../theme/chrome";
import { DocumentMenu } from "./DocumentMenu";
import { LanguageSelector } from "./LanguageSelector";
import { PresetSelector } from "./PresetSelector";

export function Toolbar() {
  const locale = useLocaleStore((state) => state.locale);
  const dirty = useThemeStore((state) => state.dirty);
  const reset = useThemeStore((state) => state.reset);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    // Read at click time so the export reflects the current document and theme, not a stale capture.
    const { markdown } = useDocumentStore.getState();
    const { theme } = useThemeStore.getState();
    const { locale: currentLocale } = useLocaleStore.getState();
    const outcome = await exportPdf(markdown, theme, currentLocale);
    if (!outcome.ok) setError(outcome.message);
    setBusy(false);
  };

  return (
    <header className={UiClass.toolbar}>
      <span className={UiClass.brand}>{message("appName", locale)}</span>

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
        <LanguageSelector />
        {error !== null ? (
          <span style={{ color: "var(--ui-danger)", fontSize: "12px" }} title={error} role="alert">
            {message("exportFailed", locale)}
          </span>
        ) : null}
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
