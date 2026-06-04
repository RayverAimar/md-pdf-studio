"use client";

import {
  type ControlDef,
  controlLabel,
  type Locale,
  message,
  type SectionId,
  schema,
  sectionLabel,
} from "@md-pdf-studio/core";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { SECTION_ORDER } from "../constants";
import { useLocaleStore } from "../store/localeStore";
import { useRibbonStore } from "../store/ribbonStore";
import { useThemeStore } from "../store/themeStore";
import { useUiStore } from "../store/uiStore";
import { UiClass } from "../theme/chrome";
import { ControlRow } from "./controls/ControlRow";

type Entry = [string, ControlDef];

// Controls grouped by section once, in schema (insertion) order within each section, in the ribbon's
// declared tab order. Derived entirely from the schema — adding a control needs no ribbon change.
const GROUPED: ReadonlyArray<{ sectionId: SectionId; entries: Entry[] }> = SECTION_ORDER.map(
  (sectionId) => ({
    sectionId,
    entries: Object.entries(schema.controls).filter(([, control]) => control.section === sectionId),
  }),
);

const RIBBON_PANEL_ID = "ui-ribbon-panel";

// A display-only grouping derived from the control-id prefix (the segment before the first dot, e.g.
// `h1`…`h6`, `table`, `page`). This is purely presentational: it carves a section's compact rows into
// Word-style "group" columns and never touches the schema or any value path, so a new control needs no
// ribbon edit. Sections whose ids share one prefix collapse to a single unlabelled group.
export interface DisplayGroup {
  key: string;
  entries: Entry[];
}

// Exported for the DOM-free vitest suite (mirrors how Dropdown exports its pure nav math).
export function groupByPrefix(entries: Entry[]): DisplayGroup[] {
  const order: string[] = [];
  const byKey = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = entry[0].split(".")[0] ?? entry[0];
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

function matchesQuery(id: string, control: ControlDef, locale: Locale, query: string): boolean {
  if (query === "") return true;
  const haystack = [
    controlLabel(id, control.label, locale),
    control.label,
    ...(control.synonyms ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export function Ribbon() {
  const locale = useLocaleStore((state) => state.locale);
  const values = useThemeStore((state) => state.theme.values);
  const setValue = useThemeStore((state) => state.setValue);
  const activeSection = useUiStore((state) => state.activeSection);
  const setActiveSection = useUiStore((state) => state.setActiveSection);
  const collapsed = useRibbonStore((state) => state.collapsed);
  const setCollapsed = useRibbonStore((state) => state.setCollapsed);

  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== "";

  const tabRefs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});
  // A mouse click already focuses the tab natively; only arrow-key navigation needs the effect below
  // to move focus and scroll the active tab into view, so this guards against stealing focus on click.
  const keyboardNav = useRef(false);

  const activeEntries = GROUPED.find((group) => group.sectionId === activeSection)?.entries ?? [];
  const activeGroups = useMemo(() => groupByPrefix(activeEntries), [activeEntries]);

  const searchSections = useMemo(
    () =>
      GROUPED.map((group) => ({
        sectionId: group.sectionId,
        visible: group.entries.filter(([id, control]) =>
          matchesQuery(id, control, locale, normalizedQuery),
        ),
      })).filter((group) => group.visible.length > 0),
    [locale, normalizedQuery],
  );

  // After an arrow-key tab switch, follow focus to the newly active tab and keep it on-screen in the
  // horizontally scrollable strip; a mouse click skips this (keyboardNav guard) so it never yanks focus.
  useEffect(() => {
    if (!keyboardNav.current) return;
    keyboardNav.current = false;
    const node = tabRefs.current[activeSection];
    node?.focus();
    node?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [activeSection]);

  const moveTab = (next: SectionId): void => {
    keyboardNav.current = true;
    setActiveSection(next);
  };

  // Explicitly activating a tab (click) re-expands a collapsed band, matching Word; arrow-key roving
  // (moveTab) only moves the tabindex among the still-visible tabs and never force-expands, so the two
  // gestures keep one clear mental model.
  const onTabClick = (id: SectionId): void => {
    setActiveSection(id);
    if (collapsed) setCollapsed(false);
  };

  const onTablistKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = SECTION_ORDER.indexOf(activeSection);
    const last = SECTION_ORDER.length - 1;
    let next: SectionId | undefined;
    if (event.key === "ArrowRight") next = SECTION_ORDER[index === last ? 0 : index + 1];
    else if (event.key === "ArrowLeft") next = SECTION_ORDER[index === 0 ? last : index - 1];
    else if (event.key === "Home") next = SECTION_ORDER[0];
    else if (event.key === "End") next = SECTION_ORDER[last];
    if (next === undefined) return;
    event.preventDefault();
    moveTab(next);
  };

  // The search results panel is no longer "a tab's panel", so it is labelled by text rather than by the
  // active tab; both strings are composed from existing chrome keys to keep core (and its i18n) untouched.
  const searchLabel = `${message("search", locale)} · ${message("controls", locale)}`;

  return (
    <div className={UiClass.ribbon}>
      <div className={UiClass.ribbonTabs}>
        <div
          role="tablist"
          aria-label={message("controls", locale)}
          aria-orientation="horizontal"
          className={UiClass.tablist}
          onKeyDown={onTablistKeyDown}
        >
          {SECTION_ORDER.map((id) => {
            const active = id === activeSection;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`ribtab-${id}`}
                ref={(node) => {
                  tabRefs.current[id] = node;
                }}
                aria-selected={active}
                aria-controls={RIBBON_PANEL_ID}
                tabIndex={active ? 0 : -1}
                className={active ? `${UiClass.tab} ${UiClass.tabActive}` : UiClass.tab}
                onClick={() => onTabClick(id)}
              >
                {sectionLabel(id, locale)}
              </button>
            );
          })}
        </div>
        <div className={UiClass.ribbonSearch}>
          <input
            type="search"
            className={UiClass.search}
            placeholder={message("search", locale)}
            aria-label={message("search", locale)}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
          />
        </div>
        <button
          type="button"
          className={UiClass.ribbonToggle}
          aria-expanded={!collapsed}
          aria-controls={RIBBON_PANEL_ID}
          aria-label={message(collapsed ? "expandRibbon" : "collapseRibbon", locale)}
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg
            className={collapsed ? `${UiClass.ribbonChevron} is-collapsed` : UiClass.ribbonChevron}
            viewBox="0 0 12 12"
            width="12"
            height="12"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* The band is removed (not display:none) when collapsed so the ribbon shrinks to the tabs row and
          the flex:1 grid below reclaims the height — the editor/preview maximization. aria-controls may
          point at the absent node id; RIBBON_PANEL_ID stays stable, which is tolerated. */}
      {collapsed ? null : searching ? (
        // A native <section> is an ARIA region once it has an accessible name; tabIndex makes the
        // scrollable band reachable by keyboard (the APG tabs-panel convention, applied here too).
        <section
          id={RIBBON_PANEL_ID}
          aria-label={searchLabel}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable scrollable panel per the WAI-ARIA tabs pattern.
          tabIndex={0}
          className={UiClass.ribbonBand}
        >
          {searchSections.length === 0 ? (
            <p className={UiClass.empty}>{message("noResults", locale)}</p>
          ) : (
            searchSections.map(({ sectionId, visible }) => (
              <div key={sectionId} className={UiClass.ribbonGroup}>
                <p className={UiClass.ribbonGroupLabel}>{sectionLabel(sectionId, locale)}</p>
                <div className={UiClass.ribbonGroupBody}>
                  {visible.map(([id, control]) => (
                    <ControlRow
                      key={id}
                      id={id}
                      control={control}
                      locale={locale}
                      value={values[id] ?? control.default}
                      compact
                      onChange={setValue}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        // role=tabpanel is the WAI-ARIA tabs pattern (no native element maps to it); tabIndex makes the
        // scrollable band reachable by keyboard, the APG-recommended convention for a tab panel.
        <div
          id={RIBBON_PANEL_ID}
          role="tabpanel"
          aria-labelledby={`ribtab-${activeSection}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable scrollable panel per the WAI-ARIA tabs pattern.
          tabIndex={0}
          className={UiClass.ribbonBand}
        >
          {activeGroups.map((group) => (
            <div key={group.key} className={UiClass.ctlGroup}>
              {/* The prefix label only earns its row when a section actually sub-divides (e.g. h1…h6);
                  a single-group section would just echo the active tab, so its label is omitted. */}
              {activeGroups.length > 1 ? (
                <p className={UiClass.ctlGroupLabel}>{group.key}</p>
              ) : null}
              <div className={UiClass.ctlGroupBody}>
                {group.entries.map(([id, control]) => (
                  <ControlRow
                    key={id}
                    id={id}
                    control={control}
                    locale={locale}
                    value={values[id] ?? control.default}
                    compact
                    onChange={setValue}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
