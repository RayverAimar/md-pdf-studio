import { build } from "esbuild";

// Bundles the Electron main-process entry points (and the integration runner) into self-contained ESM,
// inlining the workspace packages and their deps. Only `electron` stays external — the runtime provides
// it. Pass entry points as CLI args; defaults to the app's main + preload.
const DEFAULT_ENTRIES = ["src/main.ts", "src/preload.ts"];

const entryPoints = process.argv.slice(2);

await build({
  entryPoints: entryPoints.length > 0 ? entryPoints : DEFAULT_ENTRIES,
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
