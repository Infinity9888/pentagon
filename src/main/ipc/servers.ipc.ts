import { IpcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { InstanceManager } from '../services/instances/InstanceManager';
import nbt from 'prismarine-nbt';
import util from 'util';

const parseNbt = util.promisify(nbt.parse);

export function registerServersIPC(ipcMain: IpcMain): void {
    ipcMain.handle('servers:get', async (_, instanceId: string) => {
        try {
            const serversFile = path.join(InstanceManager.getInstancesDir(), instanceId, '.minecraft', 'servers.dat');
            if (!fs.existsSync(serversFile)) {
                return [];
            }
            const buffer = fs.readFileSync(serversFile);
            const result: any = await parseNbt(buffer);
            const parsed = result.parsed || result;

            const serversList = parsed?.value?.servers?.value?.value || [];
            return serversList.map((serverData: any) => ({
                name: serverData.name?.value || 'Unknown Server',
                ip: serverData.ip?.value || 'localhost',
            }));
        } catch (e: any) {
            console.error('Failed to get servers', e);
            return [];
        }
    });

    ipcMain.handle('servers:add', async (_, instanceId: string, serverInfo: { name: string, ip: string }) => {
        try {
            const serversFile = path.join(InstanceManager.getInstancesDir(), instanceId, '.minecraft', 'servers.dat');

            let parsedNbt: any;
            if (fs.existsSync(serversFile)) {
                try {
                    const buffer = fs.readFileSync(serversFile);
                    if (buffer.length > 0) {
                        const result: any = await parseNbt(buffer);
                        parsedNbt = result.parsed || result;
                    }
                    if (!parsedNbt?.value?.servers?.value?.value) {
                        throw new Error("Invalid NBT structure");
                    }
                } catch (e) {
                    console.warn("servers.dat corrupted or invalid, recreating...");
                    parsedNbt = null;
                }
            }

            if (!parsedNbt) {
                parsedNbt = {
                    type: 'compound',
                    name: '',
                    value: {
                        servers: {
                            type: 'list',
                            value: {
                                type: 'compound',
                                value: []
                            }
                        }
                    }
                };
            }

            const serversList = parsedNbt.value.servers.value.value;
            serversList.push({
                name: { type: 'string', value: serverInfo.name },
                ip: { type: 'string', value: serverInfo.ip }
            });

            const outBuffer = nbt.writeUncompressed(parsedNbt);
            fs.writeFileSync(serversFile, outBuffer);

            return { success: true };
        } catch (e: any) {
            console.error('Failed to add server', e);
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('servers:remove', async (_, instanceId: string, serverIp: string) => {
        try {
            const serversFile = path.join(InstanceManager.getInstancesDir(), instanceId, '.minecraft', 'servers.dat');
            if (!fs.existsSync(serversFile)) return { success: true };

            const buffer = fs.readFileSync(serversFile);
            const result: any = await parseNbt(buffer);
            const parsedNbt = result.parsed || result;

            if (parsedNbt?.value?.servers?.value?.value) {
                const serversList = parsedNbt.value.servers.value.value;
                const index = serversList.findIndex((s: any) => s.ip?.value === serverIp);
                if (index !== -1) {
                    serversList.splice(index, 1);
                    const outBuffer = nbt.writeUncompressed(parsedNbt);
                    fs.writeFileSync(serversFile, outBuffer);
                }
            }
            return { success: true };
        } catch (e: any) {
            console.error('Failed to remove server', e);
            return { success: false, error: e.message };
        }
    });
}
