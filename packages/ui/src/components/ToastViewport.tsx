"use client";

import { message } from "@md-pdf-studio/core";
import { useLocaleStore } from "../store/localeStore";
import { type Toast, ToastVariant, useToastStore } from "../store/toastStore";
import { UiClass } from "../theme/chrome";

const VARIANT_CLASS: Record<ToastVariant, string> = {
  [ToastVariant.success]: UiClass.toastSuccess,
  [ToastVariant.error]: UiClass.toastError,
  [ToastVariant.info]: UiClass.toastInfo,
};

export function ToastViewport() {
  const locale = useLocaleStore((s) => s.locale);
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  const renderToast = (t: Toast) => (
    <div key={t.id} className={`${UiClass.toast} ${VARIANT_CLASS[t.variant]}`}>
      <span className={UiClass.toastMessage}>{t.message}</span>
      <button
        type="button"
        className={UiClass.toastDismiss}
        aria-label={message("dismissNotification", locale)}
        onClick={() => dismiss(t.id)}
      >
        {/* Glyph only; the accessible name comes from aria-label, kept out of the visible label. */}
        ×
      </button>
    </div>
  );

  // Both regions exist on first render (even empty) so screen readers observe later insertions.
  return (
    <div className={UiClass.toastViewport}>
      <div className={UiClass.toastRegion} role="status" aria-live="polite" aria-atomic="true">
        {toasts.filter((t) => !t.assertive).map(renderToast)}
      </div>
      <div className={UiClass.toastRegion} role="alert" aria-live="assertive" aria-atomic="true">
        {toasts.filter((t) => t.assertive).map(renderToast)}
      </div>
    </div>
  );
}
