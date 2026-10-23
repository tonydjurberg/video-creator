const { app, BrowserWindow, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

function getAppUrl() {
  const configPath = path.join(__dirname, "app-url.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const url = new URL(config.url || "");
  if (url.protocol !== "https:") throw new Error("The studio URL must use HTTPS.");
  if (url.hostname === "example.com" || url.href.includes("YOUR-PUBLISHED-STUDIO-URL")) {
    throw new Error("This installer has not been configured with the published studio URL yet.");
  }
  return url;
}

async function createWindow() {
  let studioUrl;
  try {
    studioUrl = getAppUrl();
  } catch (error) {
    const win = new BrowserWindow({ width: 760, height: 520, autoHideMenuBar: true, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
    const message = String(error.message || error).replace(/[<>&"]/g, "");
    await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(`<!doctype html><html><body style="font-family:Segoe UI,Arial;background:#070d19;color:#edf3ff;padding:48px"><h1>AI Commercial Studio</h1><p>${message}</p><p>Build a new installer after publishing the studio URL.</p></body></html>`));
    return;
  }
  const win = new BrowserWindow({
    width: 1440, height: 940, minWidth: 900, minHeight: 650,
    autoHideMenuBar: true, backgroundColor: "#070d19",
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  const allowedOrigin = studioUrl.origin;
  win.webContents.setWindowOpenHandler(({ url }) => {
    try { if (new URL(url).origin !== allowedOrigin) shell.openExternal(url); } catch {}
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    try {
      if (new URL(url).origin !== allowedOrigin) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch { event.preventDefault(); }
  });
  await win.loadURL(studioUrl.toString());
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
