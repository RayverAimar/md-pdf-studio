import { presets, schema, slug, type Theme } from "@md-pdf-studio/core";
import { beforeEach, describe, expect, it } from "vitest";
import { PAGE_SIZE_MM } from "../src/constants";
import { useDocumentStore } from "../src/store/documentStore";
import { useThemeStore } from "../src/store/themeStore";

describe("slug", () => {
  it("lowercases, hyphenates and trims to a filesystem-safe name", () => {
    expect(slug("  My Theme!! ")).toBe("my-theme");
  });

  it("falls back when a name reduces to nothing", () => {
    expect(slug("   ")).toBe("document");
    expect(slug("***")).toBe("document");
  });
});

describe("page geometry map", () => {
  it("covers every page.size enum member", () => {
    const sizes = schema.controls["page.size"]?.enum ?? [];
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) expect(PAGE_SIZE_MM[size]).toBeGreaterThan(0);
  });
});

describe("documentStore", () => {
  beforeEach(() => {
    useDocumentStore.setState({ markdown: "seed" });
  });

  it("loads imported markdown verbatim", () => {
    useDocumentStore.getState().loadMarkdown("# Imported");
    expect(useDocumentStore.getState().markdown).toBe("# Imported");
  });

  it("clears the document on new", () => {
    useDocumentStore.getState().newDocument();
    expect(useDocumentStore.getState().markdown).toBe("");
  });
});

describe("themeStore import/export", () => {
  beforeEach(() => {
    useThemeStore.setState({ dirty: false });
  });

  it("exports a detached copy of the current theme", () => {
    const exported = useThemeStore.getState().exportTheme();
    expect(exported).toEqual(useThemeStore.getState().theme);
    expect(exported).not.toBe(useThemeStore.getState().theme);
  });

  it("accepts a well-formed theme and flags it dirty", () => {
    const incoming: Theme = {
      schemaVersion: schema.version,
      name: "Imported",
      values: { "page.size": "Letter" },
    };
    expect(useThemeStore.getState().importTheme(incoming)).toBe(true);
    expect(useThemeStore.getState().theme.name).toBe("Imported");
    expect(useThemeStore.getState().dirty).toBe(true);
  });

  it("rejects malformed input without touching the current theme", () => {
    const before = useThemeStore.getState().theme;
    expect(useThemeStore.getState().importTheme({ name: "no version" })).toBe(false);
    expect(useThemeStore.getState().importTheme(null)).toBe(false);
    expect(useThemeStore.getState().importTheme("nope")).toBe(false);
    expect(useThemeStore.getState().theme).toBe(before);
  });
});

// Guard against a regression where an imported theme silently keeps a stale preset reference.
describe("themeStore preset isolation", () => {
  it("a fresh preset selection clears dirty", () => {
    useThemeStore.getState().importTheme({
      schemaVersion: schema.version,
      name: "x",
      values: {},
    });
    expect(useThemeStore.getState().dirty).toBe(true);
    const presetId = Object.keys(presets)[0] as keyof typeof presets;
    useThemeStore.getState().selectPreset(presetId);
    expect(useThemeStore.getState().dirty).toBe(false);
  });
});
