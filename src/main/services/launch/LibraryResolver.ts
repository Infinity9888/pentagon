import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as AdmZip from 'adm-zip';
import { DownloadManager, DownloadTask } from '../download/DownloadManager';
import * as os from 'os';

export class LibraryResolver {
    static get librariesDir(): string {
        const p = path.join(app.getPath('userData'), 'data', 'libraries');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
    }

    /**
     * Resolves needed libraries from version json, downloads them, and extracts natives.
     * @returns Array of absolute paths to the downloaded library .jar files
     */
    static async resolveLibraries(
        versionJson: any,
        instanceNativesDir: string,
        onProgress?: (totalSize: number, current: number) => void
    ): Promise<string[]> {
        const platform = this.getCurrentPlatform();
        const arch = os.arch() === 'x64' ? '64' : '32'; // simplify for natives

        const neededLibraries: any[] = [];
        const requiredDownloadTasks: DownloadTask[] = [];
        const classpathPaths: string[] = [];

        // 1. Filter libraries by OS rules
        for (const lib of versionJson.libraries) {
            if (this.isLibraryAllowed(lib.rules, platform)) {
                neededLibraries.push(lib);
            }
        }

        // 2. Build download queues for generic JARs and native DLLs
        let totalSize = 0;
        const extractTasks: { jarPath: string, extractRules?: any }[] = [];

        for (const lib of neededLibraries) {
            // Standard library payload
            if (lib.downloads?.artifact) {
                const artifact = lib.downloads.artifact;
                const destPath = path.join(this.librariesDir, artifact.path);
                requiredDownloadTasks.push({
                    url: artifact.url,
                    destination: destPath,
                    sha1: artifact.sha1,
                    size: artifact.size
                });
                classpathPaths.push(destPath);
                totalSize += artifact.size || 0;
            }

            // Native classifiers (LWJGL etc.)
            if (lib.natives) {
                // Determine native classifier for OS
                let nativeClassifier = lib.natives[platform];
                if (nativeClassifier) {
                    // Replace ${arch} variables (e.g. natives-windows-${arch})
                    nativeClassifier = nativeClassifier.replace('${arch}', arch);

                    const nativeArtifact = lib.downloads?.classifiers?.[nativeClassifier];
                    if (nativeArtifact) {
                        const destPath = path.join(this.librariesDir, nativeArtifact.path);
                        requiredDownloadTasks.push({
                            url: nativeArtifact.url,
                            destination: destPath,
                            sha1: nativeArtifact.sha1,
                            size: nativeArtifact.size
                        });
                        totalSize += nativeArtifact.size || 0;

                        // Queue for extraction
                        extractTasks.push({
                            jarPath: destPath,
                            extractRules: lib.extract
                        });
                    }
                }
            }
        }

        // 3. Download everything concurrently
        let downloadedSoFar = 0;
        await DownloadManager.downloadQueue(requiredDownloadTasks, 8, (inc) => {
            downloadedSoFar += inc;
            if (onProgress) onProgress(totalSize, downloadedSoFar);
        });

        // 4. Extract natives
        this.extractNatives(extractTasks, instanceNativesDir);

        return classpathPaths;
    }

    private static isLibraryAllowed(rules: any[], currentPlatform: string): boolean {
        if (!rules || rules.length === 0) return true;

        let allowed = false;
        for (const rule of rules) {
            const match = rule.os ? rule.os.name === currentPlatform : true;
            if (match) {
                allowed = rule.action === 'allow';
            }
        }
        return allowed;
    }

    private static extractNatives(tasks: { jarPath: string, extractRules?: any }[], destDir: string) {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        for (const task of tasks) {
            try {
                const zip = new AdmZip(task.jarPath);
                const zipEntries = zip.getEntries();

                const exclusions = task.extractRules?.exclude || [];

                zipEntries.forEach((entry) => {
                    // Ignore directories and META-INF
                    if (entry.isDirectory) return;

                    // Check exclusions
                    for (const excl of exclusions) {
                        if (entry.entryName.startsWith(excl)) return;
                    }

                    // Extract the file (typically a .dll)
                    zip.extractEntryTo(entry, destDir, false, true);
                });
            } catch (e) {
                console.error(`[LibraryResolver] Failed to extract ${task.jarPath}`, e);
            }
        }
    }

    private static getCurrentPlatform(): string {
        switch (os.platform()) {
            case 'win32': return 'windows';
            case 'darwin': return 'osx';
            case 'linux': return 'linux';
            default: return 'unknown';
        }
    }
}
