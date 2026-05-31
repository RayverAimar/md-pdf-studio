"use client";

import { UiClass } from "../../theme/chrome";

interface ToggleControlProps {
  inputId: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** On/off control backed by a checkbox. */
export function ToggleControl({ inputId, value, onChange }: ToggleControlProps) {
  return (
    <input
      id={inputId}
      type="checkbox"
      className={UiClass.toggle}
      checked={value}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
