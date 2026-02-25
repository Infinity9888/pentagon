import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { DownloadManager, DownloadTask } from '../download/DownloadManager';

export interface AssetIndex {
    objects: {
        [key: string]: {
            hash: string;
            size: number;
        }
    }
}

export class AssetDownloader {
    static get assetsDir(): string {
        const p = path.join(app.getPath('userData'), 'data', 'assets');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        return p;
    }

    /**
     * Downloads the asset index and all corresponding asset objects.
     */
    static async downloadAssets(
        assetIndexInfo: { id: string, sha1: string, size: number, url: string },
        onProgress?: (totalSize: number, downloadedSoFar: number) => void
    ): Promise<string> {
        // 1. Download the index file itself first
        const indexesDir = path.join(this.assetsDir, 'indexes');
        if (!fs.existsSync(indexesDir)) fs.mkdirSync(indexesDir, { recursive: true });

        const indexFilePath = path.join(indexesDir, `${assetIndexInfo.id}.json`);

        await DownloadManager.downloadQueue([{
            url: assetIndexInfo.url,
            destination: indexFilePath,
            sha1: assetIndexInfo.sha1,
            size: assetIndexInfo.size
        }], 1); // Serial download for the index

        // 2. Parse the index
        const indexContent = fs.readFileSync(indexFilePath, 'utf-8');
        const assetIndex = JSON.parse(indexContent) as AssetIndex;

        // 3. Build download queue for all objects
        const objectsDir = path.join(this.assetsDir, 'objects');
        if (!fs.existsSync(objectsDir)) fs.mkdirSync(objectsDir, { recursive: true });

        const downloadTasks: DownloadTask[] = [];
        let totalSize = 0;

        for (const [key, obj] of Object.entries(assetIndex.objects)) {
            const hash = obj.hash;
            const folder = hash.substring(0, 2);

            const destPath = path.join(objectsDir, folder, hash);
            const downloadUrl = `https://resources.download.minecraft.net/${folder}/${hash}`;

            downloadTasks.push({
                url: downloadUrl,
                destination: destPath,
                sha1: hash,
                size: obj.size
            });

            totalSize += obj.size;
        }

        // 4. Fire concurrent download (using more concurrency since these are thousands of tiny files)
        let downloadedSoFar = 0;
        await DownloadManager.downloadQueue(downloadTasks, 20, (inc) => {
            downloadedSoFar += inc;
            if (onProgress) onProgress(totalSize, downloadedSoFar);
        });

        // 5. Return the absolute path to the assets root
        return this.assetsDir;
    }
}
