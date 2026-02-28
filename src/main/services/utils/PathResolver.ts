import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class PathResolver {
    private static cachedDataDir: string | null = null;

    /**
     * Returns the root directory where all launcher data (instances, configs, assets) is stored.
     */
    public static getDataDir(): string {
        if (this.cachedDataDir) return this.cachedDataDir;

        // 1. Check for Portable Mode
        // We look for a ".portable" file in the directory where the executable resides
        const exeDir = path.dirname(app.getPath('exe'));
        const portableMarker = path.join(exeDir, '.portable');

        if (fs.existsSync(portableMarker)) {
            console.log('[PathResolver] Portable mode detected.');
            this.cachedDataDir = path.join(exeDir, 'data');
            this.ensureDir(this.cachedDataDir);
            return this.cachedDataDir;
        }

        // 2. Check for custom data path in settings.json (handled by SettingsService during initialization)
        // However, we need a base to even FIND settings.json.
        // So SettingsService will CALL setCustomDataDir if it finds one.

        // Default: %APPDATA%/pentagon-launcher/data
        this.cachedDataDir = path.join(app.getPath('userData'), 'data');
        this.ensureDir(this.cachedDataDir);
        return this.cachedDataDir;
    }

    public static setCustomDataDir(newPath: string) {
        if (!newPath) return;
        this.cachedDataDir = newPath;
        this.ensureDir(this.cachedDataDir);
    }

    public static getInstancesDir(): string {
        return path.join(this.getDataDir(), 'instances');
    }

    public static getVersionsDir(): string {
        return path.join(this.getDataDir(), 'versions');
    }

    public static getAssetsDir(): string {
        return path.join(this.getDataDir(), 'assets');
    }

    public static getLibrariesDir(): string {
        return path.join(this.getDataDir(), 'libraries');
    }

    public static getAssetsObjectsDir(): string {
        return path.join(this.getAssetsDir(), 'objects');
    }

    public static getAssetsIndexesDir(): string {
        return path.join(this.getAssetsDir(), 'indexes');
    }

    public static getTempDir(): string {
        const p = path.join(this.getDataDir(), 'temp');
        this.ensureDir(p);
        return p;
    }

    private static ensureDir(p: string) {
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, { recursive: true });
        }
    }
}
