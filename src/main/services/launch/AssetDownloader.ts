import * as fs from 'fs';
import * as path from 'path';
import { PathResolver } from '../utils/PathResolver';
import { DownloadManager } from '../download/DownloadManager';

export interface AssetIndex {
    objects: Record<string, { hash: string, size: number }>;
}

export class AssetDownloader {
    /**
     * Downloads the asset index and all corresponding asset objects.
     */
    public static async downloadAssets(
        assetIndexInfo: { id: string, sha1: string, size: number, url: string },
        onProgress?: (totalSize: number, downloadedSoFar: number) => void
    ): Promise<string> {
        const assetsDir = PathResolver.getAssetsDir();
        const objectsDir = PathResolver.getAssetsObjectsDir();
        const indexesDir = PathResolver.getAssetsIndexesDir();

        // Ensure directories exist
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
        if (!fs.existsSync(objectsDir)) fs.mkdirSync(objectsDir, { recursive: true });
        if (!fs.existsSync(indexesDir)) fs.mkdirSync(indexesDir, { recursive: true });

        // 1. Download the index file itself first
        const indexFilePath = path.join(indexesDir, `${assetIndexInfo.id}.json`);

        if (!fs.existsSync(indexFilePath)) {
            await DownloadManager.downloadQueue([{
                url: assetIndexInfo.url,
                destination: indexFilePath,
                sha1: assetIndexInfo.sha1,
                size: assetIndexInfo.size
            }], 1);
        }

        const indexContent = JSON.parse(fs.readFileSync(indexFilePath, 'utf-8')) as AssetIndex;
        const tasks: any[] = [];
        let totalSize = 0;

        for (const key in indexContent.objects) {
            const obj = indexContent.objects[key];
            const hash = obj.hash;
            const prefix = hash.substring(0, 2);
            const destination = path.join(objectsDir, prefix, hash);

            if (!fs.existsSync(destination)) {
                totalSize += obj.size;
                tasks.push({
                    url: `https://resources.download.minecraft.net/${prefix}/${hash}`,
                    destination,
                    sha1: hash,
                    size: obj.size
                });
            }
        }

        if (tasks.length > 0) {
            await DownloadManager.downloadQueue(tasks, 20, (downloaded) => {
                onProgress?.(totalSize, downloaded);
            });
        }

        return assetsDir;
    }
}
