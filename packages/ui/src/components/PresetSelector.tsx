"use client";

import { isPresetId, message, PresetId, presetLabel } from "@md-pdf-studio/core";
import { useLocaleStore } from "../store/localeStore";
import { useThemeStore } from "../store/themeStore";
import { Dropdown } from "./controls/Dropdown";

const PRESET_IDS = Object.values(PresetId);

export function PresetSelector() {
  const locale = useLocaleStore((state) => state.locale);
  const presetId = useThemeStore((state) => state.presetId);
  const selectPreset = useThemeStore((state) => state.selectPreset);

  return (
    <Dropdown
      label={message("preset", locale)}
      options={PRESET_IDS.map((id) => ({ key: id, label: presetLabel(id, locale) }))}
      value={presetId}
      onChange={(key) => {
        if (isPresetId(key)) selectPreset(key);
      }}
    />
  );
}
