import { contextBridge, ipcRenderer } from 'electron';

export type PentagonAPI = typeof pentagonAPI;

const pentagonAPI = {
    auth: {
        loginMSA: () => ipcRenderer.invoke('auth:login-msa'),
        loginOffline: (username: string) => ipcRenderer.invoke('auth:login-offline', username),
        getAccounts: () => ipcRenderer.invoke('auth:get-accounts'),
        removeAccount: (id: string) => ipcRenderer.invoke('auth:remove-account', id),
        setDefault: (id: string) => ipcRenderer.invoke('auth:set-default', id),
        refresh: (id: string) => ipcRenderer.invoke('auth:refresh', id),
        onAuthURL: (cb: (url: string) => void) => {
            ipcRenderer.on('auth:open-url', (_, url) => cb(url));
            return () => ipcRenderer.removeAllListeners('auth:open-url');
        },
        onDeviceCode: (cb: (data: { code: string; url: string; expiresIn: number }) => void) => {
            ipcRenderer.on('auth:device-code', (_, data) => cb(data));
            return () => ipcRenderer.removeAllListeners('auth:device-code');
        }
    },

    instances: {
        list: () => ipcRenderer.invoke('instances:list'),
        create: (config: any) => ipcRenderer.invoke('instances:create', config),
        launch: (id: string, options?: any) => ipcRenderer.invoke('instances:launch', id, options),
        kill: (id: string) => ipcRenderer.invoke('instances:kill', id),
        delete: (id: string) => ipcRenderer.invoke('instances:delete', id),
        duplicate: (id: string, newName: string) => ipcRenderer.invoke('instances:duplicate', id, newName),
        getConfig: (id: string) => ipcRenderer.invoke('instances:get-config', id),
        updateConfig: (id: string, config: any) => ipcRenderer.invoke('instances:update-config', id, config),
        openFolder: (id: string, subfolder?: string) => ipcRenderer.invoke('instances:open-folder', id, subfolder),
        listMods: (id: string) => ipcRenderer.invoke('instances:list-mods', id),
        toggleMod: (id: string, fileName: string) => ipcRenderer.invoke('instances:toggle-mod', id, fileName),
        deleteMod: (id: string, fileName: string) => ipcRenderer.invoke('instances:delete-mod', id, fileName),
        onLog: (cb: (data: { instanceId: string; line: string; level: string }) => void) => {
            ipcRenderer.on('instances:log', (_, data) => cb(data));
            return () => ipcRenderer.removeAllListeners('instances:log');
        },
        onLaunchProgress: (cb: (data: { instanceId: string; status: string; current?: number; total?: number }) => void) => {
            ipcRenderer.on('launch:progress', (_, data) => cb(data));
            return () => ipcRenderer.removeAllListeners('launch:progress');
        }
    },

    mods: {
        search: (query: string, type?: 'mod' | 'modpack', provider?: 'modrinth' | 'curseforge') => ipcRenderer.invoke('mods:search', query, type, provider),
        install: (instanceId: string, mod: any) => ipcRenderer.invoke('mods:install', instanceId, mod),
        remove: (instanceId: string, filename: string) => ipcRenderer.invoke('mods:remove', instanceId, filename),
        getInstalled: (instanceId: string) => ipcRenderer.invoke('mods:get-installed', instanceId),
        checkUpdates: (instanceId: string) => ipcRenderer.invoke('mods:check-updates', instanceId),
        toggleEnabled: (instanceId: string, filename: string) => ipcRenderer.invoke('mods:toggle', instanceId, filename)
    },

    versions: {
        getMinecraft: () => ipcRenderer.invoke('versions:get-minecraft'),
        getForge: (mcVersion: string) => ipcRenderer.invoke('versions:get-forge', mcVersion),
        getFabric: (mcVersion: string) => ipcRenderer.invoke('versions:get-fabric', mcVersion),
        getQuilt: (mcVersion: string) => ipcRenderer.invoke('versions:get-quilt', mcVersion),
        getNeoForge: (mcVersion: string) => ipcRenderer.invoke('versions:get-neoforge', mcVersion)
    },

    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (settings: any) => ipcRenderer.invoke('settings:set', settings),
        getJavaVersions: () => ipcRenderer.invoke('settings:get-java'),
        selectJavaPath: () => ipcRenderer.invoke('settings:select-java-path'),
        selectDirectory: () => ipcRenderer.invoke('settings:select-directory')
    },

    news: {
        getMinecraft: () => ipcRenderer.invoke('news:get-minecraft'),
        getGitHub: () => ipcRenderer.invoke('news:get-github')
    },

    download: {
        onProgress: (cb: (data: { taskId: string; progress: number; speed: number; file: string }) => void) => {
            ipcRenderer.on('download:progress', (_, data) => cb(data));
            return () => ipcRenderer.removeAllListeners('download:progress');
        },
        onComplete: (cb: (data: { taskId: string }) => void) => {
            ipcRenderer.on('download:complete', (_, data) => cb(data));
            return () => ipcRenderer.removeAllListeners('download:complete');
        }
    },

    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
        onMaximizedChange: (cb: (maximized: boolean) => void) => {
            ipcRenderer.on('window:maximized-changed', (_, maximized) => cb(maximized));
            return () => ipcRenderer.removeAllListeners('window:maximized-changed');
        }
    }
};

contextBridge.exposeInMainWorld('pentagon', pentagonAPI);
