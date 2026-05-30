import { createRequire } from "node:module";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { HeadingPages } from "./document";

// pdf.js loads its parser as a worker via a runtime dynamic import a bundler can't follow. Pointing
// workerSrc at the file in node_modules keeps it resolvable from a bundled build too.
const resolveFrom = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = resolveFrom.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

// Chromium emits a named destination for every id that something links to. We read those back with
// pdf.js to learn which page each heading landed on — immune to duplicate text, emoji or wrapping,
// since we look up by id, not by matching rendered text.
export async function readHeadingPages(
  pdf: Uint8Array,
  headingIds: string[],
): Promise<HeadingPages> {
  // pdf.js transfers (neutralizes) the ArrayBuffer it is handed, so pass a copy — the caller keeps its
  // bytes intact, which matters because the same PDF is returned to the user after we read it.
  const loadingTask = getDocument({ data: pdf.slice(), useSystemFonts: true });
  const doc = await loadingTask.promise;
  try {
    const pages: HeadingPages = {};
    for (const id of headingIds) {
      const destination = await doc.getDestination(id);
      const target = destination?.[0];
      if (target === undefined || target === null) continue;
      pages[id] = (await doc.getPageIndex(target)) + 1;
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}
