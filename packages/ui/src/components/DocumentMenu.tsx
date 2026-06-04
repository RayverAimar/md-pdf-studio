"use client";

import { message, slug } from "@md-pdf-studio/core";
import { useRef, useState } from "react";
import { downloadBlob } from "../render/download";
import { useDocumentStore } from "../store/documentStore";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { toast } from "../store/toastStore";
import { UiClass } from "../theme/chrome";
import { ThemeJsonDialog } from "./ThemeJsonDialog";

const MARKDOWN_ACCEPT = ".md,.markdown,text/markdown";
const THEME_ACCEPT = ".json,application/json";
const THEME_FILE_SUFFIX = ".theme.json";
const JSON_MIME = "application/json";

/** Toolbar group for document lifecycle: import Markdown, start fresh, and export/import the theme. */
export function DocumentMenu() {
  const locale = useLocaleStore((state) => state.locale);
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const themeInputRef = useRef<HTMLInputElement>(null);
  const [jsonOpen, setJsonOpen] = useState(false);

  const onMarkdownPicked = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      useDocumentStore.getState().loadMarkdown(text);
      toast.success(message("markdownImported", locale));
    } catch {
      toast.error(message("markdownImportFailed", locale));
    }
  };

  const onThemePicked = async (file: File): Promise<void> => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (useThemeStore.getState().importTheme(parsed))
        toast.success(message("themeImported", locale));
      else toast.error(message("importThemeFailed", locale));
    } catch {
      toast.error(message("importThemeFailed", locale));
    }
  };

  const onNewDocument = (): void => {
    const { markdown, newDocument } = useDocumentStore.getState();
    if (markdown.trim() !== "" && !window.confirm(message("confirmNewDocument", locale))) return;
    newDocument();
  };

  const onExportTheme = (): void => {
    const theme = useThemeStore.getState().exportTheme();
    downloadBlob(
      JSON.stringify(theme, null, 2),
      `${slug(theme.name)}${THEME_FILE_SUFFIX}`,
      JSON_MIME,
    );
    toast.success(message("themeExported", locale));
  };

  return (
    <div className={UiClass.toolbarGroup}>
      <button
        type="button"
        className={`${UiClass.btn} ${UiClass.btnGhost}`}
        onClick={() => markdownInputRef.current?.click()}
      >
        {message("importMarkdown", locale)}
      </button>
      <button
        type="button"
        className={`${UiClass.btn} ${UiClass.btnGhost}`}
        onClick={onNewDocument}
      >
        {message("newDocument", locale)}
      </button>
      <button
        type="button"
        className={`${UiClass.btn} ${UiClass.btnGhost}`}
        onClick={onExportTheme}
      >
        {message("exportTheme", locale)}
      </button>
      <button
        type="button"
        className={`${UiClass.btn} ${UiClass.btnGhost}`}
        onClick={() => themeInputRef.current?.click()}
      >
        {message("importTheme", locale)}
      </button>
      <button
        type="button"
        className={`${UiClass.btn} ${UiClass.btnGhost}`}
        onClick={() => setJsonOpen(true)}
      >
        {message("themeJson", locale)}
      </button>
      <input
        ref={markdownInputRef}
        type="file"
        accept={MARKDOWN_ACCEPT}
        className={UiClass.srOnly}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file !== undefined) void onMarkdownPicked(file);
        }}
      />
      <input
        ref={themeInputRef}
        type="file"
        accept={THEME_ACCEPT}
        className={UiClass.srOnly}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file !== undefined) void onThemePicked(file);
        }}
      />
      <ThemeJsonDialog open={jsonOpen} onClose={() => setJsonOpen(false)} locale={locale} />
    </div>
  );
}
