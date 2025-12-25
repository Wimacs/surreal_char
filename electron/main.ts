import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Surreal - VRM Galgame',
    frame: false,
    transparent: true,
    hasShadow: true,
    backgroundColor: '#101014',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#101014',
      symbolColor: '#ffffff',
      height: 32,
    },
    autoHideMenuBar: false,
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
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
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

