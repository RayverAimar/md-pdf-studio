import type { Locale } from "./i18n";

export type Unit = "pt" | "px" | "em" | "rem" | "%" | "mm";

export type ControlType =
  | "dimension"
  | "color"
  | "enum"
  | "fontFamily"
  | "fontWeight"
  | "boolean"
  | "number";

// `meta` controls hold values read by the render layer (header/footer templates, TOC engine) rather
// than emitting document CSS; generateCss skips them so they never reach the stylesheet.
export type EmitterKind = "prop" | "page" | "multiRule" | "boolean" | "cssVar" | "meta";

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

export interface RenderOptions {
  /** Active UI locale; drives the TOC title and header/footer date formatting. */
  locale?: Locale;
}

export interface RenderInput {
  markdown: string;
  theme: Theme;
  options?: RenderOptions;
}

export interface RenderPort {
  render(input: RenderInput): Promise<RenderResult>;
}

/**
 * Outcome of a desktop export. A dismissed save dialog is a success with `canceled: true`, not an
 * error. This is the IPC contract between the Electron main process and the UI; both shells and the
 * UI import it so the boundary can never drift.
 */
export type DesktopExportResult =
  | { ok: true; canceled: boolean; path?: string }
  | { ok: false; message: string };

/** Surface the desktop shell exposes to the UI (via contextBridge); absent in the browser shell. */
export interface DesktopBridge {
  exportPdf(request: RenderInput): Promise<DesktopExportResult>;
}
