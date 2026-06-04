import { describe, expect, it } from "vitest";
import { Chrome } from "../src/theme/chrome";
import {
  EDITOR_THEME_DARK,
  EDITOR_THEME_LIGHT,
  EDITOR_TOKEN_DARK,
  EDITOR_TOKEN_LIGHT,
} from "../src/theme/editorTheme";

// WCAG 2.x relative luminance / contrast ratio so the syntax palette can never silently regress below
// AA against its scheme's editor surface; a future hex edit that drops under 4.5:1 fails here.
const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (m === null) throw new Error(`expected a 6-digit hex, got ${hex}`);
  const n = Number.parseInt(m[1] as string, 16);
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

describe("editor theme", () => {
  it("exports non-empty extension arrays for both schemes", () => {
    expect(EDITOR_THEME_LIGHT.length).toBeGreaterThan(0);
    expect(EDITOR_THEME_DARK.length).toBeGreaterThan(0);
  });

  it("keeps every dark syntax token at WCAG AA over the dark editor surface", () => {
    const bg = Chrome.color.dark.surface;
    for (const [name, color] of Object.entries(EDITOR_TOKEN_DARK)) {
      expect(contrast(color, bg), `dark token ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps every light syntax token at WCAG AA over the light editor surface", () => {
    const bg = Chrome.color.light.surface;
    for (const [name, color] of Object.entries(EDITOR_TOKEN_LIGHT)) {
      expect(contrast(color, bg), `light token ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the editor body text and gutter line numbers at AA in both schemes", () => {
    const d = Chrome.color.dark;
    const l = Chrome.color.light;
    expect(contrast(d.text, d.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(l.text, l.surface)).toBeGreaterThanOrEqual(4.5);
    // Gutter line numbers as the editor actually paints them: dark uses textFaint, light steps to
    // textMuted because the faint token is under AA at editor size over white.
    expect(contrast(d.textFaint, d.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(l.textMuted, l.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
