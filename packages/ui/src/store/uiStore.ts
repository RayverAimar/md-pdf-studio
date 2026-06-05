import type { ElementKey, SectionId } from "@md-pdf-studio/core";
import { create } from "zustand";
import { SECTION_ORDER } from "../constants";

interface UiState {
  /** The selected rail tab — the single source of truth for which section's controls are shown. */
  activeSection: SectionId;
  /** Tab click or arrow-key navigation in the rail. */
  setActiveSection: (section: SectionId) => void;
  // Bumped on every preview selection so a repeat click on the same element still re-announces (and
  // re-focuses when Follow selection is on); a plain value-equality store update would swallow it.
  selectionTick: number;
  /** A click on a rendered element jumps the rail to its section and bumps the selection tick. */
  selectElement: (section: SectionId, element: ElementKey) => void;
}

/** Ephemeral editor UI state (not persisted): which rail tab is open and the live preview selection. */
export const useUiStore = create<UiState>((set) => ({
  activeSection: SECTION_ORDER[0] as SectionId,
  setActiveSection: (section) => set({ activeSection: section }),
  selectionTick: 0,
  selectElement: (section, _element) =>
    set((state) => ({
      activeSection: section,
      selectionTick: state.selectionTick + 1,
    })),
}));
