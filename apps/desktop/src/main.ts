import { writeFile } from "node:fs/promises";
import { type DesktopExportResult, pdfFileName, type RenderInput } from "@md-pdf-studio/core";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { RENDER_CHANNEL } from "./ipc";
import { ElectronRenderPort } from "./renderPort";

const { MDPDF_WEB_URL } = process.env;

// The ad-hoc-signed dev binary makes macOS prompt for the login-keychain password on every launch
// (Chromium's Safe Storage); a packaged, properly-signed build has a stable identity and keeps the
// keychain-backed store.
if (!app.isPackaged) app.commandLine.appendSwitch("password-store", "basic");

const renderPort = new ElectronRenderPort();

// Render in the main process, then let the OS save dialog place the file. A dismissed dialog is a
// normal, non-error outcome the UI reports quietly.
ipcMain.handle(RENDER_CHANNEL, async (_event, input: RenderInput): Promise<DesktopExportResult> => {
  const result = await renderPort.render(input);
  if (!result.ok) return { ok: false, message: result.error.message };

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: pdfFileName(input.theme.name),
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || filePath === undefined) return { ok: true, canceled: true };

  await writeFile(filePath, result.pdf);
  return { ok: true, canceled: false, path: filePath };
});

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    // macOS draws the window/Dock icon from the signed .app bundle; Windows/Linux dev windows need this explicit icon.
    icon: `${import.meta.dirname}/../build/icon.png`,
    webPreferences: {
      preload: `${import.meta.dirname}/preload.mjs`,
      contextIsolation: true,
      // ESM preload scripts cannot run in the sandbox; contextIsolation still walls off the renderer.
      sandbox: false,
    },
  });
  void win.loadURL(MDPDF_WEB_URL ?? "http://localhost:3000");
}

void app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
