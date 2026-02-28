import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { app } from 'electron';
import { InstanceManager } from './InstanceManager';
import { DownloadManager, DownloadTask } from '../download/DownloadManager';
import { ModPlatformService } from '../meta/ModPlatformService';

export class ModpackInstaller {
    /**
     * Installs a CurseForge modpack using its deep-link addonId and fileId.
     */
    public static async installCurseForgeModpack(
        addonId: string,
        fileId: string,
        onProgress: (msg: string, percent?: number) => void
    ): Promise<string> {
        onProgress('Fetching modpack details...', 5);

        let cfFile;
        try {
            cfFile = await ModPlatformService.getCurseForgeFile(addonId, fileId);
        } catch (e: any) {
            throw new Error('Failed to get modpack info from CurseForge. ' + e.message);
        }

        if (!cfFile || !cfFile.downloadUrl) {
            throw new Error('Modpack file is unavailable for download.');
        }

        const safeId = `cf_${addonId}_${fileId}`;
        const tempZipPath = path.join(app.getPath('userData'), 'data', 'temp', `${safeId}.zip`);

        // Ensure temp directory exists
        const tempDir = path.dirname(tempZipPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        onProgress(`Downloading modpack archive...`, 10);

        let lastLoggedPercent = 0;
        await DownloadManager.downloadQueue([
            {
                url: cfFile.downloadUrl,
                destination: tempZipPath,
                size: cfFile.fileLength
            }
        ], 1, (increment) => {
            // we don't track detailed downloaded bytes here for the single zip using increment directly because it's slightly messy, we'll just indicate it's downloading 
        });

        if (!fs.existsSync(tempZipPath)) {
            throw new Error('Failed to download Modpack ZIP.');
        }

        onProgress('Extracting & parsing manifest...', 30);

        const zip = new AdmZip(tempZipPath);
        const zipEntries = zip.getEntries();

        const manifestEntry = zipEntries.find(e => e.entryName === 'manifest.json');
        if (!manifestEntry) {
            fs.unlinkSync(tempZipPath);
            throw new Error('Invalid Modpack: manifest.json not found.');
        }

        let manifest: any;
        try {
            manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
        } catch (e) {
            fs.unlinkSync(tempZipPath);
            throw new Error('Invalid Modpack: manifest.json is malformed.');
        }

        const mcVersion = manifest.minecraft?.version;
        if (!mcVersion) {
            fs.unlinkSync(tempZipPath);
            throw new Error('Invalid Modpack: Minecraft version not specified.');
        }

        let forgeVersion;
        let fabricVersion;
        let neoforgeVersion;
        let loaderStr = 'vanilla';

        if (manifest.minecraft.modLoaders && manifest.minecraft.modLoaders.length > 0) {
            const loader = manifest.minecraft.modLoaders[0].id;
            const loaderVer = loader.split('-')[1] || loader;
            if (loader.startsWith('forge')) {
                forgeVersion = loaderVer;
                loaderStr = 'forge';
            } else if (loader.startsWith('fabric')) {
                fabricVersion = loaderVer;
                loaderStr = 'fabric';
            } else if (loader.startsWith('neoforge')) {
                neoforgeVersion = loaderVer;
                loaderStr = 'neoforge';
            }
        }

        const instanceName = manifest.name ? `${manifest.name} ${manifest.version}` : `CF Modpack ${addonId}`;

        onProgress(`Creating instance: ${instanceName}...`, 35);

        const config = {
            name: instanceName,
            version: {
                minecraft: mcVersion,
                ...(forgeVersion && { forge: forgeVersion }),
                ...(fabricVersion && { fabric: fabricVersion })
            }
        };

        const finalInstanceId = safeId + '_' + Date.now();
        await InstanceManager.createInstance(finalInstanceId, config);

        const instancePath = path.join(InstanceManager.getInstancesDir(), finalInstanceId);
        const modsDir = path.join(instancePath, '.minecraft', 'mods');

        onProgress('Resolving mod download links...', 40);

        const downloadTasks: DownloadTask[] = [];
        let index = 0;

        // This can be slow, resolve in batches of 10
        const filesToDownload = manifest.files || [];
        const totalMods = filesToDownload.length;

        for (let i = 0; i < totalMods; i += 10) {
            const batch = filesToDownload.slice(i, i + 10);
            await Promise.all(batch.map(async (file: any) => {
                try {
                    const projectFile = await ModPlatformService.getCurseForgeFile(file.projectID.toString(), file.fileID.toString());
                    if (projectFile.downloadUrl) {
                        downloadTasks.push({
                            url: projectFile.downloadUrl,
                            destination: path.join(modsDir, projectFile.fileName),
                            size: projectFile.fileLength
                        });
                    }
                } catch (e) {
                    console.error(`Failed to resolve mod ${file.projectID} file ${file.fileID}`, e);
                }
            }));
            const progress = 40 + Math.round(((i + batch.length) / totalMods) * 20);
            onProgress(`Resolved ${i + batch.length}/${totalMods} mods...`, progress);
        }

        onProgress(`Downloading ${downloadTasks.length} mods...`, 60);

        const totalBytes = downloadTasks.reduce((acc, t) => acc + (t.size || 0), 0);
        let downloadedBytes = 0;

        await DownloadManager.downloadQueue(downloadTasks, 4, (increment) => {
            downloadedBytes += increment;
            if (totalBytes > 0) {
                const percent = 60 + Math.round((downloadedBytes / totalBytes) * 30); // scale remaining 30% mapping to 60-90
                onProgress(`Downloading mods...`, percent);
            }
        });

        onProgress('Extracting overrides...', 90);

        const overridesFolder = manifest.overrides || 'overrides';
        const mcDir = path.join(instancePath, '.minecraft');

        // Extract overrides mapping them to .minecraft/
        for (const entry of zipEntries) {
            if (entry.entryName.startsWith(overridesFolder + '/') && !entry.isDirectory) {
                // Remove 'overrides/' from beginning
                const relativePath = entry.entryName.substring(overridesFolder.length + 1);
                const targetFilePath = path.join(mcDir, relativePath);

                // Ensure target dir exists
                fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });

                // Extract file content
                const data = entry.getData();
                fs.writeFileSync(targetFilePath, data);
            }
        }

        onProgress('Cleaning up...', 99);

        // Clean up temp zip
        try {
            fs.unlinkSync(tempZipPath);
        } catch (e) { }

        onProgress('Modpack installed successfully!', 100);
        return finalInstanceId;
    }
}
