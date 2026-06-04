import type { SectionId } from "@md-pdf-studio/core";
import { create } from "zustand";
import { SECTION_ORDER } from "../constants";

interface UiState {
  /** The selected ribbon tab — the single source of truth for which section's controls are shown. */
  activeSection: SectionId;
  /** Tab click or arrow-key navigation in the ribbon. */
  setActiveSection: (section: SectionId) => void;
  /** A click on a rendered element in the preview switches the ribbon to that element's section tab. */
  focusSection: (section: SectionId) => void;
}

/** Ephemeral editor UI state (not persisted): which ribbon tab is currently open. */
export const useUiStore = create<UiState>((set) => ({
  activeSection: SECTION_ORDER[0] as SectionId,
  setActiveSection: (section) => set({ activeSection: section }),
  focusSection: (section) => set({ activeSection: section }),
}));
