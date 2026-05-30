import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultPreset } from "@md-pdf-studio/core";
import { prepareContent, readHeadingPages } from "@md-pdf-studio/render";
import { app } from "electron";
import { ElectronRenderPort } from "../src/renderPort";

const RESULT_FILE = process.env["MDP_RESULT_FILE"] ?? join(tmpdir(), "mdp-integration-result.json");

// Headless/offscreen GPU is unreliable in a non-interactive run; software rendering is stable.
app.disableHardwareAcceleration();
// Destroying the render window must not let Electron auto-quit before assertions finish.
app.on("window-all-closed", () => {});

// Verifies the part of the desktop pipeline that only a real Chromium can prove: that printToPDF emits
// a named destination per heading and that pdf.js reads each back to the page it landed on, across a
// document long enough to span several pages.

function filler(paragraphs: number): string {
  const sentence =
    "The quick brown fox jumps over the lazy dog while the compliance analyst reviews the ledger. ";
  return Array.from({ length: paragraphs }, () => sentence.repeat(6)).join("\n\n");
}

function multiPageMarkdown(): string {
  const sections = ["Introduction", "Methodology", "Results", "Discussion", "Appendix"];
  const body = sections
    .map((title) => `## ${title}\n\n${filler(8)}\n\n### ${title} detail\n\n${filler(8)}`)
    .join("\n\n");
  return `# Report\n\n${filler(2)}\n\n${body}`;
}

async function run(): Promise<void> {
  const markdown = multiPageMarkdown();
  const port = new ElectronRenderPort();

  const result = await port.render({ markdown, theme: defaultPreset });
  assert.ok(result.ok, `render failed: ${result.ok ? "" : result.error.message}`);

  const pdf = result.pdf;
  const ids = prepareContent(markdown).headings.map((heading) => heading.id);
  const pages = pdf.byteLength > 0 ? await readHeadingPages(pdf, ids) : {};
  const resolved = ids.filter((id) => typeof pages[id] === "number");
  const pageNumbers = Object.values(pages);
  const maxPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 0;

  writeFileSync(
    RESULT_FILE,
    JSON.stringify(
      { pdfBytes: pdf.byteLength, headings: ids.length, resolved: resolved.length, maxPage, pages },
      null,
      2,
    ),
  );

  assert.ok(pdf.byteLength > 1000, "PDF looks empty");

  assert.equal(resolved.length, ids.length, "some headings had no named destination");
  assert.ok(maxPage > 1, "document did not span multiple pages; TOC paging unverified");
}

app
  .whenReady()
  .then(run)
  .then(() => app.exit(0))
  .catch((error: unknown) => {
    console.error("[integration] FAILED", error);
    app.exit(1);
  });
