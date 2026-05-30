export type Unit = "pt" | "px" | "em" | "rem" | "%" | "mm";

export type ControlType =
  | "dimension"
  | "color"
  | "enum"
  | "fontFamily"
  | "fontWeight"
  | "boolean"
  | "number";

export type EmitterKind = "prop" | "page" | "multiRule" | "boolean" | "cssVar";

export type WidgetKind = "slider" | "number" | "color" | "select" | "radio" | "toggle";

export interface CssTarget {
  selector?: string;
  prop?: string;
  atPage?: string;
  var?: string;
  whenTrue?: string;
  whenFalse?: string;
}

export interface MultiRule {
  selector: string;
  decl: string;
}

export interface ControlDef {
  type: ControlType;
  emitter: EmitterKind;
  control: WidgetKind;
  default: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: Unit;
  allowedUnits?: Unit[];
  enum?: Array<string | number>;
  format?: "hex";
  css?: CssTarget;
  rules?: Record<string, MultiRule[]>;
  section: string;
  label: string;
  synonyms?: string[];
  advanced?: boolean;
}

export interface Schema {
  version: number;
  controls: Record<string, ControlDef>;
}

export type ThemeValue = string | number | boolean;
export type ThemeValues = Record<string, ThemeValue>;

export interface Theme {
  schemaVersion: number;
  name: string;
  values: ThemeValues;
}

export type RenderError =
  | { kind: "chromium_launch"; message: string }
  | { kind: "toc_unresolved"; message: string; missing: string[] }
  | { kind: "font_missing"; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "sanitize_blocked"; message: string }
  | { kind: "unknown"; message: string };

export type RenderResult = { ok: true; pdf: Uint8Array } | { ok: false; error: RenderError };

export interface RenderInput {
  markdown: string;
  theme: Theme;
}

export interface RenderPort {
  render(input: RenderInput): Promise<RenderResult>;
}
