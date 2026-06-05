/** IPC channel the preload bridge and the main process agree on for a PDF export request. */
export const RENDER_CHANNEL = "mdp:export-pdf";

// Auto-update channels. The main process forwards electron-updater's lifecycle to the renderer's
// UpdateChecker; the renderer asks to start the download and to install-and-relaunch.
export const UPDATE_EVENT_CHANNEL = "mdp:update-event";
export const UPDATE_DOWNLOAD_CHANNEL = "mdp:update-download";
export const UPDATE_INSTALL_CHANNEL = "mdp:update-install";

/** One step of the update lifecycle, sent main → renderer. */
export type UpdateEvent =
  | { kind: "available"; version: string; notes: string }
  | { kind: "progress"; percent: number; transferredMb: number; totalMb: number }
  | { kind: "downloaded"; version: string }
  | { kind: "error"; message: string };

/** The updater surface the preload exposes on `window` for the renderer's UpdateChecker. */
export interface UpdaterBridge {
  /** Subscribe to lifecycle events; returns an unsubscribe function. */
  onEvent: (handler: (event: UpdateEvent) => void) => () => void;
  /** Start downloading the available update (progress arrives via onEvent). */
  download: () => Promise<void>;
  /** Quit and install the downloaded update, relaunching the app. */
  install: () => void;
}
