import { app, BrowserWindow } from "electron";

const { MDPDF_WEB_URL } = process.env;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: `${import.meta.dirname}/preload.js`,
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
