"use client";

import { message } from "@md-pdf-studio/core";
import { useColorSchemeStore } from "../store/colorSchemeStore";
import { useLocaleStore } from "../store/localeStore";
import { UiClass } from "../theme/chrome";

// A labelled icon button whose aria-label states the ACTION it performs (the dynamic label conveys
// state, so pairing it with aria-pressed would double-speak). The SVG is decorative and drawn in
// currentColor, swapping sun<->moon to reflect the current scheme; it reuses the ghost-button tokens so
// it inherits the existing focus ring and hover.
export function ColorSchemeToggle() {
  const locale = useLocaleStore((s) => s.locale);
  const scheme = useColorSchemeStore((s) => s.scheme);
  const toggle = useColorSchemeStore((s) => s.toggle);
  const dark = scheme === "dark";
  const label = message(dark ? "switchToLight" : "switchToDark", locale);

  return (
    <button
      type="button"
      className={`${UiClass.btn} ${UiClass.btnGhost} ${UiClass.colorSchemeToggle}`}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        {dark ? (
          <path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        ) : (
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
            <path d="M12 2.5v2.5M12 19v2.5M4.4 4.4l1.8 1.8M17.8 17.8l1.8 1.8M2.5 12H5M19 12h2.5M4.4 19.6l1.8-1.8M17.8 6.2l1.8-1.8" />
          </g>
        )}
      </svg>
    </button>
  );
}
