import type { ThemeValue } from "@md-pdf-studio/core";

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
