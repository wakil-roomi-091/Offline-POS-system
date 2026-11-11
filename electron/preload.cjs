const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  printReceipt: (htmlContent) => ipcRenderer.invoke('print-receipt', htmlContent),
  getOfflineStatus: () => ipcRenderer.invoke('get-offline-status'),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  saveAutoSnapshot: (jsonContent, snapshotId) => ipcRenderer.invoke('backup-auto-snapshot', jsonContent, snapshotId),
  openBackupFolder: () => ipcRenderer.invoke('backup-open-folder'),
  listLocalBackups: () => ipcRenderer.invoke('backup-list-local'),
  saveBackupFile: (defaultFilename, jsonContent) => ipcRenderer.invoke('backup-save-file', defaultFilename, jsonContent),
});
