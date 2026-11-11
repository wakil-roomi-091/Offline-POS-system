const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  printReceipt: (htmlContent) => ipcRenderer.invoke('print-receipt', htmlContent),
  getOfflineStatus: () => ipcRenderer.invoke('get-offline-status'),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
});
