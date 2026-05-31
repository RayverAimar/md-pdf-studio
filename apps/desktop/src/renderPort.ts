import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { RenderInput, RenderPort, RenderResult } from "@md-pdf-studio/core";
import { type RenderHtmlToPdf, renderDocumentWithToc } from "@md-pdf-studio/render";
import { BrowserWindow } from "electron";

const PRINT_OPTIONS = {
  printBackground: true,
  preferCSSPageSize: true,
} as const;

const MM_PER_INCH = 25.4;

function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

// Each render pass writes its HTML to a temp file and loads it: data: URLs cap out around 2 MB, which
// real documents exceed, and file URLs let relative assets resolve later.
function printerFor(window: BrowserWindow, scratchDir: string): RenderHtmlToPdf {
  let pass = 0;
  return async (html, meta) => {
    const file = join(scratchDir, `pass-${pass}.html`);
    pass += 1;
    await writeFile(file, html, "utf8");
    await window.loadURL(pathToFileURL(file).href);
    await window.webContents.executeJavaScript("document.fonts.ready.then(() => true)");
    const pdf = await window.webContents.printToPDF({
      ...PRINT_OPTIONS,
      displayHeaderFooter: meta.displayHeaderFooter,
      headerTemplate: meta.headerTemplate,
      footerTemplate: meta.footerTemplate,
      // Electron expects inches and an explicit custom margin type to honour reserved bands.
      margins: {
        marginType: "custom",
        top: mmToInches(meta.marginTopMm),
        right: mmToInches(meta.marginRightMm),
        bottom: mmToInches(meta.marginBottomMm),
        left: mmToInches(meta.marginLeftMm),
      },
    });
    return new Uint8Array(pdf);
  };
}

/** RenderPort backed by Electron's bundled Chromium. The two-pass TOC logic is shared, not duplicated. */
export class ElectronRenderPort implements RenderPort {
  async render(input: RenderInput): Promise<RenderResult> {
    const window = new BrowserWindow({ show: false });
    const scratchDir = await mkdtemp(join(tmpdir(), "mdp-render-"));
    try {
      const pdf = await renderDocumentWithToc(input, {
        renderHtmlToPdf: printerFor(window, scratchDir),
      });
      return { ok: true, pdf };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { kind: "unknown", message } };
    } finally {
      window.destroy();
      await rm(scratchDir, { recursive: true, force: true });
    }
  }
}
