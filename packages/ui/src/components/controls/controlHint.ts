import { type ControlDef, type Locale, message, optionLabel } from "@md-pdf-studio/core";

// Builds the tooltip text for a control purely from its schema def — the label plus, where it adds
// orientation, the numeric range (with unit) or the enum option set. No core/schema change: the data
// (control kind, min/max/unit/enum/type) already lives on the ControlDef the row holds, and the option
// labels reuse core's optionLabel so the tooltip reads exactly like the rendered widget. Pure and
// DOM-free so it unit-tests like nextActiveIndex/matchTypeAhead.
export function controlHint(
  control: ControlDef,
  controlId: string,
  label: string,
  locale: Locale,
): string {
  const sep = " — ";
  if (
    (control.control === "slider" ||
      control.control === "number" ||
      control.control === "stepper") &&
    control.min !== undefined &&
    control.max !== undefined
  ) {
    const to = message("rangeTo", locale);
    const unit = control.unit !== undefined ? ` ${control.unit}` : "";
    return `${label}${sep}${control.min} ${to} ${control.max}${unit}`;
  }
  if (
    control.control === "select" ||
    control.control === "segmented" ||
    control.control === "radio"
  ) {
    // Font stacks are long proper nouns and read the same in any locale, so the label alone is clearer
    // than enumerating the whole family list.
    if (control.type === "fontFamily") return label;
    const opts = (control.enum ?? []).map((value) => optionLabel(controlId, value, locale));
    return opts.length > 0 ? `${label}${sep}${opts.join(", ")}` : label;
  }
  return label;
}
