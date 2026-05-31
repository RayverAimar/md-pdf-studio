"use client";

import { message, SUPPORTED_LOCALES } from "@md-pdf-studio/core";
import { useLocaleStore } from "../store/localeStore";
import { UiClass } from "../theme/chrome";

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
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
