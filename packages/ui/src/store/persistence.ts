import { createJSONStorage, type StateStorage } from "zustand/middleware";

/** localStorage keys for persisted UI state. Centralized so a rename can't desync reads and writes. */
export const StorageKey = {
  document: "mdp.document",
  theme: "mdp.theme",
  locale: "mdp.locale",
  colorScheme: "mdp.colorScheme",
} as const;

// Stores initialize during module evaluation, which also happens on the server where localStorage is
// absent. This in-memory shim keeps persistence inert there; the real store is created with
// skipHydration and rehydrated from the browser on mount, so server and client first render match.
const memory = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

const hasLocalStorage = (): boolean => {
  try {
    return typeof window !== "undefined" && window.localStorage !== undefined;
  } catch {
    return false;
  }
};

interface ThrottledWriter {
  write: (key: string, value: string) => void;
  flush: () => void;
}

// A color drag fires setValue on every pointer-move; without this, zustand persist re-serializes the
// whole ~157-key theme and writes it synchronously to localStorage on every tick. Coalesce writes on
// the trailing edge so only the latest value per key lands, while the in-memory store stays current.
export function createThrottledWriter(
  setItem: (key: string, value: string) => void,
  delayMs: number,
): ThrottledWriter {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    for (const [key, value] of pending) setItem(key, value);
    pending.clear();
  };

  const write = (key: string, value: string): void => {
    pending.set(key, value);
    if (timer === undefined) timer = setTimeout(flush, delayMs);
  };

  return { write, flush };
}

const THROTTLE_MS = 140;

function throttledLocalStorage(): StateStorage {
  const writer = createThrottledWriter(
    (key, value) => window.localStorage.setItem(key, value),
    THROTTLE_MS,
  );

  // The trailing-edge timer can be dropped when the tab is hidden or torn down; flush so the last
  // value committed during a drag is never lost.
  const onLeave = (): void => writer.flush();
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") writer.flush();
  });

  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => writer.write(key, value),
    removeItem: (key) => {
      writer.flush();
      window.localStorage.removeItem(key);
    },
  };
}

export const persistedStorage = createJSONStorage(() =>
  hasLocalStorage() ? throttledLocalStorage() : memoryStorage,
);
