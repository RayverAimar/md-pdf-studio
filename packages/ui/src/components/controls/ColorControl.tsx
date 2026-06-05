"use client";

import { isHexColor } from "@md-pdf-studio/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { UiClass } from "../../theme/chrome";

interface ColorControlProps {
  inputId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Forwarded to the hex input so the row tooltip is announced when the field takes keyboard focus.
  describedBy?: string;
}

const POPOVER_WIDTH = 220;
const POPOVER_HEIGHT = 200;
const EDGE_GAP = 8;

/** Swatch that opens a hex picker, plus a text field for typing an exact value. */
export function ColorControl({ inputId, label, value, onChange, describedBy }: ColorControlProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  // Keep the text field in sync when the value changes from elsewhere (preset switch, reset).
  useEffect(() => setDraft(value), [value]);

  // The popover is position:fixed (viewport coordinates) so the inspector's overflow:auto can't clip
  // it the way an absolutely-positioned child would. Compute its corner from the swatch rect, flipping
  // above/left of the swatch when it would otherwise spill past the viewport edge, and clamp to the gap.
  const recomputePos = useCallback((): void => {
    const rect = swatchRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    const up = rect.bottom + POPOVER_HEIGHT + EDGE_GAP > window.innerHeight;
    const alignRight = rect.left + POPOVER_WIDTH + EDGE_GAP > window.innerWidth;
    const top = up ? rect.top - POPOVER_HEIGHT - EDGE_GAP : rect.bottom + EDGE_GAP;
    const left = alignRight ? rect.right - POPOVER_WIDTH : rect.left;
    setPos({ top: Math.max(EDGE_GAP, top), left: Math.max(EDGE_GAP, left) });
  }, []);

  // The swatch moves as the controls column scrolls or the window resizes; recompute so the fixed
  // popover tracks it and can't drift past the viewport edge. Scroll is captured to catch the inner column.
  useEffect(() => {
    if (!open) return;
    recomputePos();
    window.addEventListener("scroll", recomputePos, true);
    window.addEventListener("resize", recomputePos);
    return () => {
      window.removeEventListener("scroll", recomputePos, true);
      window.removeEventListener("resize", recomputePos);
    };
  }, [open, recomputePos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const commitDraft = (): void => {
    if (isHexColor(draft)) onChange(draft);
    else setDraft(value);
  };

  return (
    // The popover is position:fixed, so no positioned ancestor is needed; the container only scopes the
    // outside-pointerdown dismiss (it still contains the popover in the DOM). flex/gap live on the class
    // so the compact skin can tighten the swatch+hex spacing without an inline override.
    <div ref={containerRef} className={UiClass.colorField}>
      <button
        ref={swatchRef}
        type="button"
        className={UiClass.swatch}
        style={{ background: value }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
      />
      <input
        id={inputId}
        type="text"
        className={UiClass.hexInput}
        value={draft}
        spellCheck={false}
        {...(describedBy !== undefined ? { "aria-describedby": describedBy } : {})}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitDraft();
        }}
      />
      {open && pos !== null ? (
        <div className={UiClass.swatchPop} style={{ top: pos.top, left: pos.left }}>
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
}
