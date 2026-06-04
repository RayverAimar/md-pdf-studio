import { describe, expect, it } from "vitest";
import {
  type DropdownOption,
  matchTypeAhead,
  nextActiveIndex,
} from "../src/components/controls/Dropdown";

const OPTIONS: DropdownOption[] = [
  { key: "a4", label: "A4" },
  { key: "letter", label: "Letter" },
  { key: "legal", label: "Legal" },
  { key: "ledger", label: "Ledger" },
];

describe("nextActiveIndex", () => {
  it("clamps at the last option instead of wrapping (native select parity)", () => {
    expect(nextActiveIndex(0, "ArrowDown", 4)).toBe(1);
    expect(nextActiveIndex(3, "ArrowDown", 4)).toBe(3);
  });

  it("clamps at the first option going up", () => {
    expect(nextActiveIndex(2, "ArrowUp", 4)).toBe(1);
    expect(nextActiveIndex(0, "ArrowUp", 4)).toBe(0);
  });

  it("jumps to the ends with Home/End", () => {
    expect(nextActiveIndex(2, "Home", 4)).toBe(0);
    expect(nextActiveIndex(1, "End", 4)).toBe(3);
  });

  it("leaves the index unchanged for unrelated keys and reports -1 for an empty list", () => {
    expect(nextActiveIndex(2, "Enter", 4)).toBe(2);
    expect(nextActiveIndex(0, "ArrowDown", 0)).toBe(-1);
  });
});

describe("matchTypeAhead", () => {
  it("matches the first option whose label starts with a single char, case-insensitively", () => {
    expect(matchTypeAhead(OPTIONS, "l", -1)).toBe(1);
    expect(matchTypeAhead(OPTIONS, "A", -1)).toBe(0);
  });

  it("cycles through options sharing a starting char on a repeated keypress", () => {
    // "l" from before "letter" lands on the next "l*" option, not back on itself.
    expect(matchTypeAhead(OPTIONS, "l", 1)).toBe(2);
    expect(matchTypeAhead(OPTIONS, "l", 2)).toBe(3);
    expect(matchTypeAhead(OPTIONS, "l", 3)).toBe(1);
  });

  it("treats a repeated single char as cycling (press l l)", () => {
    expect(matchTypeAhead(OPTIONS, "ll", 1)).toBe(2);
  });

  it("narrows on a multi-char prefix instead of cycling", () => {
    expect(matchTypeAhead(OPTIONS, "led", -1)).toBe(3);
    expect(matchTypeAhead(OPTIONS, "leg", -1)).toBe(2);
  });

  it("reports -1 for an empty buffer or no match", () => {
    expect(matchTypeAhead(OPTIONS, "", 0)).toBe(-1);
    expect(matchTypeAhead(OPTIONS, "z", -1)).toBe(-1);
  });
});
