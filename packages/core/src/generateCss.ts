import {
  cssVarDeclaration,
  emitBoolean,
  emitMultiRule,
  emitProp,
  pageDeclaration,
} from "./emitters";
import type { ControlDef, Schema, Theme, ThemeValue } from "./types";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let v = value;
  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

/** Resolve a control's effective value: the user's (validated/clamped) value, else its default. */
function resolveValue(control: ControlDef, raw: ThemeValue | undefined): ThemeValue {
  switch (control.type) {
    case "dimension":
    case "number":
    case "fontWeight":
      return typeof raw === "number" ? clamp(raw, control.min, control.max) : control.default;
    case "color":
      return typeof raw === "string" && HEX_RE.test(raw) ? raw : control.default;
    case "enum":
      return (typeof raw === "string" || typeof raw === "number") &&
        control.enum?.includes(raw) === true
        ? raw
        : control.default;
    case "boolean":
      return typeof raw === "boolean" ? raw : control.default;
    case "fontFamily":
      return typeof raw === "string" ? raw : control.default;
    default:
      return control.default;
  }
}

function block(selector: string, declarations: string[]): string {
  return `${selector} {\n${declarations.map((d) => `  ${d}`).join("\n")}\n}`;
}

/**
 * Build the complete stylesheet from a theme in one deterministic pass, emitting fixed layers in
 * order (@page, then :root variables, then element rules, mode rules and toggles) so emission order —
 * not selector specificity — decides overrides. The preview and the PDF call this same function.
 */
export function generateCss(schema: Schema, theme: Theme): string {
  const ids = Object.keys(schema.controls).sort();

  const pageDecls: string[] = [];
  const varDecls: string[] = [];
  const propRules: string[] = [];
  const multiRules: string[] = [];
  const booleanRules: string[] = [];

  for (const id of ids) {
    const control = schema.controls[id];
    if (control === undefined) continue;
    const value = resolveValue(control, theme.values[id]);

    switch (control.emitter) {
      case "page": {
        const decl = pageDeclaration(control, value);
        if (decl !== "") pageDecls.push(decl);
        break;
      }
      case "cssVar": {
        const decl = cssVarDeclaration(control, value);
        if (decl !== "") varDecls.push(decl);
        break;
      }
      case "prop": {
        const rule = emitProp(control, value);
        if (rule !== "") propRules.push(rule);
        break;
      }
      case "multiRule":
        multiRules.push(...emitMultiRule(control, value));
        break;
      case "boolean": {
        const rule = emitBoolean(control, value);
        if (rule !== "") booleanRules.push(rule);
        break;
      }
    }
  }

  const layers: string[] = [];
  if (pageDecls.length > 0) layers.push(block("@page", pageDecls));
  if (varDecls.length > 0) layers.push(block(":root", varDecls));
  layers.push(...propRules, ...multiRules, ...booleanRules);
  return layers.join("\n");
}
