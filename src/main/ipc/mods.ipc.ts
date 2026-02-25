import { IpcMain } from 'electron';
import { ModPlatformService } from '../services/meta/ModPlatformService';

export function registerModsIPC(ipcMain: IpcMain): void {
    ipcMain.handle('mods:search', async (_, query: string, type: 'mod' | 'modpack' = 'modpack', provider: 'modrinth' | 'curseforge' = 'modrinth') => {
        try {
            if (provider === 'curseforge') {
                return await ModPlatformService.searchCurseForge(query, type);
            }
            return await ModPlatformService.searchModrinth(query, type);
        } catch (e: any) {
            console.error('Mods search error', e);
            throw e;
        }
    });

    ipcMain.handle('mods:install', async (_, instanceId: string, mod: any) => {
        // TODO: ModManager.install(instanceId, mod)
        return { success: true };
    });

    ipcMain.handle('mods:remove', async (_, instanceId: string, filename: string) => {
        // TODO: ModManager.remove(instanceId, filename)
        return { success: true };
    });

    ipcMain.handle('mods:get-installed', async (_, instanceId: string) => {
        // TODO: ModManager.getInstalled(instanceId)
        return [];
    });

    ipcMain.handle('mods:check-updates', async (_, instanceId: string) => {
        // TODO: ModManager.checkUpdates(instanceId)
        return [];
    });

    ipcMain.handle('mods:toggle', async (_, instanceId: string, filename: string) => {
        // TODO: ModManager.toggleEnabled(instanceId, filename)
        return { success: true };
    });
}
