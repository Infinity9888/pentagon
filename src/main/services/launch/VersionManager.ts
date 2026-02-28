import * as fs from 'fs';
import * as path from 'path';
import { PathResolver } from '../utils/PathResolver';

const MOJANG_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

export interface VersionInfo {
    id: string;
    type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
    url: string;
    time: string;
    releaseTime: string;
    sha1: string;
    complianceLevel: number;
}

export interface VersionManifest {
    latest: {
        release: string;
        snapshot: string;
    };
    versions: VersionInfo[];
}

export class VersionManager {
    static get versionsDir(): string {
        return PathResolver.getVersionsDir();
    }

    /**
     * Fetch the master version manifest (v2) from Mojang
     */
    static async fetchManifest(): Promise<VersionManifest> {
        const response = await fetch(MOJANG_MANIFEST_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch version manifest: ${response.statusText}`);
        }

        const manifest = await response.json() as VersionManifest;

        // Cache the manifest locally
        const manifestPath = path.join(this.versionsDir, 'version_manifest_v2.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

        return manifest;
    }

    /**
     * Get local cached manifest, or fetch if absent
     */
    static async getManifest(): Promise<VersionManifest> {
        const manifestPath = path.join(this.versionsDir, 'version_manifest_v2.json');

        if (fs.existsSync(manifestPath)) {
            try {
                // Fetch in background for freshness, but return local immediately if exists and valid
                this.fetchManifest().catch(e => console.error('[VersionManager] Background manifest update failed:', e));

                const data = fs.readFileSync(manifestPath, 'utf-8');
                return JSON.parse(data) as VersionManifest;
            } catch (e) {
                // File corrupted, ignore and re-fetch
            }
        }

        return await this.fetchManifest();
    }

    /**
     * Fetches the detailed JSON for a specific version (e.g. 1.20.1)
     */
    static async getVersionDetails(versionId: string): Promise<any> {
        const versionDir = path.join(this.versionsDir, versionId);
        const versionJsonPath = path.join(versionDir, `${versionId}.json`);

        // If we already have it locally, return it
        if (fs.existsSync(versionJsonPath)) {
            try {
                const data = fs.readFileSync(versionJsonPath, 'utf-8');
                return JSON.parse(data);
            } catch (e) {
                console.warn(`[VersionManager] Local version json for ${versionId} is corrupted, re-fetching.`);
            }
        }

        // We need the URL from the master manifest
        const manifest = await this.getManifest();
        const vInfo = manifest.versions.find(v => v.id === versionId);
        if (!vInfo) {
            throw new Error(`Version ${versionId} not found in official manifest`);
        }

        const res = await fetch(vInfo.url);
        if (!res.ok) {
            throw new Error(`Failed to fetch version JSON for ${versionId}: ${res.statusText}`);
        }

        const details = await res.json();

        // Save to cache
        if (!fs.existsSync(versionDir)) fs.mkdirSync(versionDir, { recursive: true });
        fs.writeFileSync(versionJsonPath, JSON.stringify(details, null, 2), 'utf-8');

        return details;
    }
}
