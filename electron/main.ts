import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    title: 'Surreal - VRM Galgame',
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#00000000',
      height: 0,
    },
    autoHideMenuBar: false,
    resizable: true, // 明确允许调整窗口大小，确保在 Windows 上也能调整
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  // Check if we're in development mode or if dist/index.html doesn't exist
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const distPath = join(__dirname, '../dist/index.html');
  const distExists = existsSync(distPath);

  if (isDev || !distExists) {
    // Development mode: use Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    
    // If dev server is not ready, wait a bit and retry
    mainWindow.webContents.on('did-fail-load', (_event, errorCode) => {
      if (errorCode === -106 || errorCode === -105) {
        // ERR_INTERNET_DISCONNECTED or ERR_NAME_NOT_RESOLVED - dev server not ready
        console.log('Waiting for Vite dev server...');
        setTimeout(() => {
          mainWindow?.loadURL('http://localhost:5173');
        }, 1000);
      }
    });
  } else {
    // Production mode: load from dist
    mainWindow.loadFile(distPath);
  }

  // Ensure menu bar stays hidden in dev/prod
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('set-pet-mode', (_event, enabled: boolean) => {
  if (!mainWindow) return;
  if (enabled) {
    mainWindow.setTitleBarOverlay({
      color: '#00000000',
      symbolColor: '#00000000',
      height: 0,
    });
    mainWindow.setHasShadow(false);
    mainWindow.setBackgroundColor('#00000000');
  } else {
    mainWindow.setTitleBarOverlay({
      color: '#101014',
      symbolColor: '#ffffff',
      height: 32,
    });
    mainWindow.setHasShadow(true);
    mainWindow.setBackgroundColor('#101014');
  }
});

// Window resize handlers
let isResizing = false;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let startScreenX = 0;
let startScreenY = 0;

ipcMain.handle('start-resize', (_event, _edge: string, screenX: number, screenY: number) => {
  if (!mainWindow) return;
  isResizing = true;
  const bounds = mainWindow.getBounds();
  startX = bounds.x;
  startY = bounds.y;
  startWidth = bounds.width;
  startHeight = bounds.height;
  startScreenX = screenX;
  startScreenY = screenY;
});

ipcMain.handle('do-resize', (_event, edge: string, screenX: number, screenY: number) => {
  if (!mainWindow || !isResizing) return;
  
  // Calculate delta in screen coordinates
  const deltaX = screenX - startScreenX;
  const deltaY = screenY - startScreenY;
  
  let newX = startX;
  let newY = startY;
  let newWidth = startWidth;
  let newHeight = startHeight;
  
  // Calculate new bounds based on edge
  if (edge.includes('right')) {
    newWidth = Math.max(200, startWidth + deltaX);
  }
  if (edge.includes('left')) {
    newX = startX + deltaX;
    newWidth = Math.max(200, startWidth - deltaX);
  }
  if (edge.includes('bottom')) {
    newHeight = Math.max(200, startHeight + deltaY);
  }
  if (edge.includes('top')) {
    newY = startY + deltaY;
    newHeight = Math.max(200, startHeight - deltaY);
  }
  
  mainWindow.setBounds({
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  });
});

ipcMain.handle('stop-resize', () => {
  isResizing = false;
});

ipcMain.handle('set-always-on-top', (_event, enabled: boolean) => {
  if (!mainWindow) return;
  mainWindow.setAlwaysOnTop(enabled);
});

function createSettingsWindow(): void {
  // If settings window already exists, focus it instead of creating a new one
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    title: '设置',
    frame: true,
    transparent: false,
    hasShadow: true,
    backgroundColor: '#ffffff',
    resizable: true,
    parent: mainWindow || undefined,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the settings page
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const distPath = join(__dirname, '../dist/settings.html');
  const distExists = existsSync(distPath);

  if (isDev || !distExists) {
    // Development mode: use Vite dev server
    settingsWindow.loadURL('http://localhost:5173/settings.html');
    settingsWindow.webContents.openDevTools();
  } else {
    // Production mode: load from dist
    settingsWindow.loadFile(distPath);
  }

  settingsWindow.setMenuBarVisibility(false);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
});

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

