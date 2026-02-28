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
import { registerServersIPC } from './ipc/servers.ipc';

let mainWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// Register custom protocols
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('curseforge', process.execPath, [join(process.cwd(), process.argv[1])]);
        app.setAsDefaultProtocolClient('modrinth', process.execPath, [join(process.cwd(), process.argv[1])]);
        app.setAsDefaultProtocolClient('pentagon', process.execPath, [join(process.cwd(), process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('curseforge');
    app.setAsDefaultProtocolClient('modrinth');
    app.setAsDefaultProtocolClient('pentagon');
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

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

        // If a deep link was opened before window was ready, process it now
        if (deepLinkUrl) {
            mainWindow?.webContents.send('app:open-url', deepLinkUrl);
            deepLinkUrl = null;
        }

        // On Windows/Linux, process.argv may contain the URL on initial launch
        if (process.platform === 'win32' || process.platform === 'linux') {
            const url = process.argv.find(arg => arg.startsWith('curseforge://') || arg.startsWith('modrinth://') || arg.startsWith('pentagon://'));
            if (url) {
                mainWindow?.webContents.send('app:open-url', url);
            }
        }
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
    registerServersIPC(ipcMain);
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

app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();

        // Find the URL argument
        const url = commandLine.find(arg => arg.startsWith('curseforge://') || arg.startsWith('modrinth://') || arg.startsWith('pentagon://'));
        if (url) {
            mainWindow.webContents.send('app:open-url', url);
        }
    }
});

// macOS Specific deep link handling
app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isLoading()) {
        mainWindow.webContents.send('app:open-url', url);
    } else {
        deepLinkUrl = url;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
