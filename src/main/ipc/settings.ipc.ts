import { IpcMain, dialog } from 'electron';
import { settingsService } from '../services/settings/SettingsService';
import { JavaDetector } from '../services/launch/JavaDetector';
import { PathResolver } from '../services/utils/PathResolver';

export function registerSettingsIPC(ipcMain: IpcMain): void {
    ipcMain.handle('settings:get', async () => {
        return settingsService.getSettings();
    });

    ipcMain.handle('settings:set', async (_, settings: any) => {
        settingsService.updateSettings(settings);
        return { success: true };
    });

    ipcMain.handle('settings:get-java', async () => {
        return await JavaDetector.detectJava();
    });

    ipcMain.handle('settings:select-java-path', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Executables', extensions: ['exe'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('settings:select-directory', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('settings:get-data-dir', async () => {
        return PathResolver.getDataDir();
    });
}
