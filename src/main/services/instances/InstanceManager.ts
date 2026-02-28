import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface InstanceConfig {
    name: string;
    icon?: string;
    lastLaunchTime?: number;
    playTime?: number;
    javaSettings?: {
        minMemory: number;
        maxMemory: number;
        javaPath: string;
        jvmArguments: string;
    };
    version: {
        minecraft: string;
        fabric?: string;
        forge?: string;
    };
}

export class InstanceManager {
    public static getDataDir(): string {
        return path.join(app.getPath('userData'), 'data');
    }

    public static getInstancesDir(): string {
        return path.join(this.getDataDir(), 'instances');
    }

    public static async createInstance(id: string, config: InstanceConfig): Promise<void> {
        const instancesDir = this.getInstancesDir();
        if (!fs.existsSync(instancesDir)) {
            fs.mkdirSync(instancesDir, { recursive: true });
        }

        // Sanitize id to be a valid folder name
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const instancePath = path.join(instancesDir, safeId);

        if (fs.existsSync(instancePath)) {
            throw new Error(`Instance directory ${safeId} already exists.`);
        }

        fs.mkdirSync(instancePath, { recursive: true });

        // Create standard subdirectories
        fs.mkdirSync(path.join(instancePath, '.minecraft'));
        fs.mkdirSync(path.join(instancePath, '.minecraft', 'mods'));
        fs.mkdirSync(path.join(instancePath, '.minecraft', 'resourcepacks'));
        fs.mkdirSync(path.join(instancePath, '.minecraft', 'saves'));

        // Save instance.json
        const configPath = path.join(instancePath, 'instance.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    public static async getInstances(): Promise<Array<{ id: string, config: InstanceConfig }>> {
        const instancesDir = this.getInstancesDir();
        if (!fs.existsSync(instancesDir)) {
            return [];
        }

        const list: Array<{ id: string, config: InstanceConfig }> = [];
        const entries = fs.readdirSync(instancesDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const configPath = path.join(instancesDir, entry.name, 'instance.json');
                if (fs.existsSync(configPath)) {
                    try {
                        const content = fs.readFileSync(configPath, 'utf-8');
                        const config: InstanceConfig = JSON.parse(content);
                        list.push({ id: entry.name, config });
                    } catch (e) {
                        console.error(`Failed to read config for instance: ${entry.name}`, e);
                    }
                }
            }
        }

        return list;
    }

    public static async updateInstanceConfig(id: string, config: InstanceConfig): Promise<void> {
        const instancePath = path.join(this.getInstancesDir(), id);
        const configPath = path.join(instancePath, 'instance.json');

        if (fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        } else {
            throw new Error(`Instance config not found for ${id}`);
        }
    }

    public static async getConfig(id: string): Promise<InstanceConfig> {
        const instancePath = path.join(this.getInstancesDir(), id);
        const configPath = path.join(instancePath, 'instance.json');

        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
        } else {
            throw new Error(`Instance config not found for ${id}`);
        }
    }

    public static async listMods(id: string): Promise<Array<{ name: string, fileName: string, enabled: boolean }>> {
        const modsDir = path.join(this.getInstancesDir(), id, '.minecraft', 'mods');
        if (!fs.existsSync(modsDir)) {
            return [];
        }

        const mods: Array<{ name: string, fileName: string, enabled: boolean }> = [];
        const entries = fs.readdirSync(modsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile() && (entry.name.endsWith('.jar') || entry.name.endsWith('.jar.disabled'))) {
                const enabled = !entry.name.endsWith('.disabled');
                mods.push({
                    name: entry.name.replace('.jar.disabled', '').replace('.jar', ''),
                    fileName: entry.name,
                    enabled
                });
            }
        }

        return mods;
    }

    public static async toggleMod(id: string, fileName: string): Promise<void> {
        const modsDir = path.join(this.getInstancesDir(), id, '.minecraft', 'mods');
        const oldPath = path.join(modsDir, fileName);
        if (!fs.existsSync(oldPath)) return;

        const isCurrentlyDisabled = fileName.endsWith('.disabled');
        const newFileName = isCurrentlyDisabled ? fileName.replace('.disabled', '') : `${fileName}.disabled`;
        const newPath = path.join(modsDir, newFileName);

        fs.renameSync(oldPath, newPath);
    }

    public static async deleteMod(id: string, fileName: string): Promise<void> {
        const modPath = path.join(this.getInstancesDir(), id, '.minecraft', 'mods', fileName);
        if (fs.existsSync(modPath)) {
            fs.unlinkSync(modPath);
        }
    }

    public static async deleteInstance(id: string): Promise<void> {
        const instancePath = path.join(this.getInstancesDir(), id);
        if (fs.existsSync(instancePath)) {
            fs.rmSync(instancePath, { recursive: true, force: true });
        } else {
            throw new Error(`Instance not found: ${id}`);
        }
    }

    public static async installLocalFiles(files: string[]): Promise<void> {
        const instances = await this.getInstances();
        if (instances.length === 0) {
            throw new Error('No instances found to install files to. Please create an instance first.');
        }

        // Find the most recently used instance, or default to the first one
        const targetInstance = instances.sort((a, b) => {
            const timeA = a.config.lastLaunchTime || 0;
            const timeB = b.config.lastLaunchTime || 0;
            return timeB - timeA;
        })[0];

        const targetPath = path.join(this.getInstancesDir(), targetInstance.id, '.minecraft');

        for (const filePath of files) {
            const ext = path.extname(filePath).toLowerCase();
            const fileName = path.basename(filePath);

            if (ext === '.jar') {
                const modsDir = path.join(targetPath, 'mods');
                if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });
                fs.copyFileSync(filePath, path.join(modsDir, fileName));
            } else if (ext === '.zip') {
                const rpDir = path.join(targetPath, 'resourcepacks');
                if (!fs.existsSync(rpDir)) fs.mkdirSync(rpDir, { recursive: true });
                fs.copyFileSync(filePath, path.join(rpDir, fileName));
            } else {
                console.warn(`Skipping unsupported file type: ${fileName}`);
            }
        }
    }

    public static async addLocalMods(id: string, files: string[]): Promise<void> {
        const instancesDir = this.getInstancesDir();
        const modsDir = path.join(instancesDir, id, '.minecraft', 'mods');
        if (!fs.existsSync(modsDir)) {
            fs.mkdirSync(modsDir, { recursive: true });
        }

        for (const filePath of files) {
            const fileName = path.basename(filePath);
            fs.copyFileSync(filePath, path.join(modsDir, fileName));
        }
    }
}
