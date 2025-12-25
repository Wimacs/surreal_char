const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the APIs we need. This provides a safe bridge between the main
// and renderer processes.
contextBridge.exposeInMainWorld('electronAPI', {
  setPetMode(enabled: boolean) {
    ipcRenderer.invoke('set-pet-mode', enabled);
  },
});

