const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: 'DinePos — Offline Restaurant POS Desktop',
    backgroundColor: '#F7F8FA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for offline desktop POS capabilities
ipcMain.handle('print-receipt', async (event, htmlContent) => {
  // Silent thermal printing support for 80mm printers
  if (!mainWindow) return { success: false, error: 'Window not available' };
  return new Promise((resolve) => {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: { width: 80000, height: 297000 }, // 80mm roll standard
    }, (success, failureReason) => {
      resolve({ success, error: failureReason });
    });
  });
});

ipcMain.handle('get-offline-status', () => {
  return {
    isDesktop: true,
    platform: process.platform,
    version: app.getVersion(),
    offlineEngine: 'SQLite / IndexedDB Local Storage',
  };
});

ipcMain.handle('window-control', (event, action) => {
  if (!mainWindow) return;
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
  if (action === 'close') mainWindow.close();
  if (action === 'toggle-kiosk') {
    mainWindow.setKiosk(!mainWindow.isKiosk());
  }
});
