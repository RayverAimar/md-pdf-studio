import type { ControlDef, ThemeValue } from "../types";

// Every control reaches CSS only through one of these typed emitters, with an already-validated
// value. There is no path from a user value to arbitrary CSS.

/** Format a control's value into a CSS token, appending its unit when the control declares one. */
export function formatValue(control: ControlDef, value: ThemeValue): string {
  if (typeof value === "number" && control.unit !== undefined) {
    return `${value}${control.unit}`;
  }
  return String(value);
}

/** `prop` — one declaration on the control's single-class selector. */
export function emitProp(control: ControlDef, value: ThemeValue): string {
  const selector = control.css?.selector;
  const prop = control.css?.prop;
  if (selector === undefined || prop === undefined) return "";
  return `${selector} { ${prop}: ${formatValue(control, value)}; }`;
}

/** `page` — a single `@page` declaration (e.g. `size: A4`), aggregated into one block by generateCss. */
export function pageDeclaration(control: ControlDef, value: ThemeValue): string {
  const atPage = control.css?.atPage;
  if (atPage === undefined) return "";
  return `${atPage}: ${formatValue(control, value)};`;
}

/** `cssVar` — a single custom-property declaration, aggregated into one `:root` block. */
export function cssVarDeclaration(control: ControlDef, value: ThemeValue): string {
  const name = control.css?.var;
  if (name === undefined) return "";
  return `${name}: ${formatValue(control, value)};`;
}

/** `multiRule` — the pre-approved rule set for the chosen enum value (e.g. table border mode). */
export function emitMultiRule(control: ControlDef, value: ThemeValue): string[] {
  const rules = control.rules?.[String(value)];
  if (rules === undefined) return [];
  return rules.map((r) => `${r.selector} { ${r.decl}; }`);
}

/** `boolean` — a pre-baked rule chosen by the toggle state; either side may be empty. */
export function emitBoolean(control: ControlDef, value: ThemeValue): string {
  const rule = value === true ? control.css?.whenTrue : control.css?.whenFalse;
  return rule ?? "";
}
