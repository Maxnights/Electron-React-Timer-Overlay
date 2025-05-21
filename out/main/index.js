"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 350,
    height: 200,
    show: false,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  let toggleOverLayHotkey = "CommandOrControl+6";
  let isOverlayOn = false;
  electron.globalShortcut.register(toggleOverLayHotkey, () => {
    isOverlayOn = !isOverlayOn;
    mainWindow.setIgnoreMouseEvents(isOverlayOn);
    mainWindow.webContents.send("overlay-mode", isOverlayOn);
    console.log("overlay", isOverlayOn);
  });
  mainWindow.setAlwaysOnTop(true, "screen");
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("close-window", () => {
    const currentWindow = electron.BrowserWindow.getFocusedWindow();
    if (currentWindow) {
      currentWindow.close();
    }
  });
  electron.ipcMain.on("minimize-window", () => {
    const currentWindow = electron.BrowserWindow.getFocusedWindow();
    if (currentWindow) {
      currentWindow.minimize();
    }
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
