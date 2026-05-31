import type { DesktopBridge, RenderInput } from "@md-pdf-studio/core";
import { contextBridge, ipcRenderer } from "electron";
import { RENDER_CHANNEL } from "./ipc";

// The renderer never touches Node or BrowserWindow directly; it asks the main process to render and
// save through this single, typed channel. Rendering (a hidden window + printToPDF) is main-only.
const bridge: DesktopBridge = {
  exportPdf: (request: RenderInput) => ipcRenderer.invoke(RENDER_CHANNEL, request),
};

contextBridge.exposeInMainWorld("mdPdfStudio", bridge);
