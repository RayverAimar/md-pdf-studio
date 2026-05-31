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
import { useEffect, useMemo, useRef, useState } from "react";
import { SECTION_ORDER } from "../constants";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { useUiStore } from "../store/uiStore";
import { UiClass } from "../theme/chrome";
import { ControlRow } from "./controls/ControlRow";

type Entry = [string, ControlDef];

// Controls grouped by section once, in schema (insertion) order within each section, in the panel's
// declared section order. Derived entirely from the schema — adding a control needs no panel change.
const GROUPED: ReadonlyArray<{ sectionId: SectionId; entries: Entry[] }> = SECTION_ORDER.map(
  (sectionId) => ({
    sectionId,
    entries: Object.entries(schema.controls).filter(([, control]) => control.section === sectionId),
  }),
);

const PULSE_MS = 1100;

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

export function ControlsPanel() {
  const locale = useLocaleStore((state) => state.locale);
  const values = useThemeStore((state) => state.theme.values);
  const setValue = useThemeStore((state) => state.setValue);
  const focusedSection = useUiStore((state) => state.focusedSection);
  const focusToken = useUiStore((state) => state.focusToken);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(GROUPED.slice(0, 2).map((g) => g.sectionId)),
  );
  const [pulsing, setPulsing] = useState<SectionId | null>(null);
  const sectionRefs = useRef<Map<SectionId, HTMLElement>>(new Map());

  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== "";

  // A click in the preview reveals and briefly highlights the matching section. focusToken is a
  // dependency on purpose: re-clicking the same element must re-trigger the reveal even though
  // focusedSection is unchanged.
  // biome-ignore lint/correctness/useExhaustiveDependencies: focusToken is an intentional retrigger.
  useEffect(() => {
    if (focusedSection === null) return;
    setExpanded((prev) => new Set(prev).add(focusedSection));
    setPulsing(focusedSection);
    sectionRefs.current.get(focusedSection)?.scrollIntoView({ block: "start", behavior: "smooth" });
    const timer = setTimeout(() => setPulsing(null), PULSE_MS);
    return () => clearTimeout(timer);
  }, [focusedSection, focusToken]);

  const sections = useMemo(
    () =>
      GROUPED.map((group) => ({
        ...group,
        visible: group.entries.filter(([id, control]) =>
          matchesQuery(id, control, locale, normalizedQuery),
        ),
      })).filter((group) => group.visible.length > 0),
    [locale, normalizedQuery],
  );

  const toggle = (sectionId: SectionId): void =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });

  return (
    <section
      className={`${UiClass.pane} ${UiClass.paneControls}`}
      aria-label={message("controls", locale)}
    >
      <div className={UiClass.paneHead}>{message("controls", locale)}</div>
      <div className={UiClass.paneBody}>
        <div style={{ padding: "12px" }}>
          <input
            type="search"
            className={UiClass.search}
            placeholder={message("search", locale)}
            aria-label={message("search", locale)}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {sections.length === 0 ? (
          <p className={UiClass.empty}>{message("noResults", locale)}</p>
        ) : (
          sections.map(({ sectionId, visible }) => {
            const isOpen = searching || expanded.has(sectionId);
            const bodyId = `section-body-${sectionId}`;
            return (
              <div
                key={sectionId}
                className={UiClass.section}
                ref={(node) => {
                  if (node !== null) sectionRefs.current.set(sectionId, node);
                  else sectionRefs.current.delete(sectionId);
                }}
              >
                <button
                  type="button"
                  className={UiClass.sectionHead}
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  onClick={() => toggle(sectionId)}
                >
                  <span className={UiClass.sectionChevron} aria-hidden="true">
                    {isOpen ? "▾" : "▸"}
                  </span>
                  {sectionLabel(sectionId, locale)}
                </button>
                {isOpen ? (
                  <div
                    id={bodyId}
                    className={`${UiClass.sectionBody}${pulsing === sectionId ? ` ${UiClass.focusPulse}` : ""}`}
                  >
                    {visible.map(([id, control]) => (
                      <ControlRow
                        key={id}
                        id={id}
                        control={control}
                        locale={locale}
                        value={values[id] ?? control.default}
                        onChange={setValue}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
