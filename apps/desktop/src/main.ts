import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type DesktopExportResult, pdfFileName, type RenderInput } from "@md-pdf-studio/core";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
// electron-updater is CommonJS; default-import then destructure so the interop is unambiguous under ESM.
import electronUpdater from "electron-updater";
import { RENDER_CHANNEL } from "./ipc";
import { ElectronRenderPort } from "./renderPort";

const { autoUpdater } = electronUpdater;
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
  // A packaged build serves the UI from its own bundled renderer (file://); dev loads the Next dev
  // server for HMR. MDPDF_WEB_URL overrides both, e.g. to point a build at a hosted web app.
  if (MDPDF_WEB_URL !== undefined) void win.loadURL(MDPDF_WEB_URL);
  else if (app.isPackaged) void win.loadFile(join(import.meta.dirname, "renderer", "index.html"));
  else void win.loadURL("http://localhost:3000");
}

void app.whenReady().then(() => {
  createWindow();
  // Only a packaged build can self-update; it checks the GitHub release feed and notifies the user once
  // a newer version is downloaded, ready to install on the next launch. Failures (offline, no release
  // yet) are non-fatal.
  if (app.isPackaged) void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
