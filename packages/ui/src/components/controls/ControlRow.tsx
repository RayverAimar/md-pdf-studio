"use client";

import { type ControlDef, controlLabel, type Locale, type ThemeValue } from "@md-pdf-studio/core";
import { memo } from "react";
import { UiClass } from "../../theme/chrome";
import { ControlField } from "./ControlField";

interface ControlRowProps {
  id: string;
  control: ControlDef;
  locale: Locale;
  value: ThemeValue;
  onChange: (id: string, value: ThemeValue) => void;
}

// Memoized so editing one control re-renders only its row, not the whole panel of controls.
export const ControlRow = memo(function ControlRow({
  id,
  control,
  locale,
  value,
  onChange,
}: ControlRowProps) {
  const label = controlLabel(id, control.label, locale);
  const inputId = `ctl-${id}`;
  // Only numeric rows expose multiple trailing flex children, so the reserved-slot alignment fix is
  // scoped to them; the stepper's −/input/+ trio benefits from the same right-edge slot, while
  // color/select/segmented/toggle keep the bare field class and stay visually unchanged.
  const isNumeric =
    control.control === "slider" || control.control === "number" || control.control === "stepper";
  return (
    <div className={UiClass.row}>
      <label className={UiClass.rowLabel} htmlFor={inputId}>
        {label}
      </label>
      <div
        className={isNumeric ? `${UiClass.rowField} ${UiClass.rowFieldNumeric}` : UiClass.rowField}
      >
        <ControlField
          control={control}
          controlId={id}
          locale={locale}
          inputId={inputId}
          label={label}
          value={value}
          onChange={(next) => onChange(id, next)}
        />
      </div>
    </div>
  );
});
