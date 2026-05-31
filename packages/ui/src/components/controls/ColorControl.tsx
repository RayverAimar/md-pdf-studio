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
}

const POPOVER_WIDTH = 220;
const POPOVER_HEIGHT = 200;
const EDGE_GAP = 8;

/** Swatch that opens a hex picker, plus a text field for typing an exact value. */
export function ColorControl({ inputId, label, value, onChange }: ColorControlProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [flip, setFlip] = useState({ up: false, alignRight: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  // Keep the text field in sync when the value changes from elsewhere (preset switch, reset).
  useEffect(() => setDraft(value), [value]);

  // Flip the popover above/left of the swatch when it would otherwise spill past the viewport edge,
  // so the picker stays fully visible inside the narrow controls column.
  const recomputeFlip = useCallback((): void => {
    const rect = swatchRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    setFlip({
      up: rect.bottom + POPOVER_HEIGHT + EDGE_GAP > window.innerHeight,
      alignRight: rect.left + POPOVER_WIDTH + EDGE_GAP > window.innerWidth,
    });
  }, []);

  // The swatch moves as the controls column scrolls or the window resizes; keep the flip in step so
  // the open popover can't drift past the viewport edge. Scroll is captured to catch the inner column.
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
    <div ref={containerRef} style={{ position: "relative", display: "flex", gap: "8px", flex: 1 }}>
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
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitDraft();
        }}
      />
      {open ? (
        <div
          className={UiClass.swatchPop}
          style={{
            top: flip.up ? "auto" : "100%",
            bottom: flip.up ? "100%" : "auto",
            left: flip.alignRight ? "auto" : 0,
            right: flip.alignRight ? 0 : "auto",
          }}
        >
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
}
