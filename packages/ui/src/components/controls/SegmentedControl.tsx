"use client";

import type { ControlDef, Locale } from "@md-pdf-studio/core";
import { UiClass } from "../../theme/chrome";
import { optionsFor } from "./SelectControl";

interface SegmentedControlProps {
  control: ControlDef;
  controlId: string;
  locale: Locale;
  value: string | number;
  onChange: (value: string | number) => void;
  label: string;
}

// A button group for the small enums (2-4 options) that read better than a dropdown in the narrow
// controls column. Shares optionsFor with the select widget, so the option set, i18n labels and the
// emitted value are identical — only the chrome differs.
export function SegmentedControl({
  control,
  controlId,
  locale,
  value,
  onChange,
  label,
}: SegmentedControlProps) {
  const options = optionsFor(control, controlId, locale);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a labelled group of toggle buttons; fieldset/legend would be heavier and misleading here.
    <div className={UiClass.segmented} role="group" aria-label={label}>
      {options.map(({ key, value: optValue, label: optLabel }) => {
        const active = String(optValue) === String(value);
        return (
          <button
            key={key}
            type="button"
            className={`${UiClass.segment}${active ? ` ${UiClass.segmentActive}` : ""}`}
            aria-pressed={active}
            onClick={() => onChange(optValue)}
          >
            {optLabel}
          </button>
        );
      })}
    </div>
  );
}
