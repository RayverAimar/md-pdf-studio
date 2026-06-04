"use client";

import { UiClass } from "../../theme/chrome";

interface ToggleControlProps {
  inputId: string;
  value: boolean;
  onChange: (value: boolean) => void;
  // Forwarded to aria-describedby so the row tooltip is announced when the checkbox takes focus.
  describedBy?: string;
}

/** On/off control backed by a checkbox. */
export function ToggleControl({ inputId, value, onChange, describedBy }: ToggleControlProps) {
  return (
    <input
      id={inputId}
      type="checkbox"
      className={UiClass.toggle}
      checked={value}
      {...(describedBy !== undefined ? { "aria-describedby": describedBy } : {})}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
