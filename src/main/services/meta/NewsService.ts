import { net } from 'electron';

export interface MinecraftNewsArticle {
    title: string;
    description: string;
    category: string;
    date: string;
    url: string;
    imageUrl: string;
}

export interface ReleaseArtifact {
    name: string;
    downloadUrl: string;
    size: number;
}

export interface GitHubRelease {
    version: string;
    name: string;
    body: string;
    date: string;
    url: string;
    assets: ReleaseArtifact[];
}

export class NewsService {
    // Current package version to compare against GitHub releases
    private static readonly CURRENT_VERSION = '0.2.1';

    /**
     * Generic helper to fetch JSON from a URL via electron.net.
     */
    private static fetchJSON(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = net.request(url);
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

    /**
     * Fetch the latest Minecraft Java Edition news.
     * Primary: v2/javaPatchNotes.json (actively updated — snapshots, pre-releases, full releases)
     * Fallback: v1/news.json (stale since early 2024, but has general Mojang news)
     */
    public static async fetchMinecraftNews(): Promise<MinecraftNewsArticle[]> {
        try {
            // 1. Fetch Java patch notes (primary, always fresh)
            const patchNotes = await this.fetchJSON('https://launchercontent.mojang.com/v2/javaPatchNotes.json');
            const articles: MinecraftNewsArticle[] = [];

            if (patchNotes?.entries && Array.isArray(patchNotes.entries)) {
                for (const entry of patchNotes.entries) {
                    const isRelease = entry.type === 'release';
                    articles.push({
                        title: entry.title || 'Untitled',
                        description: entry.shortText || '',
                        category: isRelease ? '🟢 Release' : '🔶 Snapshot',
                        date: entry.date || new Date().toISOString(),
                        url: `https://minecraft.net/article/minecraft-java-edition-${(entry.version || '').replace(/\./g, '-')}`,
                        imageUrl: entry.image?.url
                            ? `https://launchercontent.mojang.com${entry.image.url}`
                            : ''
                    });
                }
            }

            // Sort by date (newest first) and limit
            articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return articles.slice(0, 20);

        } catch (e) {
            console.error('Failed to fetch v2 Java patch notes, trying v1 fallback:', e);

            // Fallback: v1 general news (stale but better than nothing)
            try {
                const parsed = await this.fetchJSON('https://launchercontent.mojang.com/news.json');
                if (parsed?.entries) {
                    return parsed.entries
                        .map((entry: any) => ({
                            title: entry.title || 'Untitled',
                            description: entry.text || entry.tagLine || '',
                            category: entry.category || 'News',
                            date: entry.date || new Date().toISOString(),
                            url: entry.readMoreLink || `https://minecraft.net/en-us/article/${entry.id}`,
                            imageUrl: entry.playPageImage?.url
                                ? `https://launchercontent.mojang.com${entry.playPageImage.url}`
                                : ''
                        }))
                        .sort((a: MinecraftNewsArticle, b: MinecraftNewsArticle) =>
                            new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 20);
                }
            } catch (fallbackErr) {
                console.error('Fallback v1 news also failed:', fallbackErr);
            }

            return [];
        }
    }

    /**
     * Simple semver comparison: returns true if remote > local.
     */
    private static isNewerVersion(remote: string, local: string): boolean {
        const r = remote.replace(/^v/, '').split('.').map(Number);
        const l = local.replace(/^v/, '').split('.').map(Number);
        for (let i = 0; i < Math.max(r.length, l.length); i++) {
            const rv = r[i] || 0;
            const lv = l[i] || 0;
            if (rv > lv) return true;
            if (rv < lv) return false;
        }
        return false;
    }

    /**
     * Fetch the latest releases from our GitHub repository.
     * Uses the public GitHub API (no auth token needed for public repos, 60 req/hr limit).
     */
    public static async fetchGitHubReleases(): Promise<{ releases: GitHubRelease[], updateAvailable: boolean, currentVersion: string }> {
        return new Promise((resolve) => {
            const request = net.request({
                method: 'GET',
                url: 'https://api.github.com/repos/Infinity9888/pentagon/releases',
            });

            request.setHeader('Accept', 'application/vnd.github.v3+json');
            request.setHeader('User-Agent', 'Pentagon-Launcher/' + this.CURRENT_VERSION);

            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);

                        if (!Array.isArray(parsed)) {
                            console.warn('GitHub API returned non-array:', data.substring(0, 200));
                            resolve({ releases: [], updateAvailable: false, currentVersion: this.CURRENT_VERSION });
                            return;
                        }

                        const releases: GitHubRelease[] = parsed.map((rel: any) => ({
                            version: (rel.tag_name || '').replace(/^v/, ''),
                            name: rel.name || rel.tag_name || 'Untitled Release',
                            body: rel.body || '',
                            date: rel.published_at || rel.created_at || new Date().toISOString(),
                            url: rel.html_url || '',
                            assets: (rel.assets || []).map((a: any) => ({
                                name: a.name || '',
                                downloadUrl: a.browser_download_url || '',
                                size: a.size || 0
                            }))
                        }));

                        const latestVersion = releases.length > 0 ? releases[0].version : this.CURRENT_VERSION;
                        const updateAvailable = this.isNewerVersion(latestVersion, this.CURRENT_VERSION);

                        resolve({
                            releases,
                            updateAvailable,
                            currentVersion: this.CURRENT_VERSION
                        });
                    } catch (e) {
                        console.error('Failed to parse GitHub releases:', e);
                        resolve({ releases: [], updateAvailable: false, currentVersion: this.CURRENT_VERSION });
                    }
                });
            });

            request.on('error', (err) => {
                console.error('Net request error for GitHub Releases:', err);
                resolve({ releases: [], updateAvailable: false, currentVersion: this.CURRENT_VERSION });
            });

            request.end();
        });
    }
}
