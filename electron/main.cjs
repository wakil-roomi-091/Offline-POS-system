const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getBackupsDirectory() {
  const dir = path.join(app.getPath('userData'), 'Backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

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
ipcMain.handle('print-receipt', async (_event, _htmlContent) => {
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

// IPC handlers for local physical database snapshots and backups
ipcMain.handle('backup-auto-snapshot', async (_event, jsonContent, snapshotId) => {
  try {
    const dir = getBackupsDirectory();
    const filename = `snapshot_${snapshotId || Date.now()}.json`;
    const filePath = path.join(dir, filename);
    await fs.promises.writeFile(filePath, jsonContent, 'utf-8');

    // Keep only most recent 20 snapshot files to preserve disk space
    try {
      const files = await fs.promises.readdir(dir);
      const snapshotFiles = files
        .filter((f) => f.startsWith('snapshot_') && f.endsWith('.json'))
        .map((f) => ({
          name: f,
          path: path.join(dir, f),
          time: fs.statSync(path.join(dir, f)).mtimeMs,
        }))
        .sort((a, b) => b.time - a.time);

      if (snapshotFiles.length > 20) {
        for (const fileToDelete of snapshotFiles.slice(20)) {
          await fs.promises.unlink(fileToDelete.path);
        }
      }
    } catch (cleanupErr) {
      console.warn('Backup cleanup error:', cleanupErr);
    }

    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('backup-open-folder', async () => {
  const dir = getBackupsDirectory();
  await shell.openPath(dir);
  return { success: true, path: dir };
});

ipcMain.handle('backup-list-local', async () => {
  try {
    const dir = getBackupsDirectory();
    const files = await fs.promises.readdir(dir);
    const list = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const fullPath = path.join(dir, f);
        const stats = fs.statSync(fullPath);
        return {
          fileName: f,
          fullPath,
          sizeBytes: stats.size,
          modifiedTime: stats.mtimeMs,
        };
      })
      .sort((a, b) => b.modifiedTime - a.modifiedTime);

    return { success: true, directory: dir, files: list };
  } catch (err) {
    return { success: false, error: err.message, files: [] };
  }
});

ipcMain.handle('backup-save-file', async (_event, defaultFilename, jsonContent) => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export DinePos Database Backup',
    defaultPath: defaultFilename || `DinePos_Backup_${Date.now()}.json`,
    filters: [{ name: 'JSON Backup (*.json)', extensions: ['json'] }],
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  try {
    await fs.promises.writeFile(filePath, jsonContent, 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
