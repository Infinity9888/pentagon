import { IpcMain } from 'electron';
import { VersionList } from '../services/meta/VersionList';

export function registerVersionsIPC(ipcMain: IpcMain): void {
    ipcMain.handle('versions:get-minecraft', async () => {
        try {
            const manifest = await VersionList.getMinecraftVersions();
            return manifest.versions;
        } catch (e: any) {
            console.error('Failed to get MC versions', e);
            throw e;
        }
    });

    ipcMain.handle('versions:get-forge', async (_, mcVersion: string) => {
        // TODO: fetch forge versions
        return [];
    });

    ipcMain.handle('versions:get-fabric', async (_, mcVersion: string) => {
        try {
            return await VersionList.getFabricLoaders(mcVersion);
        } catch (e: any) {
            console.error('Failed to get Fabric versions', e);
            throw e;
        }
    });

    ipcMain.handle('versions:get-quilt', async (_, mcVersion: string) => {
        // TODO: fetch from meta.quiltmc.org
        return [];
    });

    ipcMain.handle('versions:get-neoforge', async (_, mcVersion: string) => {
        // TODO: fetch neoforge versions
        return [];
    });
}
