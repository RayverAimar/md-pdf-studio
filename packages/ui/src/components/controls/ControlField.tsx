"use client";

import type { ControlDef, Locale, ThemeValue } from "@md-pdf-studio/core";
import { ColorControl } from "./ColorControl";
import { NumericControl } from "./NumericControl";
import { SelectControl } from "./SelectControl";
import { ToggleControl } from "./ToggleControl";

interface ControlFieldProps {
  control: ControlDef;
  controlId: string;
  locale: Locale;
  inputId: string;
  label: string;
  value: ThemeValue;
  onChange: (value: ThemeValue) => void;
}

/** Pick the widget for a control from its declared `control` kind, narrowing the value to its type. */
export function ControlField({
  control,
  controlId,
  locale,
  inputId,
  label,
  value,
  onChange,
}: ControlFieldProps) {
  switch (control.control) {
    case "slider":
    case "number":
      return (
        <NumericControl
          control={control}
          inputId={inputId}
          label={label}
          value={typeof value === "number" ? value : Number(control.default)}
          withSlider={control.control === "slider"}
          onChange={onChange}
        />
      );
    case "color":
      return (
        <ColorControl
          inputId={inputId}
          label={label}
          value={typeof value === "string" ? value : String(control.default)}
          onChange={onChange}
        />
      );
    case "select":
    case "radio":
      return (
        <SelectControl
          control={control}
          controlId={controlId}
          locale={locale}
          inputId={inputId}
          value={typeof value === "boolean" ? String(value) : value}
          onChange={onChange}
        />
      );
    case "toggle":
      return <ToggleControl inputId={inputId} value={value === true} onChange={onChange} />;
    default:
      return null;
  }
}
