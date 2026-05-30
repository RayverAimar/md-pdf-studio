import type { ControlDef, ThemeValue } from "../types";

export interface Emitter {
  emit(id: string, control: ControlDef, value: ThemeValue): string;
}

export const emitters: Partial<Record<ControlDef["emitter"], Emitter>> = {};
