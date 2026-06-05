import type { ControlDef } from "@md-pdf-studio/core";

// How the inspector chunks a section's controls. Everything here is DERIVED from the schema (the
// control id structure + the already-declared `control`/`type` fields), so adding a control stays a
// single schema entry with zero inspector wiring; only the localized facet/prefix LABELS are authored
// (in core i18n's groupLabel). Exported pure so the DOM-free vitest suite can lock the buckets.

export type Entry = [string, ControlDef];

/** The closed set of property facets a dense single-prefix section is partitioned into. */
export type Facet = "typography" | "color" | "spacing" | "border" | "behavior";

// Render order of facets within a section: read shape first (type), then color, then box model.
export const FACET_ORDER: readonly Facet[] = [
  "typography",
  "color",
  "spacing",
  "border",
  "behavior",
];

export interface DisplayGroup {
  /** A facet key, a control-id prefix, or the section id (flat) — resolved to a label via groupLabel. */
  key: string;
  entries: Entry[];
}

// A section reads cleanest as plain rows below this many controls; above it, a single-prefix section
// earns facet sub-headers and a prefix-grouped section (only headings) earns collapsible level blocks.
const GROUPING_THRESHOLD = 6;
const COLLAPSE_PREFIX_GROUPS_ABOVE = 3;

const prefixOf = (id: string): string => {
  const dot = id.indexOf(".");
  return dot === -1 ? id : id.slice(0, dot);
};

/** Group entries by the id segment before the first dot, preserving first-seen order. */
export function groupByPrefix(entries: Entry[]): DisplayGroup[] {
  const order: string[] = [];
  const byKey = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = prefixOf(entry[0]);
    const bucket = byKey.get(key);
    if (bucket === undefined) {
      byKey.set(key, [entry]);
      order.push(key);
    } else {
      bucket.push(entry);
    }
  }
  return order.map((key) => ({ key, entries: byKey.get(key) ?? [] }));
}

// Bucket one control into a facet from its declared kind + id suffix. Rule ORDER is load-bearing: a
// color control wins outright (so every color, incl. *.background and border colors, gathers under
// Color); typography is tested before border so `table.headerWeight` lands in Typography, not Border.
export function facetOf(id: string, control: ControlDef): Facet {
  if (control.control === "color") return "color";
  const dot = id.indexOf(".");
  const suffix = (dot === -1 ? id : id.slice(dot + 1)).toLowerCase();
  if (/font|line|align|decoration|weight|size|style/.test(suffix)) return "typography";
  if (/border|thickness/.test(suffix)) return "border";
  if (/margin|padding|indent|spacing|gap/.test(suffix)) return "spacing";
  return "behavior";
}

/** Partition entries into facet groups in FACET_ORDER, dropping facets with no members. */
export function groupByFacet(entries: Entry[]): DisplayGroup[] {
  const byFacet = new Map<Facet, Entry[]>();
  for (const entry of entries) {
    const facet = facetOf(entry[0], entry[1]);
    const bucket = byFacet.get(facet);
    if (bucket === undefined) byFacet.set(facet, [entry]);
    else bucket.push(entry);
  }
  return FACET_ORDER.filter((facet) => byFacet.has(facet)).map((facet) => ({
    key: facet,
    entries: byFacet.get(facet) ?? [],
  }));
}

export type SectionLayoutKind = "flat" | "prefix" | "facet" | "swatchGrid";

export interface SectionLayout {
  kind: SectionLayoutKind;
  /** prefix layouts with many groups (only headings, h1…h6) render as collapsible level blocks. */
  collapsible: boolean;
  groups: DisplayGroup[];
}

// Decide a section's layout purely from its entries — no section-id special-casing:
//  - all-color & dense  → a swatch grid (captures the syntax-color palette without naming it)
//  - multi-prefix       → one group per prefix (collapsible when there are enough to be the headings wall)
//  - single-prefix dense→ property facets
//  - otherwise          → a flat list of rows
export function sectionLayout(entries: Entry[]): SectionLayout {
  if (entries.length === 0) return { kind: "flat", collapsible: false, groups: [] };

  const allColor = entries.every(([, control]) => control.control === "color");
  if (allColor && entries.length >= GROUPING_THRESHOLD)
    return { kind: "swatchGrid", collapsible: false, groups: [{ key: "color", entries }] };

  const prefixes = new Set(entries.map(([id]) => prefixOf(id)));
  if (prefixes.size > 1) {
    const groups = groupByPrefix(entries);
    return {
      kind: "prefix",
      collapsible: groups.length > COLLAPSE_PREFIX_GROUPS_ABOVE,
      groups,
    };
  }

  if (entries.length > GROUPING_THRESHOLD)
    return { kind: "facet", collapsible: false, groups: groupByFacet(entries) };

  return {
    kind: "flat",
    collapsible: false,
    groups: [{ key: "", entries }],
  };
}
