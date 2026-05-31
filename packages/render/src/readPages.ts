import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { HeadingPages } from "./document";

const WORKER_MODULE = "pdfjs-dist/legacy/build/pdf.worker.mjs";

// pdf.js loads its parser as a worker via a runtime dynamic import a bundler can't follow, so point
// workerSrc at the real file. Resolving from this module's URL works under esbuild (real path), but a
// Turbopack build gives a virtual URL that resolves to a non-existent path; fall back to the process
// working directory, and verify the file exists before trusting either candidate.
function resolveWorkerSrc(): string | undefined {
  const bases = [import.meta.url, pathToFileURL(join(process.cwd(), "_")).href];
  for (const base of bases) {
    try {
      const resolved = createRequire(base).resolve(WORKER_MODULE);
      if (existsSync(resolved)) return resolved;
    } catch {
      // Try the next base.
    }
  }
  return undefined;
}

const workerSrc = resolveWorkerSrc();
if (workerSrc !== undefined) GlobalWorkerOptions.workerSrc = workerSrc;

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
