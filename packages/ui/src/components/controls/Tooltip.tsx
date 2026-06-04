"use client";

import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { UiClass } from "../../theme/chrome";

// Props the wrapper hands to the trigger element it wraps. The trigger spreads these so the tooltip
// reacts to its own hover/focus, and announces itself via aria-describedby on the focusable element.
export interface TooltipTriggerProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  "aria-describedby": string;
}

interface TooltipProps {
  content: string;
  // Reused as the focusable inner widget's aria-describedby too, so the description is announced both
  // when the row is hovered/focused and when the input itself takes keyboard focus (one id on both is
  // valid). Callers pass a stable id derived once per row.
  tipId: string;
  children: (trigger: TooltipTriggerProps) => ReactNode;
}

const SHOW_DELAY_MS = 400;

// Lightweight WAI-ARIA APG tooltip: no dependency, no focus trap. The tip span is always in the DOM so
// aria-describedby resolves, and is [hidden] until open (hoverable + dismissible + persistent → WCAG
// 1.4.13). Hover opens after a short delay; focus opens immediately; Escape and blur/leave dismiss it.
export function Tooltip({ content, tipId, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const fallbackId = useId();
  const id = tipId !== "" ? tipId : fallbackId;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = useCallback((): void => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  const hide = useCallback((): void => {
    clear();
    setOpen(false);
  }, [clear]);

  useEffect(() => clear, [clear]);

  const triggerProps: TooltipTriggerProps = {
    onMouseEnter: () => {
      clear();
      timer.current = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    },
    onMouseLeave: hide,
    onFocus: () => {
      clear();
      setOpen(true);
    },
    onBlur: hide,
    onKeyDown: (event) => {
      if (event.key === "Escape") hide();
    },
    "aria-describedby": id,
  };

  return (
    <div className={UiClass.tooltipWrap}>
      {children(triggerProps)}
      <span role="tooltip" id={id} className={UiClass.tooltip} hidden={!open}>
        {content}
      </span>
    </div>
  );
}
