import { create } from "zustand";

export const ToastVariant = {
  success: "success",
  error: "error",
  info: "info",
} as const;
export type ToastVariant = (typeof ToastVariant)[keyof typeof ToastVariant];

export interface Toast {
  readonly id: number;
  readonly variant: ToastVariant;
  readonly message: string;
  // Fixed at push time so the polite/assertive routing can't change mid-life.
  readonly assertive: boolean;
}

export interface ToastInput {
  readonly variant: ToastVariant;
  readonly message: string;
  // Omit (or 0) to persist until dismissed; errors persist by default.
  readonly durationMs?: number;
}

interface ToastState {
  toasts: readonly Toast[];
  push: (input: ToastInput) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

const MAX_STACK = 4;
const DEFAULT_DURATION_MS = 5000;

// Monotonic ids keep keys stable without a non-deterministic source.
let nextId = 0;

// Timers are imperative side-effects, kept out of the snapshot so they never trigger re-renders.
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function clearTimer(id: number): void {
  const handle = timers.get(id);
  if (handle !== undefined) {
    clearTimeout(handle);
    timers.delete(id);
  }
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ variant, message, durationMs }) => {
    const id = nextId++;
    const assertive = variant === ToastVariant.error;
    // A failure must not vanish before it is read; success/info auto-dismiss.
    const resolved = durationMs ?? (assertive ? 0 : DEFAULT_DURATION_MS);

    set((state) => {
      const next = [...state.toasts, { id, variant, message, assertive }];
      const trimmed = next.slice(Math.max(0, next.length - MAX_STACK));
      for (const dropped of next.slice(0, next.length - trimmed.length)) clearTimer(dropped.id);
      return { toasts: trimmed };
    });

    if (resolved > 0)
      timers.set(
        id,
        setTimeout(() => get().dismiss(id), resolved),
      );
    return id;
  },
  dismiss: (id) => {
    clearTimer(id);
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => {
    for (const id of [...timers.keys()]) clearTimer(id);
    set({ toasts: [] });
  },
}));

// Locale-free helpers; callers pass message(key, locale). The exactOptionalPropertyTypes-safe spread
// avoids ever writing durationMs: undefined into ToastInput.
export const toast = {
  success: (message: string, durationMs?: number): number =>
    useToastStore.getState().push({
      variant: ToastVariant.success,
      message,
      ...(durationMs !== undefined ? { durationMs } : {}),
    }),
  error: (message: string, durationMs?: number): number =>
    useToastStore.getState().push({
      variant: ToastVariant.error,
      message,
      ...(durationMs !== undefined ? { durationMs } : {}),
    }),
  info: (message: string, durationMs?: number): number =>
    useToastStore.getState().push({
      variant: ToastVariant.info,
      message,
      ...(durationMs !== undefined ? { durationMs } : {}),
    }),
};
