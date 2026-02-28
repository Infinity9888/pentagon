import * as fs from 'fs';
import * as path from 'path';
import { InstanceManager } from './InstanceManager';
import { ModPlatformService } from '../meta/ModPlatformService';
import { DownloadManager, DownloadTask } from '../download/DownloadManager';

export class ModManager {
    /**
     * Resolves the best generic version for a mod given an instance's configuration.
     * Recursively resolves dependencies.
     */
    public static async resolveModrinthMod(slugOrId: string, instanceId: string, resolvedModIds: Set<string> = new Set(), targetVersionId?: string): Promise<DownloadTask[]> {
        if (resolvedModIds.has(slugOrId)) {
            return []; // Prevent infinite loops
        }
        resolvedModIds.add(slugOrId);

        const config = await InstanceManager.getConfig(instanceId);

        // Determine loaders (fabric, forge, quilt, neoforge, etc.)
        const loaders: string[] = [];
        if (config.version.fabric) loaders.push('fabric');
        if (config.version.forge) loaders.push('forge');

        // Some mods specify 'quilt' but are compatible with fabric, or vice-versa, but we'll be strict for now
        // If no modloader is defined, it might be a vanilla instance (which shouldn't have mods, but theoretically could have datapacks)
        if (loaders.length === 0) {
            throw new Error(`Instance ${config.name} does not have a supported modloader (Fabric/Forge) configured.`);
        }

        const gameVersions = [config.version.minecraft];

        console.log(`[ModManager] Resolving mod: ${slugOrId} for mc ${gameVersions[0]} loaders ${loaders.join(',')}`);
        const versions = await ModPlatformService.getModrinthVersions(slugOrId, loaders, gameVersions);
        console.log(`[ModManager] Found ${versions?.length || 0} versions for ${slugOrId}`);

        if (!versions || versions.length === 0) {
            throw new Error(`No compatible version found for ${slugOrId} on ${config.version.minecraft} with ${loaders.join(', ')}.`);
        }

        let bestVersion;
        if (targetVersionId) {
            bestVersion = versions.find((v: any) => v.id === targetVersionId);
            if (!bestVersion) throw new Error(`Selected version ${targetVersionId} not found or incompatible.`);
        } else {
            bestVersion = versions[0];
        }

        const primaryFile = bestVersion.files.find((f: any) => f.primary) || bestVersion.files[0];

        if (!primaryFile) {
            throw new Error(`No downloadable file found for ${slugOrId} version ${bestVersion.version_number}.`);
        }

        const tasks: DownloadTask[] = [];
        const modsDir = path.join(InstanceManager.getInstancesDir(), instanceId, '.minecraft', 'mods');

        tasks.push({
            url: primaryFile.url,
            destination: path.join(modsDir, primaryFile.filename),
            sha1: primaryFile.hashes.sha1,
            size: primaryFile.size
        });

        // Resolve dependencies
        if (bestVersion.dependencies && bestVersion.dependencies.length > 0) {
            for (const dep of bestVersion.dependencies) {
                // Dependency type 'required' is what we care about mostly
                if (dep.dependency_type === 'required' && dep.project_id) {
                    try {
                        console.log(`Resolving required dependency ${dep.project_id} for ${slugOrId}...`);
                        const depTasks = await this.resolveModrinthMod(dep.project_id, instanceId, resolvedModIds);
                        tasks.push(...depTasks);
                    } catch (e) {
                        console.error(`Failed to resolve dependency ${dep.project_id} for ${slugOrId}:`, e);
                        // Depending on strictness, we might throw here or just skip. We'll skip for now.
                    }
                }
            }
        }

        return tasks;
    }

    /**
     * Entry point to install a mod via the UI
     */
    public static async installModrinthMod(slugOrId: string, instanceId: string, fileId?: string, onProgress?: (msg: string) => void): Promise<void> {
        if (onProgress) onProgress(`Resolving dependencies for ${slugOrId}...`);

        const tasks = await this.resolveModrinthMod(slugOrId, instanceId, new Set(), fileId);

        // Deduplicate tasks by URL to prevent downloading the same dependency multiple times
        const uniqueTasks = Array.from(new Map(tasks.map(t => [t.url, t])).values());

        if (onProgress) onProgress(`Downloading ${uniqueTasks.length} files...`);

        let downloadedBytes = 0;
        const totalBytes = uniqueTasks.reduce((acc, t) => acc + (t.size || 0), 0);

        await DownloadManager.downloadQueue(uniqueTasks, 4, (increment) => {
            downloadedBytes += increment;
            if (onProgress && totalBytes > 0) {
                const percent = Math.round((downloadedBytes / totalBytes) * 100);
                onProgress(`Downloading... ${percent}%`);
            }
        });

        if (onProgress) onProgress(`Install complete.`);
    }

    /**
     * Resolves the best version for a CurseForge mod given an instance's configuration.
     * Recursively resolves dependencies.
     */
    public static async resolveCurseForgeMod(modId: string, instanceId: string, resolvedModIds: Set<string> = new Set(), targetFileId?: string): Promise<DownloadTask[]> {
        if (resolvedModIds.has(modId)) {
            return [];
        }
        resolvedModIds.add(modId);

        const config = await InstanceManager.getConfig(instanceId);

        // Map to CurseForge loader IDs: 1=Forge, 4=Fabric, 5=Quilt, 6=NeoForge
        let loaderType: number | undefined;
        if (config.version.fabric) loaderType = 4;
        else if (config.version.forge) loaderType = 1;

        if (loaderType === undefined) {
            throw new Error(`Instance ${config.name} does not have a supported modloader configured for CurseForge.`);
        }

        console.log(`[ModManager] Resolving CF mod: ${modId} for mc ${config.version.minecraft} loader ${loaderType}`);
        const files = await ModPlatformService.getCurseForgeModFiles(modId, config.version.minecraft, loaderType);
        console.log(`[ModManager] Found ${files?.length || 0} files for CF mod ${modId}`);

        if (!files || files.length === 0) {
            throw new Error(`No compatible version found for CurseForge mod ${modId} on ${config.version.minecraft}.`);
        }

        let bestFile;
        if (targetFileId) {
            bestFile = files.find((f: any) => f.id.toString() === targetFileId.toString());
            if (!bestFile) throw new Error(`Selected file ${targetFileId} not found or incompatible.`);
        } else {
            bestFile = files[0];
        }

        if (!bestFile.downloadUrl) {
            throw new Error(`Автор мода ${modId} запретил стороннее скачивание файла. Установите его вручную с сайта CurseForge.`);
        }

        const tasks: DownloadTask[] = [];
        const modsDir = path.join(InstanceManager.getInstancesDir(), instanceId, '.minecraft', 'mods');

        // CF hashes array often contains algo: 1 (sha1) and 2 (md5)
        const sha1Obj = bestFile.hashes?.find((h: any) => h.algo === 1);

        tasks.push({
            url: bestFile.downloadUrl,
            destination: path.join(modsDir, bestFile.fileName),
            sha1: sha1Obj ? sha1Obj.value : undefined,
            size: bestFile.fileLength
        });

        // Resolve CF dependencies
        if (bestFile.dependencies && bestFile.dependencies.length > 0) {
            for (const dep of bestFile.dependencies) {
                // relationType === 3 means RequiredDependency
                if (dep.relationType === 3 && dep.modId) {
                    try {
                        console.log(`Resolving required CF dependency ${dep.modId} for ${modId}...`);
                        const depTasks = await this.resolveCurseForgeMod(dep.modId.toString(), instanceId, resolvedModIds);
                        tasks.push(...depTasks);
                    } catch (e) {
                        console.error(`Failed to resolve CF dependency ${dep.modId} for ${modId}:`, e);
                    }
                }
            }
        }

        return tasks;
    }

    /**
     * Entry point to install a CurseForge mod via the UI
     */
    public static async installCurseForgeMod(modId: string, instanceId: string, fileId?: string, onProgress?: (msg: string) => void): Promise<void> {
        if (onProgress) onProgress(`Resolving dependencies for ${modId}...`);

        const tasks = await this.resolveCurseForgeMod(modId, instanceId, new Set(), fileId);
        const uniqueTasks = Array.from(new Map(tasks.map(t => [t.url, t])).values());

        if (onProgress) onProgress(`Downloading ${uniqueTasks.length} files...`);

        let downloadedBytes = 0;
        const totalBytes = uniqueTasks.reduce((acc, t) => acc + (t.size || 0), 0);

        await DownloadManager.downloadQueue(uniqueTasks, 4, (increment) => {
            downloadedBytes += increment;
            if (onProgress && totalBytes > 0) {
                const percent = Math.round((downloadedBytes / totalBytes) * 100);
                onProgress(`Downloading... ${percent}%`);
            }
        });

        if (onProgress) onProgress(`Install complete.`);
    }

    /**
     * Get a list of files that match the instance's Minecraft version and modloader.
     */
    public static async getCompatibleModFiles(modIdOrSlug: string, instanceId: string, provider: 'modrinth' | 'curseforge'): Promise<any[]> {
        const config = await InstanceManager.getConfig(instanceId);

        if (provider === 'modrinth') {
            const loaders: string[] = [];
            if (config.version.fabric) loaders.push('fabric');
            if (config.version.forge) loaders.push('forge');
            if (loaders.length === 0) return [];

            return await ModPlatformService.getModrinthVersions(modIdOrSlug, loaders, [config.version.minecraft]);
        } else {
            let loaderType: number | undefined;
            if (config.version.fabric) loaderType = 4;
            else if (config.version.forge) loaderType = 1;

            if (loaderType === undefined) return [];
            return await ModPlatformService.getCurseForgeModFiles(modIdOrSlug, config.version.minecraft, loaderType);
        }
    }
}
