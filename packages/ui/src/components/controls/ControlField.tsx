"use client";

import type { ControlDef, Locale, ThemeValue } from "@md-pdf-studio/core";
import { ColorControl } from "./ColorControl";
import { NumericControl } from "./NumericControl";
import { SegmentedControl } from "./SegmentedControl";
import { SelectControl } from "./SelectControl";
import { StepperControl } from "./StepperControl";
import { ToggleControl } from "./ToggleControl";

interface ControlFieldProps {
  control: ControlDef;
  controlId: string;
  locale: Locale;
  inputId: string;
  label: string;
  value: ThemeValue;
  onChange: (value: ThemeValue) => void;
  // Presentation-only pass-through: the tooltip id the focusable widget points at. It never picks a
  // widget nor changes a value — the control still renders from its schema def. The compact skin needs
  // no prop here; it is the ancestor `.ui-row--compact` class that retunes each widget's CSS.
  describedBy?: string;
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
  describedBy,
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
          {...(describedBy !== undefined ? { describedBy } : {})}
          onChange={onChange}
        />
      );
    case "stepper":
      return (
        <StepperControl
          control={control}
          inputId={inputId}
          label={label}
          locale={locale}
          value={typeof value === "number" ? value : Number(control.default)}
          {...(describedBy !== undefined ? { describedBy } : {})}
          onChange={onChange}
        />
      );
    case "color":
      return (
        <ColorControl
          inputId={inputId}
          label={label}
          value={typeof value === "string" ? value : String(control.default)}
          {...(describedBy !== undefined ? { describedBy } : {})}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <SelectControl
          control={control}
          controlId={controlId}
          locale={locale}
          inputId={inputId}
          label={label}
          value={typeof value === "boolean" ? String(value) : value}
          {...(describedBy !== undefined ? { describedBy } : {})}
          onChange={onChange}
        />
      );
    // `radio` resolves to the same labelled toggle-button group as `segmented` — the better realization
    // of a radio group for a few options (WAI-ARIA APG); schema opt-ins standardize on `segmented`.
    case "radio":
    case "segmented":
      return (
        <SegmentedControl
          control={control}
          controlId={controlId}
          locale={locale}
          label={label}
          value={typeof value === "boolean" ? String(value) : value}
          onChange={onChange}
        />
      );
    case "toggle":
      return (
        <ToggleControl
          inputId={inputId}
          value={value === true}
          {...(describedBy !== undefined ? { describedBy } : {})}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}
