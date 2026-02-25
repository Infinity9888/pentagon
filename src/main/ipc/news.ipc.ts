import { IpcMain } from 'electron';
import { NewsService } from '../services/meta/NewsService';

export function registerNewsIPC(ipcMain: IpcMain): void {
    ipcMain.handle('news:get-minecraft', async () => {
        return await NewsService.fetchMinecraftNews();
    });

    ipcMain.handle('news:get-github', async () => {
        return await NewsService.fetchGitHubReleases();
    });
}
