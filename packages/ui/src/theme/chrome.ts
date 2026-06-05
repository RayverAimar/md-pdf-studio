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

// Tuned for WCAG AA on dark surfaces; accentText flips to
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

// Exported so the CodeMirror editor theme (editorTheme.ts) can pull its CONTAINER colors (surface,
// text, gutter, selection) from the same token maps instead of re-hardcoding hexes. Only the syntax
// highlight colors stay as sibling literals there, because CodeMirror's HighlightStyle is built before
// the CSSOM resolves the --ui-* vars and cannot read CSS custom properties.
export const Chrome = {
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
  workspace: "ui-workspace",
  grid: "ui-grid",
  pane: "ui-pane",
  paneEditor: "ui-pane-editor",
  panePreview: "ui-pane-preview",
  paneHead: "ui-pane-head",
  paneBody: "ui-pane-body",
  previewFrame: "ui-preview-frame",
  editorHost: "ui-editor-host",
  inspectorDock: "ui-inspector-dock",
  inspectorRail: "ui-inspector-collapsed",
  dockClip: "ui-dock-clip",
  rail: "ui-rail",
  railHead: "ui-rail-head",
  railList: "ui-rail-list",
  railBand: "ui-rail-band",
  railBandLabel: "ui-rail-band-label",
  railTab: "ui-rail-tab",
  railTabActive: "ui-rail-tab--active",
  railTabText: "ui-rail-tab-text",
  modifiedDot: "ui-modified-dot",
  dockHandle: "ui-dock-handle",
  scopeChips: "ui-scope-chips",
  scopeChip: "ui-scope-chip",
  scopeChipActive: "ui-scope-chip--active",
  inspector: "ui-inspector",
  inspectorHead: "ui-inspector-head",
  inspectorTitle: "ui-inspector-title",
  inspectorBody: "ui-inspector-body",
  facetGroup: "ui-facet-group",
  facetLabel: "ui-facet-label",
  facetBody: "ui-facet-body",
  levelGroup: "ui-level-group",
  levelToggle: "ui-level-toggle",
  levelChevron: "ui-level-chevron",
  swatchGrid: "ui-swatch-grid",
  swatchCell: "ui-swatch-cell",
  swatchCellLabel: "ui-swatch-cell-label",
  tooltipWrap: "ui-tooltipWrap",
  tooltip: "ui-tooltip",
  row: "ui-row",
  rowCompact: "ui-row--compact",
  rowLabel: "ui-row-label",
  rowField: "ui-row-field",
  rowFieldNumeric: "ui-row-field--numeric",
  colorField: "ui-color-field",
  slider: "ui-slider",
  number: "ui-number",
  unit: "ui-unit",
  select: "ui-select",
  selectTrigger: "ui-select-trigger",
  selectChevron: "ui-select-chevron",
  selectMenu: "ui-select-menu",
  selectOption: "ui-select-option",
  selectOptionActive: "ui-select-option--active",
  selectOptionSelected: "ui-select-option--selected",
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

const PREVIEW_BAND = "ui-page-band";
const PREVIEW_BAND_HEADER = "ui-page-band-header";
const PREVIEW_BAND_FOOTER = "ui-page-band-footer";

// Chrome injected INSIDE the preview iframe to draw the simulated printed page: a centred sheet with
// a drop shadow. The page width, margins and background are set as inline geometry from the shared
// pageGeometry (see PreviewPane); the document itself stays styled solely by generateCss output.
//
// The frame is positioned so the header/footer band strips can sit absolutely in the reserved margin
// region the PDF leaves for them. The bands carry markup straight from buildPrintMeta, so they mirror
// the PDF; this chrome only places and sizes the strip — it never restyles the band or the document.
export const PREVIEW_FRAME_CSS = `
html { background: transparent; }
body { margin: 0; padding: 24px; display: flex; justify-content: center; }
.${UiClass.pageFrame} {
  box-sizing: border-box;
  position: relative;
  margin-inline: auto;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12), 0 12px 32px rgba(15, 23, 42, 0.14);
}
/* Reserved-strip placement only; the inner band div styles itself from buildPrintMeta's inline CSS. */
.${PREVIEW_BAND} {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.${PREVIEW_BAND_HEADER} { top: 0; }
.${PREVIEW_BAND_FOOTER} { bottom: 0; }
.${PREVIEW_BAND} > div { width: 100%; }
@media (forced-colors: active) {
  .${UiClass.pageFrame} { border: 1px solid CanvasText; }
}
`;

export const PREVIEW_FRAME = {
  className: UiClass.pageFrame,
  styleId: PAGE_FRAME_STYLE_ID,
  band: PREVIEW_BAND,
  bandHeader: PREVIEW_BAND_HEADER,
  bandFooter: PREVIEW_BAND_FOOTER,
} as const;

const s = Chrome.space;
const r = Chrome.radius;

// Caps the custom dropdown menu so a long option list scrolls inside it; shared with the Dropdown
// component's flip math so the CSS cap and the viewport-edge estimate can never drift apart.
export const MENU_MAX_HEIGHT_PX = 280;

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
const STATIC_VARS = `--ui-radius-sm: ${r.sm}; --ui-radius-md: ${r.md}; --ui-radius-lg: ${r.lg}; --ui-radius-full: 999px; --ui-font-ui: ${Chrome.font.ui}; --ui-font-mono: ${Chrome.font.mono}; --ui-rail-w: 210px; --ui-inspector-w: clamp(320px, 26vw, 400px);`;

// Built once from the token object so a token change can never leave a stale literal behind. Light is
// the :root default (so the server render and the pre-toggle paint use it); dark re-declares ONLY the
// color vars under the shell attribute selector. An attribute, not @media, because the user's explicit
// persisted choice must always win — the OS preference is consulted only for the unset default.
export const CHROME_CSS = `
:root { ${STATIC_VARS}${emitColorVars(Chrome.color.light)} }
/* Dark scope: scoped to the shell so nothing outside the editor changes and the preview iframe — a
   separate document with its own CSSOM — can never see these vars. */
.${UiClass.shell}[data-ui-theme="dark"] { ${emitColorVars(Chrome.color.dark)} }
/* Tell the UA to paint dark scrollbars and native form-control internals across the chrome subtree;
   without this Chromium renders light-on-dark scrollbars that read as broken. Scoped to the dark shell
   so light is untouched, and the preview iframe (its own document/CSSOM) never inherits it. */
.${UiClass.shell}[data-ui-theme="dark"] { color-scheme: dark; }
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
/* The mark is a dark raster tile; a hairline border keeps its edge defined on both light and dark toolbars. */
.${UiClass.brandMark} {
  display: block;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: var(--ui-radius-sm);
  border: 1px solid var(--ui-border);
}
/* The hyphenated wordmark must never break across lines at its hyphens. */
.${UiClass.brandWordmark} { color: var(--ui-text); white-space: nowrap; }
.${UiClass.toolbarGroup} { display: flex; align-items: center; gap: ${s.sm}; }
/* The work area below the toolbar: a left controls dock (rail + inspector) beside the editor|preview
   grid. The 1px gaps over the border background draw hairline column dividers (the grid's own recipe). */
.${UiClass.workspace} {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  background: var(--ui-border);
  gap: 1px;
}
/* position:relative anchors the edge handle (the inspector|editor divider toggle). */
.${UiClass.inspectorDock} { position: relative; flex: 0 0 auto; display: flex; min-height: 0; }
/* The clip holds the rail + inspector at their full widths and animates its OWN width to 0 on collapse,
   so the panel slides shut without the contents reflowing; the handle lives outside it (in the dock) and
   is never clipped. The combined width is the single source the rail/inspector widths also reference. */
.${UiClass.dockClip} {
  flex: 0 0 auto;
  display: flex;
  min-height: 0;
  width: calc(var(--ui-rail-w) + var(--ui-inspector-w));
  overflow: hidden;
  transition: width 0.24s ease;
}
.${UiClass.inspectorRail} .${UiClass.dockClip} { width: 0; }
/* The collapse/expand handle: a pill straddling the dock's right edge, vertically centered (the
   conventional, discoverable place). It sits above the panes so it's always clickable, and tracks the
   dock edge as the clip animates. The editor's gutter is padded so this never overlaps a line number. */
.${UiClass.dockHandle} {
  position: absolute;
  top: 50%;
  right: -11px;
  transform: translateY(-50%);
  z-index: 6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 54px;
  padding: 0;
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-full);
  background: var(--ui-surface);
  color: var(--ui-text-muted);
  box-shadow: var(--ui-shadow-pop);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.${UiClass.dockHandle}:hover {
  background: var(--ui-accent);
  color: var(--ui-accent-text);
  border-color: var(--ui-accent);
}
/* Left rail: a vertical section list grouped under category bands. No horizontal scroll — a vertical
   list scales to all 17 sections; only this list scrolls (the band headers ride along). */
.${UiClass.rail} {
  flex: 0 0 auto;
  width: var(--ui-rail-w);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--ui-surface);
  border-right: 1px solid var(--ui-border);
}
.${UiClass.railHead} {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${s.sm};
  padding: ${s.md};
  border-bottom: 1px solid var(--ui-border);
}
.${UiClass.railHead} .${UiClass.search} { width: 100%; }
.${UiClass.scopeChips} { display: flex; gap: ${s.xs}; }
.${UiClass.scopeChip} {
  flex: 1 1 auto;
  min-height: 28px;
  padding: ${s.xs} ${s.sm};
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-radius-sm);
  background: var(--ui-surface);
  color: var(--ui-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.${UiClass.scopeChip}:hover { background: var(--ui-surface-hover); color: var(--ui-text); }
.${UiClass.scopeChipActive} { background: var(--ui-accent); border-color: var(--ui-accent); color: var(--ui-accent-text); }
.${UiClass.railList} {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: ${s.sm};
}
.${UiClass.railBand} { display: flex; flex-direction: column; }
.${UiClass.railBand} + .${UiClass.railBand} { margin-top: ${s.sm}; }
.${UiClass.railBandLabel} {
  margin: 0 0 2px;
  padding: 0 ${s.sm};
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-faint);
}
.${UiClass.railTab} {
  display: flex;
  align-items: center;
  gap: ${s.sm};
  width: 100%;
  padding: 7px ${s.sm};
  border: none;
  border-left: 2px solid transparent;
  border-radius: var(--ui-radius-sm);
  background: none;
  color: var(--ui-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}
.${UiClass.railTab}:hover { background: var(--ui-surface-hover); color: var(--ui-text); }
.${UiClass.railTabActive} {
  background: var(--ui-surface-hover);
  color: var(--ui-accent);
  border-left-color: var(--ui-accent);
  font-weight: 600;
}
.${UiClass.railTabText} { flex: 1 1 auto; }
.${UiClass.modifiedDot} { flex: 0 0 auto; width: 6px; height: 6px; border-radius: var(--ui-radius-full); background: var(--ui-accent); }
/* The inspector: the SINGLE scroll surface in the chrome (no tab carousel, no nested band). A section
   that fits stays short; a tall one scrolls only HERE. overscroll-behavior:contain stops scroll chaining. */
.${UiClass.inspector} {
  flex: 0 0 auto;
  width: var(--ui-inspector-w);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--ui-surface);
}
.${UiClass.inspectorHead} {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${s.md};
  padding: ${s.sm} ${s.lg};
  background: var(--ui-surface);
  border-bottom: 1px solid var(--ui-border);
}
.${UiClass.inspectorTitle} { margin: 0; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
.${UiClass.inspectorBody} { display: flex; flex-direction: column; gap: ${s.lg}; padding: ${s.md} ${s.lg}; }
/* A facet/prefix sub-group: a localized header (never a raw id-prefix) over a stack of roomy rows. */
.${UiClass.facetGroup} { display: flex; flex-direction: column; gap: ${s.sm}; }
.${UiClass.facetLabel} {
  margin: 0;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-faint);
}
.${UiClass.facetBody} { display: flex; flex-direction: column; gap: ${s.sm}; }
/* A heading level rendered as a disclosure so the 54-control section stays short. */
.${UiClass.levelGroup} { border-top: 1px solid var(--ui-border); padding-top: ${s.sm}; }
.${UiClass.levelGroup}:first-child { border-top: none; padding-top: 0; }
.${UiClass.levelToggle} {
  display: flex;
  align-items: center;
  gap: ${s.xs};
  width: 100%;
  padding: ${s.xs} 0;
  border: none;
  background: none;
  color: var(--ui-text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.${UiClass.levelChevron} { transition: transform 0.15s ease; transform: rotate(-90deg); color: var(--ui-text-faint); }
.${UiClass.levelChevron}.is-open { transform: rotate(0deg); }
.${UiClass.levelGroup} .${UiClass.facetBody} { padding: ${s.xs} 0; }
/* Syntax-color palette: a grid of named swatch cells instead of a tall stack of color rows. */
.${UiClass.swatchGrid} { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: ${s.md}; }
.${UiClass.swatchCell} { display: flex; flex-direction: column; gap: ${s.xs}; }
.${UiClass.swatchCellLabel} { font-size: 12px; color: var(--ui-text-muted); font-weight: 500; }
.${UiClass.grid} {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-width: 0;
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
/* Left padding clears the dock's edge handle (which straddles the editor's left edge) so it never sits
   over a line number; the gutter is sticky-left inside the scroller, so it shifts with this padding. */
.${UiClass.editorHost} .cm-scroller { padding: ${s.sm} 0 ${s.sm} 18px; }
.${UiClass.panePreview} .${UiClass.paneBody} { padding: 0; }
.${UiClass.previewFrame} {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--ui-surface-sunken);
}
.${UiClass.row} { display: grid; grid-template-columns: 1fr; gap: ${s.xs}; }
.${UiClass.rowLabel} { font-size: 12px; color: var(--ui-text-muted); font-weight: 500; }
.${UiClass.rowField} { display: flex; align-items: center; gap: ${s.sm}; }
.${UiClass.colorField} { display: flex; align-items: center; gap: ${s.sm}; flex: 1; min-width: 0; }
/* Compact Word-ribbon row: label INLINE with the field at a tight ~26px height, so a section reads in a
   couple of group rows instead of a tall scrolling strip. min-width:0 on the field lets the slider shrink
   into its cell and never overflow. Widget sizing below is scoped to this modifier so the search-mode and
   non-compact rows stay roomy. */
.${UiClass.rowCompact} {
  grid-template-columns: minmax(64px, 96px) 1fr;
  align-items: center;
  column-gap: ${s.sm};
  row-gap: 0;
  min-height: 26px;
}
.${UiClass.rowCompact} .${UiClass.rowLabel} {
  font-size: 11.5px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
.${UiClass.rowCompact} .${UiClass.rowField} { gap: 6px; min-width: 0; }
.${UiClass.rowCompact} .${UiClass.colorField} { gap: 6px; }
.${UiClass.rowCompact} .${UiClass.slider} { height: 16px; }
.${UiClass.rowCompact} .${UiClass.number} { width: 52px; padding: 2px 6px; font-size: 11.5px; }
.${UiClass.rowCompact} .${UiClass.unit} { min-width: 0; font-size: 10.5px; }
.${UiClass.rowCompact} .${UiClass.swatch} { width: 20px; height: 20px; }
.${UiClass.rowCompact} .${UiClass.hexInput} { width: 74px; padding: 2px 6px; font-size: 11px; }
.${UiClass.rowCompact} .${UiClass.segment} { min-height: 24px; font-size: 11px; padding: ${s.xs} ${s.sm}; }
.${UiClass.rowCompact} .${UiClass.btn} { min-height: 24px; }
.${UiClass.rowCompact} .${UiClass.toggle} { width: 32px; height: 18px; }
.${UiClass.rowCompact} .${UiClass.select} { min-height: 24px; font-size: 12px; }
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
/* The bare .ui-select box is block-ish for a native <select>; as the custom trigger <button> it needs
   flex layout to seat the selected label and the chevron at opposite ends. */
.${UiClass.selectTrigger} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${s.sm};
  width: 100%;
  text-align: left;
  cursor: pointer;
}
.${UiClass.selectChevron} { color: var(--ui-text-faint); transition: transform 0.15s ease; flex: 0 0 auto; }
.${UiClass.selectChevron}.is-open { transform: rotate(180deg); }
/* Popover surface; same elevation recipe as .ui-swatch-pop. position:fixed (the component sets top/left/
   width from the trigger rect) so the inspector's overflow:auto can't clip it; the content-driven height
   is capped so a long list scrolls inside the menu. */
.${UiClass.selectMenu} {
  position: fixed;
  z-index: 20;
  max-height: ${MENU_MAX_HEIGHT_PX}px;
  overflow-y: auto;
  padding: ${s.xs};
  margin-block: ${s.xs};
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-md);
  box-shadow: var(--ui-shadow-pop);
  list-style: none;
}
.${UiClass.selectOption} {
  display: flex;
  align-items: center;
  padding: ${s.xs} ${s.sm};
  border-radius: var(--ui-radius-sm);
  cursor: pointer;
  color: var(--ui-text);
  white-space: nowrap;
}
/* "Highlighted" (keyboard/hover position) reads as a surface tint, distinct from "selected" below. */
.${UiClass.selectOptionActive} { background: var(--ui-surface-hover); }
.${UiClass.selectOptionSelected} { font-weight: 600; }
.${UiClass.selectOptionSelected}::after { content: "✓"; margin-left: auto; padding-left: ${s.sm}; }
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
/* position:fixed (the component sets top/left from the swatch rect) so the inspector's overflow:auto
   can't clip the picker the way an absolutely-positioned child would. */
.${UiClass.swatchPop} {
  position: fixed;
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
/* Lightweight APG tooltip: the wrapper anchors the absolutely-placed tip above its trigger. The tip is
   always in the DOM (so aria-describedby resolves) and shown via [hidden] toggling. pointer-events:none
   keeps it non-interactive (no focus trap); z-index sits above band content but below the toast viewport. */
.${UiClass.tooltipWrap} { position: relative; }
.${UiClass.tooltip} {
  position: absolute;
  z-index: 30;
  bottom: calc(100% + 6px);
  left: 0;
  max-width: 260px;
  padding: 6px 8px;
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ui-text);
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-sm);
  box-shadow: var(--ui-shadow-pop);
  pointer-events: none;
  white-space: normal;
  opacity: 0;
  transition: opacity 0.12s ease;
}
.${UiClass.tooltip}:not([hidden]) { opacity: 1; }
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
  /* Forced colors can drop the hairline; keep the raster mark's edge with a system color. */
  .${UiClass.brandMark} { border-color: CanvasText; }
  /* High Contrast flattens the accent fill, so cue the selected segment with the system Highlight pair. */
  .${UiClass.segmentActive} { background: Highlight; color: HighlightText; }
  /* Same reasoning for the active rail tab and the scope chips, whose accent fill/border flatten. */
  .${UiClass.railTabActive} { border-left-color: Highlight; color: Highlight; }
  .${UiClass.scopeChipActive} { background: Highlight; color: HighlightText; }
  /* The modified dot's accent fill flattens; keep it visible with a system color. */
  .${UiClass.modifiedDot} { background: Highlight; }
  /* The swatch cell relies on the swatch's own fill; keep its edge with a system color in High Contrast. */
  .${UiClass.swatch} { border-color: CanvasText; }
  /* Token backgrounds flatten in High Contrast, so redraw the menu edge and cue the option states with
     system colors (same approach as .ui-segment-active above). */
  .${UiClass.selectMenu} { border: 1px solid CanvasText; }
  .${UiClass.selectOptionActive} { background: Highlight; color: HighlightText; }
  .${UiClass.selectOptionSelected} { forced-color-adjust: none; }
  /* Token surface/shadow flatten in High Contrast, so keep the tooltip's edge with a system color. */
  .${UiClass.tooltip} { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  .${UiClass.railList} { scroll-behavior: auto; }
  .${UiClass.selectChevron} { transition: none; }
  .${UiClass.toast} { transition: none; }
  .${UiClass.levelChevron} { transition: none; }
  .${UiClass.dockClip} { transition: none; }
  .${UiClass.dockHandle} { transition: none; }
  .${UiClass.tooltip} { transition: none; }
}
/* On a narrow viewport the controls dock drops below the toolbar as a capped-height band (rail still
   left of the inspector, the inspector still the only control scroll), and the editor|preview split
   stacks vertically beneath it. The toolbar wraps with the brand on its own line. */
@media (max-width: 860px) {
  .${UiClass.workspace} { flex-direction: column; }
  .${UiClass.inspectorDock} { flex: 0 0 auto; width: 100%; max-height: 46vh; }
  .${UiClass.dockClip} { width: 100%; }
  .${UiClass.inspectorRail} .${UiClass.dockClip} { width: 0; }
  .${UiClass.rail} { width: 168px; }
  .${UiClass.inspector} { flex: 1 1 auto; width: auto; }
}
@media (max-width: 720px) {
  .${UiClass.grid} {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(200px, 1fr) minmax(200px, 1.2fr);
  }
  .${UiClass.paneEditor} { grid-row: 1; }
  .${UiClass.panePreview} { grid-row: 2; }
  .${UiClass.toolbar} { flex-wrap: wrap; gap: ${s.sm} ${s.md}; }
  .${UiClass.brand} { margin-right: 0; flex: 1 0 100%; }
}
`;
