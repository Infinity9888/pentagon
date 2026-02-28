import * as fs from 'fs';
import * as path from 'path';
import { PathResolver } from '../utils/PathResolver';
import AdmZip from 'adm-zip';
import { DownloadManager, DownloadTask } from '../download/DownloadManager';
import * as os from 'os';

export class LibraryResolver {
    /**
     * Resolves needed libraries from version json, downloads them, and extracts natives.
     * @returns Array of absolute paths to the downloaded library .jar files
     */
    public static async resolveLibraries(
        versionJson: any,
        nativesDir: string,
        onProgress?: (totalSize: number, current: number) => void
    ): Promise<string[]> {
        const librariesDir = PathResolver.getLibrariesDir();
        const platform = this.getCurrentPlatform();
        const arch = os.arch() === 'x64' ? '64' : '32';

        const requiredDownloadTasks: DownloadTask[] = [];
        const classpathPaths: string[] = [];

        for (const lib of versionJson.libraries) {
            if (!this.isAllowed(lib.rules, platform)) continue;

            const artifact = lib.downloads?.artifact;
            if (artifact) {
                const dest = path.join(librariesDir, artifact.path);
                classpathPaths.push(dest);
                if (!fs.existsSync(dest)) {
                    requiredDownloadTasks.push({
                        url: artifact.url,
                        destination: dest,
                        sha1: artifact.sha1,
                        size: artifact.size
                    });
                }
            }

            // Natives
            const nativeClassifier = lib.natives?.[platform]?.replace('${arch}', arch);
            if (nativeClassifier) {
                const nativeArtifact = lib.downloads?.classifiers?.[nativeClassifier];
                if (nativeArtifact) {
                    const dest = path.join(librariesDir, nativeArtifact.path);
                    if (!fs.existsSync(dest)) {
                        requiredDownloadTasks.push({
                            url: nativeArtifact.url,
                            destination: dest,
                            sha1: nativeArtifact.sha1,
                            size: nativeArtifact.size,
                            extractTo: nativesDir // Custom field for auto-extraction
                        });
                    } else {
                        // Already exists, just extract
                        this.extractNative(dest, nativesDir);
                    }
                }
            }
        }

        if (requiredDownloadTasks.length > 0) {
            let total = 0;
            requiredDownloadTasks.forEach(t => total += t.size || 0);

            await DownloadManager.downloadQueue(requiredDownloadTasks, 10, (current) => {
                onProgress?.(total, current);
            });

            // Extract downloaded natives
            for (const task of requiredDownloadTasks) {
                if (task.extractTo) {
                    this.extractNative(task.destination, task.extractTo);
                }
            }
        }

        return classpathPaths;
    }

    private static isAllowed(rules: any[], platform: string): boolean {
        if (!rules) return true;
        let allowed = false;
        for (const rule of rules) {
            const action = rule.action === 'allow';
            const osMatch = !rule.os || rule.os.name === platform;
            if (osMatch) allowed = action;
        }
        return allowed;
    }

    private static getCurrentPlatform(): string {
        const p = os.platform();
        if (p === 'win32') return 'windows';
        if (p === 'darwin') return 'osx';
        if (p === 'linux') return 'linux';
        return 'unknown';
    }

    private static extractNative(zipPath: string, destDir: string) {
        try {
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(destDir, true);
        } catch (e) {
            console.error(`Failed to extract native ${zipPath}:`, e);
        }
    }
}
