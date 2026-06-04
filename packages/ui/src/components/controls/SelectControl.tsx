"use client";

import { type ControlDef, FontStack, type Locale, optionLabel } from "@md-pdf-studio/core";
import { Dropdown } from "./Dropdown";

interface SelectControlProps {
  control: ControlDef;
  controlId: string;
  locale: Locale;
  inputId: string;
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  // Forwarded to the dropdown trigger so the row tooltip is announced when the combobox takes focus.
  describedBy?: string;
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

export function optionsFor(control: ControlDef, controlId: string, locale: Locale): Option[] {
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
  label,
  value,
  onChange,
  describedBy,
}: SelectControlProps) {
  const options = optionsFor(control, controlId, locale);
  // Resolving key back to its typed schema value stays here, keeping the no-free-CSS guarantee local to
  // the schema widget; the Dropdown itself is value-agnostic (string keys only).
  const emit = (key: string): void => {
    const match = options.find((option) => option.key === key);
    if (match !== undefined) onChange(match.value);
  };

  return (
    <Dropdown
      id={inputId}
      label={label}
      options={options.map(({ key, label: optLabel }) => ({ key, label: optLabel }))}
      value={String(value)}
      {...(describedBy !== undefined ? { describedBy } : {})}
      onChange={emit}
    />
  );
}
