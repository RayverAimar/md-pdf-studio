"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MENU_MAX_HEIGHT_PX, UiClass } from "../../theme/chrome";

export interface DropdownOption {
  key: string;
  label: string;
}

interface DropdownProps {
  // Forwarded to the trigger's id so an external <label htmlFor> still targets a focusable element;
  // omitted by callers (PresetSelector) that name the trigger solely through aria-label.
  id?: string;
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (key: string) => void;
}

// Estimated menu geometry for the viewport-edge flip test: a content-driven height capped so a long
// list scrolls inside the menu rather than dictating the flip. Mirrors ColorControl's fixed-height
// constants, but computed from the option count since a select menu's height varies.
const ROW_PX = 30;
const MENU_PAD_PX = 16;
const EDGE_GAP = 8;
const TYPE_AHEAD_RESET_MS = 500;

// Pure keyboard-navigation math, factored out so the DOM-free vitest suite can lock the wrapping rules
// without a browser shim. Clamps at the ends (native <select> parity, APG-permissible) rather than wraps.
export function nextActiveIndex(current: number, key: string, count: number): number {
  if (count === 0) return -1;
  switch (key) {
    case "ArrowDown":
      return Math.min(count - 1, current + 1);
    case "ArrowUp":
      return Math.max(0, current - 1);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return current;
  }
}

// Resolve a type-ahead buffer to the option index it should highlight. A single repeated char cycles
// through the options starting with that char (press "f f f"); a longer buffer matches the prefix.
export function matchTypeAhead(
  options: readonly DropdownOption[],
  buffer: string,
  current: number,
): number {
  if (buffer === "") return -1;
  // A buffer of one repeated char cycles by that single char to the NEXT match; any other buffer matches
  // its full prefix from the top so continued typing narrows rather than skips.
  const allSame = [...buffer].every((c) => c === buffer[0]);
  const needle = (allSame ? buffer[0] : buffer)?.toLocaleLowerCase() ?? "";
  const starts = (label: string): boolean => label.toLocaleLowerCase().startsWith(needle);
  if (allSame) {
    for (let i = 1; i <= options.length; i++) {
      const idx = (current + i) % options.length;
      const option = options[idx];
      if (option !== undefined && starts(option.label)) return idx;
    }
    return -1;
  }
  return options.findIndex((option) => starts(option.label));
}

// Accessible select-only combobox (WAI-ARIA APG): one focusable <button role="combobox"> trigger plus a
// separate <ul role="listbox"> popup. Focus stays on the trigger the whole time (aria-activedescendant
// virtual focus), so dismiss is the ColorControl pointerdown/Escape recipe and focus-return is implicit.
// Chrome-only and value-agnostic: callers stringify on the way in and map key->typed value on the way out.
export function Dropdown({ id, label, options, value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [flip, setFlip] = useState({ up: false, alignRight: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const typeAhead = useRef("");
  const typeAheadTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (key: string): string => `${baseId}-opt-${key}`;

  const selectedIndex = options.findIndex((option) => option.key === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openMenu = useCallback(
    (startIndex: number): void => {
      setActiveIndex(startIndex < 0 ? Math.max(0, selectedIndex) : startIndex);
      setOpen(true);
    },
    [selectedIndex],
  );

  const close = useCallback((): void => {
    setOpen(false);
    typeAhead.current = "";
  }, []);

  const commit = useCallback(
    (index: number): void => {
      const option = options[index];
      if (option !== undefined) onChange(option.key);
      close();
    },
    [options, onChange, close],
  );

  // Flip the menu above/left of the trigger when it would otherwise spill past the viewport edge, so it
  // stays fully visible inside the narrow, scrolling controls column. Same recipe as ColorControl, but
  // the height is content-driven (a select menu's height varies) and the width can't exceed the trigger.
  const recomputeFlip = useCallback((): void => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    const height = Math.min(options.length * ROW_PX + MENU_PAD_PX, MENU_MAX_HEIGHT_PX);
    setFlip({
      up: rect.bottom + height + EDGE_GAP > window.innerHeight,
      alignRight: rect.left + rect.width + EDGE_GAP > window.innerWidth,
    });
  }, [options.length]);

  // The trigger moves as the controls column scrolls or the window resizes; keep the flip in step so the
  // open menu can't drift past the viewport edge. Scroll is captured to catch the inner column.
  useEffect(() => {
    if (!open) return;
    recomputeFlip();
    window.addEventListener("scroll", recomputeFlip, true);
    window.addEventListener("resize", recomputeFlip);
    return () => {
      window.removeEventListener("scroll", recomputeFlip, true);
      window.removeEventListener("resize", recomputeFlip);
    };
  }, [open, recomputeFlip]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // Keep the highlighted option in view as the keyboard moves it past the menu's scroll edge.
  useLayoutEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  useEffect(() => () => clearTimeout(typeAheadTimer.current), []);

  const runTypeAhead = useCallback(
    (char: string): void => {
      clearTimeout(typeAheadTimer.current);
      typeAhead.current += char;
      typeAheadTimer.current = setTimeout(() => {
        typeAhead.current = "";
      }, TYPE_AHEAD_RESET_MS);
      const match = matchTypeAhead(options, typeAhead.current, activeIndex);
      if (match >= 0) setActiveIndex(match);
    },
    [options, activeIndex],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    const { key, altKey } = event;
    const printable = key.length === 1 && !event.ctrlKey && !event.metaKey && !altKey;

    if (!open) {
      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
          event.preventDefault();
          openMenu(altKey ? -1 : selectedIndex);
          return;
        case "ArrowUp":
          event.preventDefault();
          openMenu(options.length - 1);
          return;
        default:
          if (printable) {
            openMenu(selectedIndex);
            runTypeAhead(key);
          }
          return;
      }
    }

    switch (key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Home":
      case "End":
        // Alt+ArrowUp is the native "close, keep value" gesture, not a move.
        if (altKey && key === "ArrowUp") {
          close();
        } else {
          setActiveIndex((current) => nextActiveIndex(current, key, options.length));
        }
        event.preventDefault();
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        return;
      case "Escape":
        event.preventDefault();
        close();
        return;
      case "Tab":
        // Let focus move naturally; closing without committing matches the native select.
        close();
        return;
      default:
        if (printable) {
          event.preventDefault();
          runTypeAhead(key);
        }
    }
  };

  return (
    <div ref={containerRef} className={UiClass.rowField} style={{ position: "relative", flex: 1 }}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        // A native <select> can't be themed for dark mode (issue #21); role=combobox layers the APG
        // listbox pattern onto a real button, keeping its focus-ring and forced-colors rendering.
        role="combobox"
        className={`${UiClass.select} ${UiClass.selectTrigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={label}
        {...(open && activeIndex >= 0 && options[activeIndex] !== undefined
          ? { "aria-activedescendant": optionId(options[activeIndex].key) }
          : {})}
        onClick={() => (open ? close() : openMenu(selectedIndex))}
        onKeyDown={onKeyDown}
      >
        <span>{selected?.label ?? ""}</span>
        <svg
          className={`${UiClass.selectChevron}${open ? " is-open" : ""}`}
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: APG select-only combobox popup; role=listbox on a <ul> of role=option <li>s is the canonical pattern with no native equivalent.
          role="listbox"
          className={UiClass.selectMenu}
          aria-label={label}
          tabIndex={-1}
          style={{
            top: flip.up ? "auto" : "100%",
            bottom: flip.up ? "100%" : "auto",
            left: flip.alignRight ? "auto" : 0,
            right: flip.alignRight ? 0 : "auto",
          }}
        >
          {options.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option.key === value;
            const className = `${UiClass.selectOption}${isActive ? ` ${UiClass.selectOptionActive}` : ""}${
              isSelected ? ` ${UiClass.selectOptionSelected}` : ""
            }`;
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: all keys are handled on the focused trigger (the only Tab stop); the option's onClick is a pointer convenience that mirrors that keyboard path.
              // biome-ignore lint/a11y/useFocusableInteractive: APG virtual focus — the option must NOT be focusable; the trigger keeps DOM focus and points here via aria-activedescendant.
              <li
                key={option.key}
                ref={isActive ? activeRef : null}
                id={optionId(option.key)}
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: canonical APG listbox option; <li role=option> has no native equivalent.
                role="option"
                aria-selected={isSelected}
                className={className}
                onClick={() => commit(index)}
                onPointerMove={() => setActiveIndex(index)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
