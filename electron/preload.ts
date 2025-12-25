const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the APIs we need. This provides a safe bridge between the main
// and renderer processes.
contextBridge.exposeInMainWorld('electronAPI', {
  setPetMode(enabled: boolean) {
    ipcRenderer.invoke('set-pet-mode', enabled);
  },
  startResize(edge: string, screenX: number, screenY: number) {
    ipcRenderer.invoke('start-resize', edge, screenX, screenY);
  },
  doResize(edge: string, x: number, y: number) {
    ipcRenderer.invoke('do-resize', edge, x, y);
  },
  stopResize() {
    ipcRenderer.invoke('stop-resize');
  },
  setAlwaysOnTop(enabled: boolean) {
    ipcRenderer.invoke('set-always-on-top', enabled);
  },
  openSettings() {
    ipcRenderer.invoke('open-settings');
  },
});

