import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { registerAuthIPC } from './ipc/auth.ipc';
import { registerInstanceIPC } from './ipc/instance.ipc';
import { registerLaunchIPC } from './ipc/launch.ipc';
import { registerModsIPC } from './ipc/mods.ipc';
import { registerSettingsIPC } from './ipc/settings.ipc';
import { registerVersionsIPC } from './ipc/versions.ipc';
import { registerWindowIPC } from './ipc/window.ipc';
import { registerNewsIPC } from './ipc/news.ipc';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0a0a0f',
        show: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    // Graceful show
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Dev or production
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    }
}

// Register all IPC handlers
function registerIPC(): void {
    registerAuthIPC(ipcMain);
    registerInstanceIPC(ipcMain);
    registerLaunchIPC(ipcMain);
    registerModsIPC(ipcMain);
    registerSettingsIPC(ipcMain);
    registerVersionsIPC(ipcMain);
    registerNewsIPC(ipcMain);
    registerWindowIPC(ipcMain, () => mainWindow);
}

app.whenReady().then(() => {
    registerIPC();
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
