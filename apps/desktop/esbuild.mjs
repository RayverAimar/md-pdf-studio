import { cp } from "node:fs/promises";
import { build } from "esbuild";

// Bundles the Electron main-process entry points (and the integration runner) into self-contained ESM,
// inlining the workspace packages and their deps. Only `electron` stays external — the runtime provides
// it. Pass entry points as CLI args; defaults to the app's main + preload (plus the renderer bundle).
const DEFAULT_ENTRIES = ["src/main.ts", "src/preload.ts"];

const entryPoints = process.argv.slice(2);
const isAppBuild = entryPoints.length === 0;

await build({
  entryPoints: isAppBuild ? DEFAULT_ENTRIES : entryPoints,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  external: ["electron"],
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  logLevel: "info",
  // The ESM output needs `require`/`__dirname` for bundled CommonJS deps. pdf.js also references the
  // canvas globals at load time; since we only read the PDF outline (never rasterize), empty stubs are
  // enough to satisfy the reference without pulling in a native canvas package.
  banner: {
    js: [
      "import { createRequire as __cr } from 'node:module';",
      "import { fileURLToPath as __furl } from 'node:url';",
      "import { dirname as __dn } from 'node:path';",
      "const require = __cr(import.meta.url);",
      "const __filename = __furl(import.meta.url);",
      "const __dirname = __dn(__filename);",
      "globalThis.DOMMatrix ||= class {};",
      "globalThis.ImageData ||= class {};",
      "globalThis.Path2D ||= class {};",
    ].join(" "),
  },
});

// The renderer: a browser bundle of the shared UI (the same <Studio/> the web app mounts) plus its
// page shell, loaded from file:// by the packaged window so the app runs with no dev server. The
// preview worker bundles alongside it; if file:// blocks the module worker, the pipeline falls back to
// the main thread, so the preview stays correct.
if (isAppBuild) {
  await build({
    entryPoints: ["src/renderer/renderer.tsx"],
    bundle: true,
    platform: "browser",
    format: "esm",
    target: ["chrome120"],
    outdir: "dist/renderer",
    outExtension: { ".js": ".mjs" },
    sourcemap: true,
    jsx: "automatic",
    loader: { ".ttf": "dataurl", ".woff": "dataurl", ".woff2": "dataurl" },
    logLevel: "info",
  });
  await cp("src/renderer/index.html", "dist/renderer/index.html");
}
