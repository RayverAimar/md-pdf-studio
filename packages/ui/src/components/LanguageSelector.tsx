"use client";

import {
  type Locale,
  Locale as LocaleValue,
  message,
  SUPPORTED_LOCALES,
} from "@md-pdf-studio/core";
import { useLocaleStore } from "../store/localeStore";
import { UiClass } from "../theme/chrome";

// FLAG-FOR-LANGUAGE CAVEAT: flags denote countries, not languages (Spanish != Spain to a Peruvian
// user; English != only the UK). The flag is a DECORATIVE recognizability cue ONLY — it is aria-hidden;
// the visible "EN"/"ES" text plus the group aria-label carry the meaning. Inline SVG, not emoji: emoji
// flags fall back to region codes on Windows/Chrome, can't be themed, and size inconsistently.
function FlagGlyph({ locale }: { locale: Locale }) {
  if (locale === LocaleValue.spanish) {
    return (
      <svg className={UiClass.flag} viewBox="0 0 3 2" aria-hidden="true" focusable="false">
        <rect width="3" height="2" fill="#c60b1e" />
        <rect y="0.5" width="3" height="1" fill="#ffc400" />
      </svg>
    );
  }
  return (
    <svg className={UiClass.flag} viewBox="0 0 60 40" aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="8" />
    </svg>
  );
}

export function LanguageSelector() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a labelled group of toggle buttons; fieldset/legend would be heavier and misleading here.
    <div className={UiClass.segmented} role="group" aria-label={message("language", locale)}>
      {SUPPORTED_LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            className={`${UiClass.segment}${active ? ` ${UiClass.segmentActive}` : ""}`}
            aria-pressed={active}
            onClick={() => setLocale(option)}
          >
            <FlagGlyph locale={option} />
            <span>{option.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
