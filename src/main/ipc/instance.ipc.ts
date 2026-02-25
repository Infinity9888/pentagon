import { IpcMain, shell } from 'electron';
import { LaunchService } from '../services/launch/LaunchService';
import { InstanceManager, InstanceConfig } from '../services/instances/InstanceManager';
import { authService } from './auth.ipc';
import * as path from 'path';

export function registerInstanceIPC(ipcMain: IpcMain): void {
    ipcMain.handle('instances:list', async () => {
        try {
            return await InstanceManager.getInstances();
        } catch (e) {
            console.error('Failed to list instances', e);
            return [];
        }
    });

    ipcMain.handle('instances:create', async (_, config: InstanceConfig) => {
        try {
            // Use generating id strategy: lowercase name with dashes
            const id = config.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await InstanceManager.createInstance(id, config);
            return { success: true, id };
        } catch (e: any) {
            console.error('Failed to create instance', e);
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('instances:launch', async (event, id: string) => {
        try {
            const accountsData = authService.getAccounts();
            const activeAccount = accountsData.accounts.find(a => a.internalId === accountsData.defaultId);

            if (!activeAccount) {
                throw new Error("No active account selected. Please log in first.");
            }

            // Fire-and-forget launch so UI isn't blocked awaiting promise
            LaunchService.launch(id, activeAccount, (status, current, total) => {
                event.sender.send('launch:progress', { instanceId: id, status, current, total });
            }, (line, level) => {
                event.sender.send('instances:log', { instanceId: id, line, level });
            }).catch(e => {
                event.sender.send('launch:progress', { instanceId: id, status: `Launch Error: ${e.message}` });
            });

            return { success: true };
        } catch (error: any) {
            console.error('[LaunchIPC] Error launching instance:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('instances:kill', async (_, id: string) => {
        const success = LaunchService.kill(id);
        return { success };
    });

    ipcMain.handle('instances:delete', async (_, id: string) => {
        try {
            await InstanceManager.deleteInstance(id);
            return { success: true };
        } catch (e: any) {
            console.error('Failed to delete instance:', e);
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('instances:duplicate', async (_, id: string, newName: string) => {
        // TODO: InstanceManager.duplicate(id, newName)
        return { success: true };
    });

    ipcMain.handle('instances:get-config', async (_, id: string) => {
        try {
            return await InstanceManager.getConfig(id);
        } catch (e) {
            console.error('Failed to get instance config:', e);
            throw e;
        }
    });

    ipcMain.handle('instances:update-config', async (_, id: string, config: any) => {
        try {
            await InstanceManager.updateInstanceConfig(id, config);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('instances:list-mods', async (_, id: string) => {
        return await InstanceManager.listMods(id);
    });

    ipcMain.handle('instances:toggle-mod', async (_, id: string, fileName: string) => {
        await InstanceManager.toggleMod(id, fileName);
        return { success: true };
    });

    ipcMain.handle('instances:delete-mod', async (_, id: string, fileName: string) => {
        await InstanceManager.deleteMod(id, fileName);
        return { success: true };
    });

    ipcMain.handle('instances:open-folder', async (_, id: string, subfolder?: string) => {
        try {
            const instancePath = path.join(InstanceManager.getInstancesDir(), id);
            let targetPath = instancePath;
            if (subfolder) {
                targetPath = path.join(instancePath, '.minecraft', subfolder);
            }
            await shell.openPath(targetPath);
            return { success: true };
        } catch (e: any) {
            console.error('Failed to open folder', e);
            return { success: false, error: e.message };
        }
    });
}
