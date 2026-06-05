import { type Locale, pdfFileName, type Theme } from "@md-pdf-studio/core";
import { desktopBridge } from "./bridge";
import { downloadBlob } from "./download";

export type ExportOutcome = { ok: true } | { ok: false; message: string };

const RENDER_ENDPOINT = "/api/render";
const PDF_MIME = "application/pdf";

/**
 * Export the current document to PDF through whichever shell is hosting the UI: the Electron bridge
 * (native save dialog) when present, otherwise the web render endpoint with a browser download.
 */
export async function exportPdf(
  markdown: string,
  theme: Theme,
  locale: Locale,
): Promise<ExportOutcome> {
  const options = { locale };
  const bridge = desktopBridge();
  if (bridge !== undefined) {
    const result = await bridge.exportPdf({ markdown, theme, options });
    return result.ok ? { ok: true } : { ok: false, message: result.message };
  }

  const response = await fetch(RENDER_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ markdown, theme, options }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, message: detail || `HTTP ${response.status}` };
  }
  downloadBlob(await response.arrayBuffer(), pdfFileName(theme.name), PDF_MIME);
  return { ok: true };
}
