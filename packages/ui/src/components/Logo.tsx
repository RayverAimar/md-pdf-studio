"use client";

import { type Locale, message } from "@md-pdf-studio/core";
import { UiClass } from "../theme/chrome";

// Shared toolbar brand: a "document + export-down" mark beside the wordmark. The mark is decorative
// because the adjacent text already announces the app name; it draws in currentColor so its color
// stays single-sourced in the chrome accent token.
export function Logo({ locale }: { locale: Locale }) {
  return (
    <span className={UiClass.brand}>
      <svg
        className={UiClass.brandMark}
        viewBox="0 0 512 512"
        width="22"
        height="22"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="34"
          strokeLinejoin="round"
          d="M120 52 h208 l84 84 v324 H120 V52 Z"
        />
        <path fill="currentColor" d="M328 52 v84 h84 Z" />
        <path
          fill="currentColor"
          d="M256 232 a22 22 0 0 1 22 22 v74 h40 a14 14 0 0 1 10 24 l-58 60 a20 20 0 0 1 -28 0 l-58 -60 a14 14 0 0 1 10 -24 h40 v-74 a22 22 0 0 1 22 -22 Z"
        />
      </svg>
      <span className={UiClass.brandWordmark}>{message("appName", locale)}</span>
    </span>
  );
}
