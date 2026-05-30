import { describe, expect, it } from "vitest";
import { Section } from "@/constants";
import {
  controlLabel,
  DEFAULT_LOCALE,
  Locale,
  message,
  presetLabel,
  resolveLocale,
  sectionLabel,
} from "@/i18n";
import { PresetId } from "@/presets";

describe("resolveLocale", () => {
  it("accepts a supported locale and a region-tagged variant", () => {
    expect(resolveLocale("es")).toBe(Locale.spanish);
    expect(resolveLocale("es-PE")).toBe(Locale.spanish);
    expect(resolveLocale("en-US")).toBe(Locale.english);
  });

  it("falls back to the default for unknown or missing values", () => {
    expect(resolveLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
  });
});

describe("label catalogs", () => {
  it("translates section labels", () => {
    expect(sectionLabel(Section.page, Locale.english)).toBe("Page");
    expect(sectionLabel(Section.page, Locale.spanish)).toBe("Página");
  });

  it("translates preset names", () => {
    expect(presetLabel(PresetId.technical, Locale.english)).toBe("Technical");
    expect(presetLabel(PresetId.technical, Locale.spanish)).toBe("Técnico");
  });

  it("translates chrome messages", () => {
    expect(message("exportPdf", Locale.spanish)).toBe("Exportar PDF");
  });
});

describe("controlLabel", () => {
  it("returns the English label as-is for the English locale", () => {
    expect(controlLabel("page.size", "Page size", Locale.english)).toBe("Page size");
  });

  it("returns the Spanish translation when available", () => {
    expect(controlLabel("page.size", "Page size", Locale.spanish)).toBe("Tamaño de página");
  });

  it("falls back to the English label when a translation is missing", () => {
    expect(controlLabel("made.up", "Fallback", Locale.spanish)).toBe("Fallback");
  });
});
