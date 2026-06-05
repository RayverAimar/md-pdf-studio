import { BASE_CSS } from "./base";
import { FontStack } from "./constants";
import {
  cssVarDeclaration,
  emitBoolean,
  emitMultiRule,
  emitProp,
  pageDeclaration,
} from "./emitters";
import { FONT_FACE_CSS } from "./fonts";
import { schema } from "./schema";
import type { ControlDef, Schema, Theme, ThemeValue } from "./types";

/** Shared hex literal shape: `#rgb` or `#rrggbb`. The single definition the validated color uses. */
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Whether a value is a hex color literal accepted by the color emitter. */
export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

// fontFamily interpolates verbatim into a rule, so the value is bounded to the bundled stacks the UI
// offers; anything else (a crafted theme value) cannot reach the stylesheet.
const ALLOWED_FONTS = new Set<string>(Object.values(FontStack));

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
      return typeof raw === "string" && isHexColor(raw) ? raw : control.default;
    case "enum":
      return (typeof raw === "string" || typeof raw === "number") &&
        control.enum?.includes(raw) === true
        ? raw
        : control.default;
    case "boolean":
      return typeof raw === "boolean" ? raw : control.default;
    case "fontFamily":
      return typeof raw === "string" && ALLOWED_FONTS.has(raw) ? raw : control.default;
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
      // `meta` controls feed the render layer (header/footer, TOC engine), not the stylesheet.
      case "meta":
        break;
    }
  }

  const layers: string[] = [];
  if (pageDecls.length > 0) layers.push(block("@page", pageDecls));
  if (varDecls.length > 0) layers.push(block(":root", varDecls));
  layers.push(...propRules, ...multiRules, ...booleanRules);
  return layers.join("\n");
}

/**
 * The full WYSIWYG stylesheet both the preview and the PDF use: bundled @font-face declarations, the
 * structural base layer, then the theme-driven rules. One definition of the layer order so the preview
 * and print paths cannot drift.
 */
export function composeDocumentCss(theme: Theme): string {
  return `${FONT_FACE_CSS}\n${BASE_CSS}\n${generateCss(schema, theme)}`;
}
