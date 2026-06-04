"use client";

import { type Locale, message } from "@md-pdf-studio/core";
import { type MouseEvent as ReactMouseEvent, useEffect, useId, useRef, useState } from "react";
import { useThemeStore } from "../store/themeStore";
import { toast } from "../store/toastStore";
import { UiClass } from "../theme/chrome";

interface ThemeJsonDialogProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
}

/**
 * Read-only JSON view of the live theme plus a paste-to-import field. A native <dialog> + showModal()
 * supplies the focus trap, return-focus-to-trigger, inert background and aria-modal that a modal needs;
 * the Chromium-only render target removes the one historical reason to avoid it.
 */
export function ThemeJsonDialog({ open, onClose, locale }: ThemeJsonDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);
  const [json, setJson] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const errorId = useId();

  // The .open guards prevent the InvalidStateError that showModal()/close() throw when an unrelated
  // re-render re-runs this effect on an already-open or already-closed dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Snapshot the live theme each time the dialog opens so the view is byte-identical to the file export,
  // reset the paste state, and land focus on the read-only view (the non-destructive primary target)
  // rather than a button.
  useEffect(() => {
    if (!open) return;
    setJson(JSON.stringify(useThemeStore.getState().exportTheme(), null, 2));
    setDraft("");
    setError(null);
    jsonRef.current?.focus();
  }, [open]);

  const onBackdropClick = (event: ReactMouseEvent<HTMLDialogElement>): void => {
    if (event.target === dialogRef.current) onClose();
  };

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(json);
      toast.success(message("themeJsonCopied", locale));
    } catch {
      // Fallback: select all so a manual copy keystroke covers the whole value.
      jsonRef.current?.select();
      toast.error(message("themeJsonCopyFailed", locale));
    }
  };

  // Same JSON.parse → importTheme path as the file flow, so isTheme + migrateTheme stay the single
  // validation surface; the two failure modes map to two distinct inline messages.
  const onImportPaste = (): void => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError(message("themeJsonInvalidSyntax", locale));
      return;
    }
    if (useThemeStore.getState().importTheme(parsed)) {
      setError(null);
      toast.success(message("themeImported", locale));
      onClose();
    } else {
      setError(message("themeJsonInvalidShape", locale));
    }
  };

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click is mouse-only light-dismiss; the
          native <dialog> already maps the keyboard equivalent (Escape) to close. */}
      <dialog
        ref={dialogRef}
        className={UiClass.modal}
        aria-labelledby={titleId}
        onClose={onClose}
        onClick={onBackdropClick}
      >
        <div className={UiClass.modalHead}>
          <h2 id={titleId} className={UiClass.modalTitle}>
            {message("themeJsonTitle", locale)}
          </h2>
          <button
            type="button"
            className={UiClass.modalClose}
            aria-label={message("themeJsonClose", locale)}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={UiClass.modalBody}>
          <div className={UiClass.modalSection}>
            <span className={UiClass.modalSectionLabel}>{message("themeJsonView", locale)}</span>
            <textarea
              ref={jsonRef}
              value={json}
              readOnly
              spellCheck={false}
              aria-label={message("themeJsonView", locale)}
              className={UiClass.modalTextarea}
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className={UiClass.modalActions}>
              <button type="button" className={UiClass.btn} onClick={() => void onCopy()}>
                {message("themeJsonCopy", locale)}
              </button>
            </div>
          </div>
          <div className={UiClass.modalSection}>
            <span className={UiClass.modalSectionLabel}>{message("themeJsonPaste", locale)}</span>
            <textarea
              value={draft}
              spellCheck={false}
              aria-invalid={error !== null}
              {...(error !== null ? { "aria-describedby": errorId } : {})}
              className={UiClass.modalTextarea}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error !== null) setError(null);
              }}
            />
            {error !== null ? (
              <p id={errorId} role="alert" className={UiClass.modalError}>
                {error}
              </p>
            ) : null}
            <div className={UiClass.modalActions}>
              <button
                type="button"
                className={`${UiClass.btn} ${UiClass.btnPrimary}`}
                onClick={onImportPaste}
              >
                {message("themeJsonImport", locale)}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
