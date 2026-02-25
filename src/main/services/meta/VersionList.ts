import { net } from 'electron';

export interface VersionManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: Array<{
        id: string;
        type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
        url: string;
        time: string;
        releaseTime: string;
    }>;
}

export interface FabricLoader {
    version: string;
    stable: boolean;
}

export class VersionList {
    private static mojangManifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
    private static fabricMetaUrl = 'https://meta.fabricmc.net/v2/versions/loader';

    public static async getMinecraftVersions(): Promise<VersionManifest> {
        return new Promise((resolve, reject) => {
            const request = net.request(this.mojangManifestUrl);
            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            request.on('error', reject);
            request.end();
        });
    }

    public static async getFabricLoaders(mcVersion?: string): Promise<FabricLoader[]> {
        const url = mcVersion ? `${this.fabricMetaUrl}/${mcVersion}` : this.fabricMetaUrl;
        return new Promise((resolve, reject) => {
            const request = net.request(url);
            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    try {
                        // Sometimes the API returns plain arrays or wrapper objects
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed)) {
                            resolve(parsed.map((p: any) => ({
                                version: p.loader?.version || p.version,
                                stable: p.loader?.stable ?? true
                            })));
                        } else {
                            resolve([]);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            request.on('error', reject);
            request.end();
        });
    }

    // placeholder for forge if needed later, but standardizing primarily on vanilla & fabric first
}
