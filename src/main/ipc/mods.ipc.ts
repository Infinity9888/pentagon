import { IpcMain } from 'electron';
import { ModPlatformService } from '../services/meta/ModPlatformService';
import { ModManager } from '../services/instances/ModManager';
import { InstanceManager } from '../services/instances/InstanceManager';

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

    ipcMain.handle('mods:getFiles', async (_, instanceId: string, modId: string, provider: 'modrinth' | 'curseforge') => {
        try {
            return await ModManager.getCompatibleModFiles(modId, instanceId, provider);
        } catch (e: any) {
            console.error('Failed to get mod files:', e);
            throw e;
        }
    });

    ipcMain.handle('mods:install', async (event, instanceId: string, mod: any, fileId?: string) => {
        try {
            if (mod.provider === 'curseforge') {
                if (mod.project_type === 'mod' || mod.project_type === 'modpack') {
                    await ModManager.installCurseForgeMod(mod.project_id, instanceId, fileId, (msg) => {
                        event.sender.send('mods:install-progress', { modId: mod.project_id, message: msg });
                    });
                    return { success: true };
                }
            } else {
                if (mod.project_type === 'mod' || mod.project_type === 'modpack') {
                    await ModManager.installModrinthMod(mod.project_id, instanceId, fileId, (msg) => {
                        event.sender.send('mods:install-progress', { modId: mod.project_id, message: msg });
                    });
                    return { success: true };
                }
            }
            throw new Error('Unsupported mod provider or type.');
        } catch (e: any) {
            console.error('Failed to install mod:', e);
            throw e;
        }
    });

    ipcMain.handle('mods:remove', async (_, instanceId: string, filename: string) => {
        try {
            await InstanceManager.deleteMod(instanceId, filename);
            return { success: true };
        } catch (e) {
            console.error('Failed to remove mod:', e);
            throw e;
        }
    });

    ipcMain.handle('mods:get-installed', async (_, instanceId: string) => {
        return await InstanceManager.listMods(instanceId);
    });

    ipcMain.handle('mods:check-updates', async (_, instanceId: string) => {
        // TODO: ModManager.checkUpdates(instanceId)
        return [];
    });

    ipcMain.handle('mods:toggle', async (_, instanceId: string, filename: string) => {
        try {
            await InstanceManager.toggleMod(instanceId, filename);
            return { success: true };
        } catch (e) {
            console.error('Failed to toggle mod:', e);
            throw e;
        }
    });
}
