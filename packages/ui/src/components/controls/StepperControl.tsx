"use client";

import { type ControlDef, type Locale, message } from "@md-pdf-studio/core";
import { useEffect, useState } from "react";
import { UiClass } from "../../theme/chrome";

interface StepperControlProps {
  control: ControlDef;
  inputId: string;
  label: string;
  value: number;
  locale: Locale;
  onChange: (value: number) => void;
  // Forwarded to the number input so the row tooltip is announced when the spinbutton takes focus.
  describedBy?: string;
}

// A spinbutton (−/+ around a native number input) for the small discrete integer domains where a drag
// slider can't reliably land on an exact value. The native input keeps role=spinbutton, so direct
// typing and Up/Down arrows still work; the buttons are an additive affordance, disabled at the bounds.
export function StepperControl({
  control,
  inputId,
  label,
  value,
  locale,
  onChange,
  describedBy,
}: StepperControlProps) {
  const { min, max } = control;
  const step = control.step ?? 1;
  const clamp = (n: number): number => Math.min(max ?? n, Math.max(min ?? n, n));
  // Hold the field as a draft string so it can be transiently empty mid-edit; an empty parse would
  // otherwise commit 0 and snap the controlled input. Resync when the value changes elsewhere.
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string): void => {
    setDraft(raw);
    if (raw.trim() === "") return;
    const next = Number(raw);
    if (!Number.isNaN(next)) onChange(next);
  };

  return (
    <>
      <button
        type="button"
        className={UiClass.btn}
        aria-label={message("decrement", locale)}
        disabled={min !== undefined && value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        −
      </button>
      <input
        id={inputId}
        type="number"
        className={UiClass.number}
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={draft}
        {...(describedBy !== undefined ? { "aria-describedby": describedBy } : {})}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => setDraft(String(value))}
      />
      <button
        type="button"
        className={UiClass.btn}
        aria-label={message("increment", locale)}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        +
      </button>
    </>
  );
}
