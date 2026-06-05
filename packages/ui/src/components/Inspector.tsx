"use client";

import {
  type ControlDef,
  categoryLabel,
  controlLabel,
  groupLabel,
  type Locale,
  message,
  type SectionId,
  schema,
  sectionLabel,
} from "@md-pdf-studio/core";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_ORDER, SECTION_CATEGORY, SECTION_ORDER } from "../constants";
import { useLocaleStore } from "../store/localeStore";
import { useRibbonStore } from "../store/ribbonStore";
import { useThemeStore } from "../store/themeStore";
import { useUiStore } from "../store/uiStore";
import { UiClass } from "../theme/chrome";
import { ControlRow } from "./controls/ControlRow";
import { type DisplayGroup, type Entry, facetOf, sectionLayout } from "./inspectorGrouping";

// Controls grouped by section once, in schema (insertion) order within each section. Derived entirely
// from the schema — adding a control needs no inspector change.
const ENTRIES_BY_SECTION = new Map<SectionId, Entry[]>(
  SECTION_ORDER.map((sectionId) => [
    sectionId,
    Object.entries(schema.controls).filter(
      ([, control]) => control.section === sectionId,
    ) as Entry[],
  ]),
);

// The rail's sections, flattened in category-band order. Used for the vertical roving-tabindex nav so
// Arrow keys traverse section-to-section across bands (the band headers are not stops).
const RAIL_BANDS = CATEGORY_ORDER.map((category) => ({
  category,
  sections: SECTION_ORDER.filter((sectionId) => SECTION_CATEGORY[sectionId] === category),
}));
const RAIL_ORDER: readonly SectionId[] = RAIL_BANDS.flatMap((band) => band.sections);

const PANEL_ID = "ui-inspector-panel";
// Headings is the only section that renders as collapsible level blocks; its first level (h1) opens by
// default so the panel is never empty, while the others start collapsed to keep the 54 controls short.
const DEFAULT_OPEN_LEVEL = "h1";

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

function matchesQuery(
  id: string,
  control: ControlDef,
  sectionId: SectionId,
  locale: Locale,
  query: string,
): boolean {
  if (query === "") return true;
  const haystack = [
    controlLabel(id, control.label, locale),
    control.label,
    ...(control.synonyms ?? []),
    sectionLabel(sectionId, locale),
    groupLabel(facetOf(id, control), locale),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function Inspector() {
  const locale = useLocaleStore((state) => state.locale);
  const values = useThemeStore((state) => state.theme.values);
  const setValue = useThemeStore((state) => state.setValue);
  const activeSection = useUiStore((state) => state.activeSection);
  const setActiveSection = useUiStore((state) => state.setActiveSection);
  const selectionTick = useUiStore((state) => state.selectionTick);
  const collapsed = useRibbonStore((state) => state.collapsed);
  const setCollapsed = useRibbonStore((state) => state.setCollapsed);

  const [query, setQuery] = useState("");
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [openLevels, setOpenLevels] = useState<Set<string>>(() => new Set([DEFAULT_OPEN_LEVEL]));
  const [announce, setAnnounce] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== "";

  const tabRefs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  // A mouse click already focuses the tab natively; only arrow-key navigation needs the effect below to
  // move focus and scroll the active tab into view, so this guards against stealing focus on click.
  const keyboardNav = useRef(false);
  // Latest render values, read by the selection effect so it can announce on the tick alone without
  // re-firing every time the locale or active section changes for another reason.
  const latest = useRef({ locale, activeSection });
  latest.current = { locale, activeSection };

  const activeEntries = ENTRIES_BY_SECTION.get(activeSection) ?? [];
  const layout = useMemo(() => sectionLayout(activeEntries), [activeEntries]);

  const isModified = (id: string, control: ControlDef): boolean =>
    values[id] !== undefined && values[id] !== control.default;

  // Sections with at least one non-default value get a "modified" dot in the rail, and are the only ones
  // the rail shows in Modified mode. Cheap to recompute over the whole schema; no new persisted state.
  const modifiedSections = useMemo(() => {
    const set = new Set<string>();
    for (const [id, control] of Object.entries(schema.controls)) {
      if (values[id] !== undefined && values[id] !== control.default) set.add(control.section);
    }
    return set;
  }, [values]);

  // In Modified mode the rail drops sections (and whole bands) with no changes; bands keep their order.
  const visibleBands = modifiedOnly
    ? RAIL_BANDS.map((band) => ({
        category: band.category,
        sections: band.sections.filter((id) => modifiedSections.has(id)),
      })).filter((band) => band.sections.length > 0)
    : RAIL_BANDS;

  // Switching to Modified jumps off an unmodified section so the panel isn't left showing "nothing".
  const enterModified = (): void => {
    setModifiedOnly(true);
    if (!modifiedSections.has(activeSection)) {
      const first = RAIL_ORDER.find((id) => modifiedSections.has(id));
      if (first !== undefined) setActiveSection(first);
    }
  };

  // The modified check is inlined (not via isModified) so `values` reads as a direct dependency.
  const searchSections = useMemo(
    () =>
      SECTION_ORDER.map((sectionId) => ({
        sectionId,
        visible: (ENTRIES_BY_SECTION.get(sectionId) ?? []).filter(
          ([id, control]) =>
            matchesQuery(id, control, sectionId, locale, normalizedQuery) &&
            (!modifiedOnly || (values[id] !== undefined && values[id] !== control.default)),
        ),
      })).filter((group) => group.visible.length > 0),
    [locale, normalizedQuery, modifiedOnly, values],
  );

  // After an arrow-key tab switch, follow focus to the newly active tab and keep it on-screen in the
  // scrollable rail; a mouse click skips this (keyboardNav guard) so it never yanks focus.
  useEffect(() => {
    if (!keyboardNav.current) return;
    keyboardNav.current = false;
    const node = tabRefs.current[activeSection];
    node?.focus();
    node?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [activeSection]);

  // A preview-element selection announces the now-active section to assistive tech. Tick-gated so it
  // reacts to every click (including a repeat on the same element) without firing on unrelated re-renders.
  useEffect(() => {
    if (selectionTick === 0) return;
    const { locale: loc, activeSection: section } = latest.current;
    setAnnounce(`${message("selected", loc)}: ${sectionLabel(section, loc)}`);
  }, [selectionTick]);

  // Cmd/Ctrl+K focuses the search field from anywhere in the editor; the inspector must be open for it
  // to land, so it re-expands a collapsed inspector first.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Re-expand first; the field is inert while collapsed, so focus waits a frame for the re-render.
        setCollapsed(false);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCollapsed]);

  const moveTab = (next: SectionId): void => {
    keyboardNav.current = true;
    setActiveSection(next);
  };

  const onTabClick = (id: SectionId): void => {
    setActiveSection(id);
    if (collapsed) setCollapsed(false);
  };

  // Vertical roving: Up/Down move between rail tabs across category bands, Home/End jump to the ends.
  const onRailKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = RAIL_ORDER.indexOf(activeSection);
    const last = RAIL_ORDER.length - 1;
    let next: SectionId | undefined;
    if (event.key === "ArrowDown") next = RAIL_ORDER[index === last ? 0 : index + 1];
    else if (event.key === "ArrowUp") next = RAIL_ORDER[index === 0 ? last : index - 1];
    else if (event.key === "Home") next = RAIL_ORDER[0];
    else if (event.key === "End") next = RAIL_ORDER[last];
    if (next === undefined) return;
    event.preventDefault();
    moveTab(next);
  };

  const toggleLevel = (key: string): void =>
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const resetSection = (): void => {
    for (const [id, control] of activeEntries) {
      if (isModified(id, control)) setValue(id, control.default);
    }
  };

  const sectionModified = activeEntries.some(([id, control]) => isModified(id, control));

  // Render one control as a roomy (non-compact) row, honoring the Modified filter.
  const renderRows = (entries: Entry[]) =>
    entries
      .filter(([id, control]) => !modifiedOnly || isModified(id, control))
      .map(([id, control]) => (
        <ControlRow
          key={id}
          id={id}
          control={control}
          locale={locale}
          value={values[id] ?? control.default}
          onChange={setValue}
        />
      ));

  // A facet/prefix group with a localized header (never the raw id-prefix); skipped when the Modified
  // filter empties it.
  const renderGroup = (group: DisplayGroup) => {
    const rows = renderRows(group.entries);
    if (rows.length === 0) return null;
    return (
      <div key={group.key} className={UiClass.facetGroup}>
        <h3 className={UiClass.facetLabel}>{groupLabel(group.key, locale)}</h3>
        <div className={UiClass.facetBody}>{rows}</div>
      </div>
    );
  };

  // A heading level as a disclosure (button[aria-expanded] + region) so the 54-control section stays
  // short and screen readers get a native expand/collapse.
  const renderLevel = (group: DisplayGroup) => {
    const rows = renderRows(group.entries);
    if (rows.length === 0) return null;
    const open = openLevels.has(group.key);
    const regionId = `ui-level-${group.key}`;
    return (
      <div key={group.key} className={UiClass.levelGroup}>
        <button
          type="button"
          className={UiClass.levelToggle}
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => toggleLevel(group.key)}
        >
          <svg
            className={open ? `${UiClass.levelChevron} is-open` : UiClass.levelChevron}
            viewBox="0 0 12 12"
            width="12"
            height="12"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {groupLabel(group.key, locale)}
        </button>
        {open ? (
          <div id={regionId} className={UiClass.facetBody}>
            {rows}
          </div>
        ) : null}
      </div>
    );
  };

  const renderActiveSection = () => {
    if (layout.kind === "swatchGrid") {
      const cells = layout.groups[0]?.entries.filter(
        ([id, control]) => !modifiedOnly || isModified(id, control),
      );
      if (cells === undefined || cells.length === 0)
        return <p className={UiClass.empty}>{message("noResults", locale)}</p>;
      return (
        <div className={UiClass.swatchGrid}>
          {cells.map(([id, control]) => (
            <div key={id} className={UiClass.swatchCell}>
              <label className={UiClass.swatchCellLabel} htmlFor={`ctl-${id}`}>
                {controlLabel(id, control.label, locale)}
              </label>
              <ControlRow
                id={id}
                control={control}
                locale={locale}
                value={values[id] ?? control.default}
                onChange={setValue}
                hideLabel
              />
            </div>
          ))}
        </div>
      );
    }

    if (layout.kind === "flat") {
      const rows = renderRows(layout.groups[0]?.entries ?? []);
      if (rows.length === 0) return <p className={UiClass.empty}>{message("noResults", locale)}</p>;
      return <div className={UiClass.facetBody}>{rows}</div>;
    }

    const render = layout.kind === "prefix" && layout.collapsible ? renderLevel : renderGroup;
    const groups = layout.groups.map(render).filter(Boolean);
    if (groups.length === 0) return <p className={UiClass.empty}>{message("noResults", locale)}</p>;
    return <>{groups}</>;
  };

  // The collapse/expand affordance: a pill straddling the dock's right edge (the inspector|editor
  // divider), vertically centered — the conventional, discoverable place for a panel toggle.
  const dockHandle = (
    <button
      type="button"
      className={UiClass.dockHandle}
      aria-expanded={!collapsed}
      aria-controls={PANEL_ID}
      aria-label={message(collapsed ? "showControls" : "hideControls", locale)}
      onClick={() => setCollapsed(!collapsed)}
    >
      <svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true" focusable="false">
        <path
          d={collapsed ? "M4.5 2.5 8 6l-3.5 3.5" : "M7.5 2.5 4 6l3.5 3.5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  );

  // The rail + inspector stay mounted when collapsed (just clipped to width 0) so open/close slides
  // smoothly; `inert` keeps the hidden controls out of the tab order and a11y tree during that state.
  return (
    <div
      className={
        collapsed ? `${UiClass.inspectorDock} ${UiClass.inspectorRail}` : UiClass.inspectorDock
      }
    >
      <div className={UiClass.dockClip} inert={collapsed}>
        <div className={UiClass.rail}>
          <div className={UiClass.railHead}>
            <input
              ref={searchRef}
              type="search"
              className={UiClass.search}
              placeholder={message("searchControls", locale)}
              aria-label={message("searchControls", locale)}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
            />
            <div className={UiClass.scopeChips}>
              <button
                type="button"
                className={
                  modifiedOnly
                    ? UiClass.scopeChip
                    : `${UiClass.scopeChip} ${UiClass.scopeChipActive}`
                }
                aria-pressed={!modifiedOnly}
                onClick={() => setModifiedOnly(false)}
              >
                {message("all", locale)}
              </button>
              <button
                type="button"
                className={
                  modifiedOnly
                    ? `${UiClass.scopeChip} ${UiClass.scopeChipActive}`
                    : UiClass.scopeChip
                }
                aria-pressed={modifiedOnly}
                onClick={enterModified}
              >
                {message("modified", locale)}
              </button>
            </div>
          </div>

          {/* APG vertical tabs: role=tablist over the rail's <button role=tab>s — no native element maps to it. */}
          <div
            role="tablist"
            aria-label={message("controls", locale)}
            aria-orientation="vertical"
            className={UiClass.railList}
            onKeyDown={onRailKeyDown}
          >
            {visibleBands.length === 0 ? (
              <p className={UiClass.empty}>{message("noResults", locale)}</p>
            ) : null}
            {visibleBands.map((band) => (
              <div key={band.category} className={UiClass.railBand}>
                <p className={UiClass.railBandLabel}>{categoryLabel(band.category, locale)}</p>
                {band.sections.map((id) => {
                  const active = id === activeSection;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      id={`railtab-${id}`}
                      ref={(node) => {
                        tabRefs.current[id] = node;
                      }}
                      aria-selected={active}
                      aria-controls={PANEL_ID}
                      tabIndex={active ? 0 : -1}
                      className={
                        active ? `${UiClass.railTab} ${UiClass.railTabActive}` : UiClass.railTab
                      }
                      onClick={() => onTabClick(id)}
                    >
                      <span className={UiClass.railTabText}>{sectionLabel(id, locale)}</span>
                      {modifiedSections.has(id) ? (
                        <span className={UiClass.modifiedDot} aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* APG tabpanel: the single scroll surface, made keyboard-reachable by tabIndex (the tab-panel convention). */}
        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={searching ? undefined : `railtab-${activeSection}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable scroll panel, the APG tab-panel convention.
          tabIndex={0}
          className={UiClass.inspector}
        >
          <p className={UiClass.srOnly} aria-live="polite">
            {announce}
          </p>
          {searching ? (
            searchSections.length === 0 ? (
              <p className={UiClass.empty}>{message("noResults", locale)}</p>
            ) : (
              <div className={UiClass.inspectorBody}>
                {searchSections.map(({ sectionId, visible }) => (
                  <div key={sectionId} className={UiClass.facetGroup}>
                    <h3 className={UiClass.facetLabel}>{sectionLabel(sectionId, locale)}</h3>
                    <div className={UiClass.facetBody}>
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
                ))}
              </div>
            )
          ) : (
            <>
              <div className={UiClass.inspectorHead}>
                <h2 className={UiClass.inspectorTitle}>{sectionLabel(activeSection, locale)}</h2>
                <button
                  type="button"
                  className={`${UiClass.btn} ${UiClass.btnGhost}`}
                  disabled={!sectionModified}
                  onClick={resetSection}
                >
                  {message("resetSection", locale)}
                </button>
              </div>
              <div className={UiClass.inspectorBody}>{renderActiveSection()}</div>
            </>
          )}
        </div>
      </div>
      {dockHandle}
    </div>
  );
}
