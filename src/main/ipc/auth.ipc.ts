import { IpcMain } from 'electron';
import { AuthService } from '../services/auth/AuthService';

export const authService = new AuthService();

export function registerAuthIPC(ipcMain: IpcMain): void {
    ipcMain.handle('auth:login-msa', async () => {
        return authService.loginMSA();
    });

    ipcMain.handle('auth:login-offline', async (_, username: string) => {
        return authService.loginOffline(username);
    });

    ipcMain.handle('auth:get-accounts', async () => {
        return authService.getAccounts();
    });

    ipcMain.handle('auth:remove-account', async (_, id: string) => {
        return authService.removeAccount(id);
    });

    ipcMain.handle('auth:set-default', async (_, id: string) => {
        return authService.setDefault(id);
    });

    ipcMain.handle('auth:refresh', async (_, id: string) => {
        return authService.refresh(id);
    });
}
