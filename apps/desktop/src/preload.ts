import type { DesktopBridge, RenderInput } from "@md-pdf-studio/core";
import { contextBridge, ipcRenderer } from "electron";
import {
  RENDER_CHANNEL,
  UPDATE_DOWNLOAD_CHANNEL,
  UPDATE_EVENT_CHANNEL,
  UPDATE_INSTALL_CHANNEL,
  type UpdateEvent,
  type UpdaterBridge,
} from "./ipc";

// The renderer never touches Node or BrowserWindow directly; it asks the main process to render and
// save through this single, typed channel. Rendering (a hidden window + printToPDF) is main-only.
const bridge: DesktopBridge = {
  exportPdf: (request: RenderInput) => ipcRenderer.invoke(RENDER_CHANNEL, request),
};

contextBridge.exposeInMainWorld("mdPdfStudio", bridge);

// A separate, packaged-only surface for the in-app UpdateChecker. The web shell never exposes it, so the
// component renders nothing there.
const updater: UpdaterBridge = {
  onEvent: (handler: (event: UpdateEvent) => void) => {
    const listener = (_event: unknown, payload: UpdateEvent): void => handler(payload);
    ipcRenderer.on(UPDATE_EVENT_CHANNEL, listener);
    return () => ipcRenderer.removeListener(UPDATE_EVENT_CHANNEL, listener);
  },
  download: () => ipcRenderer.invoke(UPDATE_DOWNLOAD_CHANNEL),
  install: () => ipcRenderer.send(UPDATE_INSTALL_CHANNEL),
};

contextBridge.exposeInMainWorld("mdPdfStudioUpdater", updater);
