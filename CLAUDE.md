# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project

**md-pdf-studio** — a visual Markdown → PDF editor where the user adjusts ~155 granular,
schema-driven style controls (per-element typography, color, spacing, tables, code, syntax token
colors, page) **without writing CSS**, with a live WYSIWYG preview. Two shells over one shared core:
**web** (Next.js + Puppeteer) and **desktop** (Electron). Personal side-project.

The full design rationale lives in `DESIGN.md` — **gitignored, local only**. Ask the owner if you
need it; do not recreate or commit it.

## Monorepo layout (pnpm workspaces + Turborepo)

- **`packages/core`** — framework-agnostic TS. `schema.ts` (the ~155 control definitions = single
  source of truth), `generateCss.ts` (typed emitters), `markdown.ts` (markdown-it), `highlight.ts`
  (Shiki), `sanitize.ts`, `transforms.ts`, `migrations.ts`, `types.ts`.
- **`packages/render`** — `RenderPort` interface + shared 2-pass TOC (`readPages.ts` uses pdf.js
  named-destinations; no native binary).
- **`packages/ui`** — React components, Zustand store, web-worker pipeline.
- **`apps/web`** — Next.js; `PuppeteerRenderPort` in `app/api/render/route.ts`.
- **`apps/desktop`** — Electron (ESM main); `ElectronRenderPort` via `webContents.printToPDF()`.
- **`presets/`** — versioned theme JSONs. **`fonts/`** — bundled (Inter, JetBrains Mono, SIL OFL).

## Commands (from repo root)

```bash
pnpm install
pnpm lint        # biome check .
pnpm lint:fix    # biome check --write .
pnpm format      # biome format --write .
pnpm typecheck   # turbo run typecheck (tsc --noEmit per package)
pnpm dev | build | test
```

Run `pnpm lint` and `pnpm typecheck` before every commit. Both must be clean.

## Conventions

- **Tooling:** Biome 2.x is the single tool for lint + format + import-organizing. No ESLint/Prettier.
- **TypeScript at strictest** (`tsconfig.base.json`: strict, noUnusedLocals/Parameters,
  exactOptionalPropertyTypes, noImplicitReturns, etc.). 0 errors is the baseline.
- **Dependencies pinned EXACT** — no caret ranges; `.npmrc` sets `save-exact=true`. When adding a
  dependency, pin the exact current version and commit the updated `pnpm-lock.yaml`.
- **ESM throughout.** Desktop main is ESM/NodeNext — use `import.meta.dirname`, never `__dirname`.
- **Code in English.** Match surrounding style. Comments: WHY only, never WHAT; no phase/refactor comments.

## Core design rules (do not violate)

- **The schema is the single source of truth.** Both the UI and the CSS generator derive from
  `packages/core/schema.ts`. Adding a control = one schema entry; never hand-wire a control in the UI
  or emit CSS outside an emitter.
- **No free CSS = structural safety.** Every control emits through a typed emitter
  (`prop` / `page` / `multiRule` / `boolean` / `cssVar`) with a bounded value (range / enum /
  validated hex). There is no path from user input to arbitrary CSS.
- **HTML safety is a separate concern.** Markdown may contain raw HTML → always sanitize
  (DOMPurify in preview, sanitize-html on the server) via the shared allowlist. Never inject raw HTML.
- **WYSIWYG is the product.** Preview and PDF must use the same `generateCss` output and the same
  Shiki highlighter. Don't introduce a second highlighter or a preview-only stylesheet.

## Rendering notes (Chromium, both shells)

- **TOC needs 2 passes** — Chromium has no `target-counter`. Map heading `id` → page via pdf.js
  `getDestination`/`getPageIndex`; headings need a hidden `<a href="#id">` to emit named destinations.
  Iterate to a fixed point to absorb the page-shift the TOC itself causes.
- Header/footer via Puppeteer/`printToPDF` **templates** (default `font-size: 0`; inline all styles;
  images as base64), not `@page` margin boxes. Use `preferCSSPageSize` and `printBackground: true`.
- Fixed transforms: inject `<details open>`; force `pre { overflow: visible; white-space: pre-wrap }`.
- `RenderPort` hides the per-shell difference (`page.pdf()` vs `webContents.printToPDF()` + pass-1
  introspection); the 2-pass TOC logic itself is shared in `packages/render`.

## Git

- Default branch: **main**. PRs target `main`.
- Owner-specific commit/PR conventions live in Claude's memory for this project.
