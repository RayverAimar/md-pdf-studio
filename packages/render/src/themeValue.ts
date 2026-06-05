import { schema, type ThemeValue } from "@md-pdf-studio/core";

/** Read a numeric theme value, falling back when it is missing or not a finite number. */
export function num(value: ThemeValue | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Read a string theme value, falling back when it is missing or not a string. */
export function str(value: ThemeValue | undefined, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/** Read a boolean theme value, falling back when it is missing or not a boolean. */
export function bool(value: ThemeValue | undefined, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// Schema defaults are the single source of truth for the meta/page controls the render layer reads, so
// these pull a control's declared default (or min/max bound) — keeping the geometry and the print bands
// from drifting from the values the editor shows.
export function schemaNumber(id: string, fallback: number): number {
  const def = schema.controls[id]?.default;
  return typeof def === "number" ? def : fallback;
}

export function schemaString(id: string, fallback: string): string {
  const def = schema.controls[id]?.default;
  return typeof def === "string" ? def : fallback;
}

export function schemaBound(id: string, edge: "min" | "max", fallback: number): number {
  const value = schema.controls[id]?.[edge];
  return typeof value === "number" ? value : fallback;
}
