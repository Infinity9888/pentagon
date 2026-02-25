import * as fs from 'fs';
import * as path from 'path';
import { HashValidator } from './HashValidator';

export interface DownloadTask {
    url: string;
    destination: string;
    sha1?: string;
    size?: number;
}

export class DownloadManager {
    /**
     * Downloads an array of tasks concurrently, skipping files that already match hashes.
     * @param tasks List of download tasks
     * @param concurrent Maximum concurrent downloads
     * @param onProgress Callback fires on progress (downloaded_bytes)
     */
    static async downloadQueue(tasks: DownloadTask[], concurrent = 6, onProgress?: (increment: number) => void): Promise<void> {
        let active = 0;
        let index = 0;
        const total = tasks.length;

        return new Promise((resolve, reject) => {
            const next = () => {
                if (index >= total && active === 0) {
                    return resolve();
                }

                while (active < concurrent && index < total) {
                    const task = tasks[index++];
                    active++;

                    this.downloadFile(task, onProgress)
                        .then(() => {
                            active--;
                            next();
                        })
                        .catch(err => {
                            console.error(`[DownloadManager] Failed to download ${task.url}`, err);
                            // We can choose to fail the whole queue or retry. For now, throw
                            reject(err);
                        });
                }
            };

            next();
        });
    }

    private static async downloadFile(task: DownloadTask, onProgress?: (inc: number) => void): Promise<void> {
        // Step 1: Check if already downloaded and valid
        if (HashValidator.validate(task.destination, task.sha1, task.size)) {
            if (onProgress && task.size) {
                onProgress(task.size);
            }
            return;
        }

        // Ensure directory exists
        const dir = path.dirname(task.destination);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const res = await fetch(task.url);
        if (!res.ok) {
            throw new Error(`Failed to fetch ${task.url}: ${res.statusText}`);
        }

        const buffer = await res.arrayBuffer();

        // Final sanity check before writing (we shouldn't save corrupted bytes if we know the size)
        if (task.size !== undefined && buffer.byteLength !== task.size) {
            throw new Error(`Size mismatch for ${task.url}. Expected ${task.size}, got ${buffer.byteLength}`);
        }

        fs.writeFileSync(task.destination, Buffer.from(buffer));

        if (task.sha1 && !HashValidator.validate(task.destination, task.sha1)) {
            fs.unlinkSync(task.destination); // Cleanup broken file
            throw new Error(`Hash mismatch for downloaded file ${task.destination}`);
        }

        if (onProgress) {
            onProgress(buffer.byteLength);
        }
    }
}
