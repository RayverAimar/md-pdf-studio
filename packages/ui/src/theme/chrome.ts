// Single source of truth for the editor's own chrome — the shell around the document, distinct from
// the document Palette in core. Components never hardcode a color or spacing; they reference these
// class names, and every visual value resolves from the `Chrome` token object below.

// Only colors differ between light and dark; radius/space/font are scheme-independent and stay flat so
// they keep a single source of truth (duplicating them per scheme would invite drift). The two color
// maps share IDENTICAL keys so the var emitter below can never reference a key that exists in only one.
const lightColors = {
  app: "#0b1220",
  surface: "#ffffff",
  surfaceMuted: "#f5f7fb",
  surfaceSunken: "#eef1f7",
  surfaceHover: "#eef1f7",
  border: "#d8dee9",
  borderStrong: "#9aa5b8",
  text: "#1f2937",
  textMuted: "#5b6675",
  textFaint: "#737d8c",
  accent: "#2563eb",
  accentHover: "#1d4ed8",
  accentText: "#ffffff",
  focus: "#3b82f6",
  danger: "#be123c",
  success: "#15803d",
  successSurface: "#ecfdf3",
  info: "#1d4ed8",
  infoSurface: "#eff6ff",
  dangerSurface: "#fef2f2",
  shadowColor: "rgba(15,23,42,0.14)",
  shadowPop: "0 10px 30px rgba(15,23,42,0.18)",
} as const;

type ChromeColors = Record<keyof typeof lightColors, string>;

// Tuned for WCAG AA on dark surfaces (ratios documented in the issue plan); accentText flips to
// near-black because the dark accent fill is a light blue.
const darkColors: ChromeColors = {
  app: "#06080f",
  surface: "#10151f",
  surfaceMuted: "#161c28",
  surfaceSunken: "#0b0f17",
  surfaceHover: "#1b2230",
  border: "#27303f",
  borderStrong: "#5b6779",
  text: "#e6eaf1",
  textMuted: "#aab4c4",
  textFaint: "#7c879a",
  accent: "#3b82f6",
  accentHover: "#60a5fa",
  accentText: "#06080f",
  focus: "#60a5fa",
  danger: "#fb7185",
  success: "#4ade80",
  successSurface: "#0e2a1c",
  info: "#93c5fd",
  infoSurface: "#0e2030",
  dangerSurface: "#2c1418",
  shadowColor: "rgba(0,0,0,0.5)",
  shadowPop: "0 12px 32px rgba(0,0,0,0.55)",
} as const;

const Chrome = {
  color: { light: lightColors, dark: darkColors },
  radius: { sm: "7px", md: "10px", lg: "16px" },
  space: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  font: {
    ui: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  },
} as const;

/** Stable class names the chrome stylesheet defines and components consume. */
export const UiClass = {
  shell: "ui-shell",
  toolbar: "ui-toolbar",
  brand: "ui-brand",
  brandMark: "ui-brand-mark",
  brandWordmark: "ui-brand-wordmark",
  toolbarGroup: "ui-toolbar-group",
  grid: "ui-grid",
  pane: "ui-pane",
  paneEditor: "ui-pane-editor",
  panePreview: "ui-pane-preview",
  paneControls: "ui-pane-controls",
  paneHead: "ui-pane-head",
  paneBody: "ui-pane-body",
  previewFrame: "ui-preview-frame",
  editorHost: "ui-editor-host",
  section: "ui-section",
  sectionHead: "ui-section-head",
  sectionBody: "ui-section-body",
  sectionChevron: "ui-section-chevron",
  row: "ui-row",
  rowLabel: "ui-row-label",
  rowField: "ui-row-field",
  rowFieldNumeric: "ui-row-field--numeric",
  slider: "ui-slider",
  number: "ui-number",
  unit: "ui-unit",
  select: "ui-select",
  toggle: "ui-toggle",
  swatch: "ui-swatch",
  swatchPop: "ui-swatch-pop",
  hexInput: "ui-hex-input",
  btn: "ui-btn",
  btnPrimary: "ui-btn-primary",
  btnGhost: "ui-btn-ghost",
  search: "ui-search",
  segmented: "ui-segmented",
  segment: "ui-segment",
  segmentActive: "ui-segment-active",
  colorSchemeToggle: "ui-color-scheme-toggle",
  flag: "ui-flag",
  empty: "ui-empty",
  focusPulse: "ui-focus-pulse",
  srOnly: "ui-sr-only",
  pageFrame: "ui-page-frame",
  toastViewport: "ui-toast-viewport",
  toastRegion: "ui-toast-region",
  toast: "ui-toast",
  toastMessage: "ui-toast-message",
  toastDismiss: "ui-toast-dismiss",
  toastSuccess: "ui-toast-success",
  toastError: "ui-toast-error",
  toastInfo: "ui-toast-info",
  modal: "ui-modal",
  modalHead: "ui-modal-head",
  modalTitle: "ui-modal-title",
  modalBody: "ui-modal-body",
  modalSection: "ui-modal-section",
  modalSectionLabel: "ui-modal-section-label",
  modalActions: "ui-modal-actions",
  modalClose: "ui-modal-close",
  modalTextarea: "ui-modal-textarea",
  modalError: "ui-modal-error",
} as const;

const PAGE_FRAME_STYLE_ID = "ui-page-frame-style";

// Chrome injected INSIDE the preview iframe to draw the simulated printed page: a centred sheet with
// a drop shadow. The page width, margins and background are set as inline geometry from the page.*
// theme values (see PreviewPane); the document itself stays styled solely by generateCss output.
export const PREVIEW_FRAME_CSS = `
html { background: transparent; }
body { margin: 0; padding: 24px; display: flex; justify-content: center; }
.${UiClass.pageFrame} {
  box-sizing: border-box;
  margin-inline: auto;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12), 0 12px 32px rgba(15, 23, 42, 0.14);
}
@media (forced-colors: active) {
  .${UiClass.pageFrame} { border: 1px solid CanvasText; }
}
`;

export const PREVIEW_FRAME = {
  className: UiClass.pageFrame,
  styleId: PAGE_FRAME_STYLE_ID,
} as const;

const s = Chrome.space;
const r = Chrome.radius;

// One emitter for every color var so a token rename can never leave a stale literal; both schemes feed
// the same function, guaranteeing the light and dark sets stay structurally identical.
const emitColorVars = (cm: ChromeColors): string => `
  --ui-app: ${cm.app};
  --ui-surface: ${cm.surface};
  --ui-surface-muted: ${cm.surfaceMuted};
  --ui-surface-sunken: ${cm.surfaceSunken};
  --ui-surface-hover: ${cm.surfaceHover};
  --ui-border: ${cm.border};
  --ui-border-strong: ${cm.borderStrong};
  --ui-text: ${cm.text};
  --ui-text-muted: ${cm.textMuted};
  --ui-text-faint: ${cm.textFaint};
  --ui-accent: ${cm.accent};
  --ui-accent-hover: ${cm.accentHover};
  --ui-accent-text: ${cm.accentText};
  --ui-focus: ${cm.focus};
  --ui-danger: ${cm.danger};
  --ui-success: ${cm.success};
  --ui-success-surface: ${cm.successSurface};
  --ui-info: ${cm.info};
  --ui-info-surface: ${cm.infoSurface};
  --ui-danger-surface: ${cm.dangerSurface};
  --ui-shadow-color: ${cm.shadowColor};
  --ui-shadow-pop: ${cm.shadowPop};`;

// Scheme-independent vars live in one place; only colors are re-declared under the dark scope.
const STATIC_VARS = `--ui-radius-sm: ${r.sm}; --ui-radius-md: ${r.md}; --ui-radius-lg: ${r.lg}; --ui-radius-full: 999px; --ui-font-ui: ${Chrome.font.ui}; --ui-font-mono: ${Chrome.font.mono};`;

// Built once from the token object so a token change can never leave a stale literal behind. Light is
// the :root default (so the server render and the pre-toggle paint use it); dark re-declares ONLY the
// color vars under the shell attribute selector. An attribute, not @media, because the user's explicit
// persisted choice must always win — the OS preference is consulted only for the unset default.
export const CHROME_CSS = `
:root { ${STATIC_VARS}${emitColorVars(Chrome.color.light)} }
/* Dark scope: scoped to the shell so nothing outside the editor changes and the preview iframe — a
   separate document with its own CSSOM — can never see these vars. */
.${UiClass.shell}[data-ui-theme="dark"] { ${emitColorVars(Chrome.color.dark)} }
.${UiClass.shell} {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--ui-app);
  color: var(--ui-text);
  font-family: var(--ui-font-ui);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}
.${UiClass.shell} *, .${UiClass.shell} *::before, .${UiClass.shell} *::after { box-sizing: border-box; }
.${UiClass.toolbar} {
  display: flex;
  align-items: center;
  gap: ${s.lg};
  padding: ${s.sm} ${s.lg};
  background: var(--ui-surface);
  border-bottom: 1px solid var(--ui-border);
  flex: 0 0 auto;
}
.${UiClass.brand} {
  display: inline-flex;
  align-items: center;
  gap: ${s.sm};
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-right: auto;
  font-size: 15px;
}
/* The mark inherits the token via currentColor so the logo color stays single-sourced in Chrome.accent. */
.${UiClass.brandMark} { color: var(--ui-accent); display: block; flex: 0 0 auto; }
/* The hyphenated wordmark must never break across lines at its hyphens. */
.${UiClass.brandWordmark} { color: var(--ui-text); white-space: nowrap; }
.${UiClass.toolbarGroup} { display: flex; align-items: center; gap: ${s.sm}; }
.${UiClass.grid} {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.4fr) minmax(300px, 0.95fr);
  min-height: 0;
  background: var(--ui-border);
  gap: 1px;
}
.${UiClass.pane} {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: var(--ui-surface);
}
.${UiClass.panePreview} { background: var(--ui-surface-sunken); }
.${UiClass.paneHead} {
  flex: 0 0 auto;
  padding: ${s.sm} ${s.md};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-faint);
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-surface);
}
.${UiClass.paneBody} { flex: 1 1 auto; min-height: 0; overflow: auto; }
.${UiClass.editorHost} { height: 100%; }
.${UiClass.editorHost} .cm-editor { height: 100%; font-family: var(--ui-font-mono); font-size: 13.5px; }
.${UiClass.editorHost} .cm-editor.cm-focused { outline: none; }
.${UiClass.editorHost} .cm-scroller { padding: ${s.sm} 0; }
.${UiClass.panePreview} .${UiClass.paneBody} { padding: 0; }
.${UiClass.previewFrame} {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--ui-surface-sunken);
}
.${UiClass.section} { border-bottom: 1px solid var(--ui-border); }
.${UiClass.sectionHead} {
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${s.sm};
  padding: ${s.md};
  background: none;
  border: none;
  font: inherit;
  font-weight: 600;
  color: var(--ui-text);
  cursor: pointer;
  text-align: left;
}
.${UiClass.sectionHead}:hover { background: var(--ui-surface-hover); }
.${UiClass.sectionChevron} { color: var(--ui-text-faint); transition: transform 0.15s ease; }
.${UiClass.sectionBody} { padding: 0 ${s.md} ${s.md}; display: grid; gap: ${s.md}; }
.${UiClass.row} { display: grid; grid-template-columns: 1fr; gap: ${s.xs}; }
.${UiClass.rowLabel} { font-size: 12px; color: var(--ui-text-muted); font-weight: 500; }
.${UiClass.rowField} { display: flex; align-items: center; gap: ${s.sm}; }
.${UiClass.slider} { flex: 1 1 auto; accent-color: var(--ui-accent); }
.${UiClass.number} {
  width: 64px;
  padding: ${s.xs} ${s.sm};
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  font: inherit;
  font-size: 12px;
  color: var(--ui-text);
  background: var(--ui-surface);
}
.${UiClass.unit} { font-size: 11px; color: var(--ui-text-faint); min-width: 22px; }
/* Reserve a constant-width trailing slot after the number box so unit and unit-less numeric rows share
   one right edge; scoped to the numeric modifier so color/select/toggle rows are untouched. */
.${UiClass.rowFieldNumeric} .${UiClass.number} { flex: 0 0 auto; }
.${UiClass.rowFieldNumeric} .${UiClass.unit} { flex: 0 0 auto; }
.${UiClass.select}, .${UiClass.hexInput} {
  padding: ${s.xs} ${s.sm};
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  font: inherit;
  font-size: 13px;
  color: var(--ui-text);
  background: var(--ui-surface);
}
.${UiClass.select} { flex: 1 1 auto; }
.${UiClass.hexInput} { width: 92px; font-family: var(--ui-font-mono); font-size: 12px; text-transform: lowercase; }
.${UiClass.toggle} { width: 38px; height: 22px; accent-color: var(--ui-accent); cursor: pointer; }
.${UiClass.swatch} {
  width: 30px;
  height: 30px;
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-border-strong);
  cursor: pointer;
  padding: 0;
  flex: 0 0 auto;
}
.${UiClass.swatchPop} {
  position: absolute;
  z-index: 20;
  padding: ${s.sm};
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-md);
  box-shadow: var(--ui-shadow-pop);
}
.${UiClass.btn} {
  display: inline-flex;
  align-items: center;
  gap: ${s.xs};
  padding: ${s.sm} ${s.md};
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  background: var(--ui-surface);
  color: var(--ui-text);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-height: 34px;
}
.${UiClass.btn}:hover { background: var(--ui-surface-hover); }
.${UiClass.btn}:disabled { opacity: 0.55; cursor: default; }
.${UiClass.btnPrimary} { background: var(--ui-accent); border-color: var(--ui-accent); color: var(--ui-accent-text); }
.${UiClass.btnPrimary}:hover { background: var(--ui-accent-hover); }
.${UiClass.btnGhost} { border-color: transparent; background: none; }
.${UiClass.btnGhost}:hover { background: var(--ui-surface-hover); }
.${UiClass.search} {
  width: 100%;
  padding: ${s.sm} ${s.md};
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  font: inherit;
  font-size: 13px;
  color: var(--ui-text);
  background: var(--ui-surface);
}
.${UiClass.segmented} { display: inline-flex; border: 1px solid var(--ui-border-strong); border-radius: var(--ui-radius-sm); overflow: hidden; }
.${UiClass.segment} {
  display: inline-flex;
  align-items: center;
  gap: ${s.xs};
  padding: ${s.xs} ${s.md};
  border: none;
  background: var(--ui-surface);
  color: var(--ui-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  min-height: 30px;
}
.${UiClass.segment} + .${UiClass.segment} { border-left: 1px solid var(--ui-border-strong); }
.${UiClass.segmentActive} { background: var(--ui-accent); color: var(--ui-accent-text); }
/* The inset hairline keeps a white-heavy flag legible on both light and dark surfaces. */
.${UiClass.flag} {
  width: 18px;
  height: 13px;
  border-radius: 2px;
  flex: 0 0 auto;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ui-text) 14%, transparent);
}
.${UiClass.empty} { padding: ${s.lg}; color: var(--ui-text-faint); font-size: 13px; text-align: center; }
.${UiClass.focusPulse} { animation: ui-pulse 1.1s ease; }
@keyframes ui-pulse {
  0% { background: color-mix(in srgb, var(--ui-accent) 16%, transparent); }
  100% { background: transparent; }
}
.${UiClass.srOnly} {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.${UiClass.shell} :focus-visible { outline: 2px solid var(--ui-focus); outline-offset: 1px; border-radius: var(--ui-radius-sm); }
.${UiClass.toastViewport} {
  position: fixed;
  inset: auto ${s.lg} ${s.lg} auto;
  z-index: 50;
  display: flex;
  flex-direction: column-reverse;
  gap: ${s.sm};
  max-width: min(380px, calc(100vw - ${s.xl}));
  pointer-events: none;
}
.${UiClass.toastRegion} { display: contents; }
.${UiClass.toast} {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: ${s.sm};
  padding: ${s.sm} ${s.md};
  border: 1px solid var(--ui-border);
  border-left: 3px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-md);
  background: var(--ui-surface);
  color: var(--ui-text);
  box-shadow: var(--ui-shadow-pop);
  font-size: 13px;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.${UiClass.toastSuccess} { background: var(--ui-success-surface); border-left-color: var(--ui-success); }
.${UiClass.toastError} { background: var(--ui-danger-surface); border-left-color: var(--ui-danger); }
.${UiClass.toastInfo} { background: var(--ui-info-surface); border-left-color: var(--ui-info); }
.${UiClass.toastMessage} { flex: 1 1 auto; }
.${UiClass.toastDismiss} {
  flex: 0 0 auto;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ui-text-faint);
  font: inherit;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}
.${UiClass.toastDismiss}:hover { color: var(--ui-text); }
.${UiClass.modal} {
  width: min(640px, calc(100vw - ${s.xl}));
  max-height: min(80vh, 720px);
  padding: 0;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface);
  color: var(--ui-text);
  box-shadow: var(--ui-shadow-pop);
  font-family: var(--ui-font-ui);
  overflow: hidden;
}
/* ::backdrop does not inherit custom properties, so the scrim is a house-consistent literal from the
   same rgba family as the elevation shadows above. The dark scheme darkens it via one extra rule. */
.${UiClass.modal}::backdrop { background: rgba(15, 23, 42, 0.45); }
.${UiClass.shell}[data-ui-theme="dark"] .${UiClass.modal}::backdrop { background: rgba(0, 0, 0, 0.6); }
.${UiClass.modalHead} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${s.md};
  padding: ${s.md} ${s.lg};
  border-bottom: 1px solid var(--ui-border);
}
.${UiClass.modalTitle} { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
.${UiClass.modalBody} {
  padding: ${s.lg};
  display: grid;
  gap: ${s.lg};
  max-height: calc(80vh - 56px);
  overflow: auto;
}
.${UiClass.modalSection} { display: grid; gap: ${s.sm}; }
.${UiClass.modalSectionLabel} { font-size: 12px; font-weight: 600; color: var(--ui-text-muted); }
.${UiClass.modalTextarea} {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  padding: ${s.sm} ${s.md};
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  font-family: var(--ui-font-mono);
  font-size: 12.5px;
  color: var(--ui-text);
  background: var(--ui-surface-muted);
}
.${UiClass.modalError} { color: var(--ui-danger); font-size: 12px; margin: 0; }
.${UiClass.modalActions} { display: flex; justify-content: flex-end; gap: ${s.sm}; }
.${UiClass.modalClose} {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ui-text-faint);
  font: inherit;
  font-size: 18px;
  line-height: 1;
  padding: 0;
}
.${UiClass.modalClose}:hover { color: var(--ui-text); }
@media (forced-colors: active) {
  .${UiClass.toast} { border: 1px solid CanvasText; }
  .${UiClass.modal} { border: 1px solid CanvasText; }
  /* High Contrast flattens the accent fill, so keep the mark visible with a system color. */
  .${UiClass.brandMark} { color: LinkText; }
  /* High Contrast flattens the accent fill, so cue the selected segment with the system Highlight pair. */
  .${UiClass.segmentActive} { background: Highlight; color: HighlightText; }
}
@media (prefers-reduced-motion: reduce) {
  .${UiClass.focusPulse} { animation: none; }
  .${UiClass.sectionChevron} { transition: none; }
  .${UiClass.toast} { transition: none; }
}
/* The fixed three-column grid degrades gracefully: first the editor folds under the preview, then the
   controls drop below as the viewport narrows, so each pane keeps a usable width on small screens. */
@media (max-width: 1100px) {
  .${UiClass.grid} {
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.95fr);
    grid-template-rows: minmax(220px, 0.9fr) minmax(0, 1.6fr);
  }
  .${UiClass.paneEditor} { grid-column: 1; grid-row: 1; }
  .${UiClass.panePreview} { grid-column: 1; grid-row: 2; }
  .${UiClass.paneControls} { grid-column: 2; grid-row: 1 / span 2; }
}
@media (max-width: 720px) {
  .${UiClass.grid} {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(180px, auto) minmax(280px, 1fr) minmax(200px, auto);
  }
  .${UiClass.paneEditor} { grid-column: 1; grid-row: 1; }
  .${UiClass.panePreview} { grid-column: 1; grid-row: 2; }
  .${UiClass.paneControls} { grid-column: 1; grid-row: 3; }
  .${UiClass.toolbar} { flex-wrap: wrap; gap: ${s.sm} ${s.md}; }
  .${UiClass.brand} { margin-right: 0; flex: 1 0 100%; }
}
`;
