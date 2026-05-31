"use client";

import { type ControlDef, FontStack, type Locale, optionLabel } from "@md-pdf-studio/core";
import { UiClass } from "../../theme/chrome";

interface SelectControlProps {
  control: ControlDef;
  controlId: string;
  locale: Locale;
  inputId: string;
  value: string | number;
  onChange: (value: string | number) => void;
}

interface Option {
  key: string;
  value: string | number;
  label: string;
}

// A font stack's display name is its first family — a proper noun that reads the same in any locale,
// so it needs no translation.
function fontStackLabel(stack: string): string {
  const first = stack.split(",")[0] ?? stack;
  return first.replace(/['"]/g, "").trim();
}

function optionsFor(control: ControlDef, controlId: string, locale: Locale): Option[] {
  if (control.type === "fontFamily") {
    return Object.values(FontStack).map((stack) => ({
      key: stack,
      value: stack,
      label: fontStackLabel(stack),
    }));
  }
  return (control.enum ?? []).map((entry) => ({
    key: String(entry),
    value: entry,
    label: optionLabel(controlId, entry, locale),
  }));
}

/** Dropdown for enum and font-family controls. Option values resolve back to their schema type. */
export function SelectControl({
  control,
  controlId,
  locale,
  inputId,
  value,
  onChange,
}: SelectControlProps) {
  const options = optionsFor(control, controlId, locale);
  const emit = (key: string): void => {
    const match = options.find((option) => option.key === key);
    if (match !== undefined) onChange(match.value);
  };

  return (
    <select
      id={inputId}
      className={UiClass.select}
      value={String(value)}
      onChange={(event) => emit(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
