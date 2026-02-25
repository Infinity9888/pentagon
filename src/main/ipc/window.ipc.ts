import { IpcMain, BrowserWindow } from 'electron';

export function registerWindowIPC(ipcMain: IpcMain, getWindow: () => BrowserWindow | null): void {
    ipcMain.on('window:minimize', () => {
        getWindow()?.minimize();
    });

    ipcMain.on('window:maximize', () => {
        const win = getWindow();
        if (win?.isMaximized()) {
            win.unmaximize();
        } else {
            win?.maximize();
        }
    });

    ipcMain.on('window:close', () => {
        getWindow()?.close();
    });

    ipcMain.handle('window:is-maximized', () => {
        return getWindow()?.isMaximized() ?? false;
    });
}
