import { IpcMain } from 'electron';

export function registerLaunchIPC(_ipcMain: IpcMain): void {
    // Launch logic is handled by instances:launch in instance.ipc.ts
    // This module will contain additional launch-related helpers
    // such as progress tracking, console output streaming, etc.
}
