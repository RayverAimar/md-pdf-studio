"use client";

import { isPresetId, message, PresetId, presetLabel } from "@md-pdf-studio/core";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { UiClass } from "../theme/chrome";

const PRESET_IDS = Object.values(PresetId);

export function PresetSelector() {
  const locale = useLocaleStore((state) => state.locale);
  const presetId = useThemeStore((state) => state.presetId);
  const selectPreset = useThemeStore((state) => state.selectPreset);

  return (
    <select
      className={UiClass.select}
      aria-label={message("preset", locale)}
      value={presetId}
      onChange={(event) => {
        if (isPresetId(event.target.value)) selectPreset(event.target.value);
      }}
    >
      {PRESET_IDS.map((id) => (
        <option key={id} value={id}>
          {presetLabel(id, locale)}
        </option>
      ))}
    </select>
  );
}
