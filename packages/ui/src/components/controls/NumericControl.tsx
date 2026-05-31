"use client";

import type { ControlDef } from "@md-pdf-studio/core";
import { useEffect, useState } from "react";
import { UiClass } from "../../theme/chrome";

interface NumericControlProps {
  control: ControlDef;
  inputId: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  withSlider: boolean;
}

/** Slider + number entry for dimensions, weights and unitless numbers. Bounds come from the schema. */
export function NumericControl({
  control,
  inputId,
  label,
  value,
  onChange,
  withSlider,
}: NumericControlProps) {
  const { min, max, step, unit } = control;
  // Hold the number field as a draft string so it can be transiently empty mid-edit; an empty parse
  // would otherwise commit 0 and snap the controlled input. Resync when the value changes elsewhere.
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
      {withSlider ? (
        <input
          type="range"
          className={UiClass.slider}
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => commit(event.target.value)}
        />
      ) : null}
      <input
        id={inputId}
        type="number"
        className={UiClass.number}
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => setDraft(String(value))}
      />
      {unit !== undefined ? <span className={UiClass.unit}>{unit}</span> : null}
    </>
  );
}
