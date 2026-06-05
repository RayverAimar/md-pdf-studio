import type { RenderResult } from "@md-pdf-studio/core";

// Shared RenderPort primitives both shells feed their Chromium printer. printBackground keeps colors and
// fills in the PDF; preferCSSPageSize lets the document's @page rule pick the sheet size. Platform-neutral,
// so the per-shell margin/temp-file bodies stay in each port.
export const PRINT_OPTIONS = {
  printBackground: true,
  preferCSSPageSize: true,
} as const;

/** Map a thrown render failure to the RenderResult error shape — identically in every shell. */
export function toRenderError(error: unknown): RenderResult {
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: { kind: "unknown", message } };
}
