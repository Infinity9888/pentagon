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
    private static CURRENT_VERSION = '0.1.0';

    /**
     * Fetch the latest news from Mojang's launcher API.
     */
    public static async fetchMinecraftNews(): Promise<MinecraftNewsArticle[]> {
        return new Promise((resolve, reject) => {
            // Using the known endpoint from Prism/vanilla launcher for news
            const request = net.request('https://launchercontent.mojang.com/news.json');

            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed && parsed.entries) {
                            const articles = parsed.entries.map((entry: any) => ({
                                title: entry.title || 'Untitled',
                                description: entry.text || entry.tagLine || '',
                                category: entry.category || 'News',
                                date: entry.date || new Date().toISOString(),
                                url: entry.readMoreLink || `https://minecraft.net/en-us/article/${entry.id}`,
                                imageUrl: entry.playPageImage?.url
                                    ? `https://launchercontent.mojang.com${entry.playPageImage.url}`
                                    : ''
                            }));
                            resolve(articles);
                        } else {
                            resolve([]);
                        }
                    } catch (e) {
                        console.error('Failed to parse Minecraft news:', e);
                        resolve([]);
                    }
                });
            });

            request.on('error', (err) => {
                console.error('Net request error for MC News:', err);
                resolve([]);
            });

            request.end();
        });
    }

    /**
     * Fetch the latest releases from our GitHub repository.
     * Currently mocked to always show a shiny "update available" 
     * scenario for demonstration purposes per the implementation plan.
     */
    public static async fetchGitHubReleases(): Promise<{ releases: GitHubRelease[], updateAvailable: boolean, currentVersion: string }> {
        // TODO: Replace with actual GitHub API call:
        // const request = net.request('https://api.github.com/repos/YOUR_ORG/pentagon-launcher/releases');

        // Mocking an update scenario!
        const mockReleases: GitHubRelease[] = [
            {
                version: '0.2.0',
                name: 'Massive UI Overhaul \u0026 Mac Support',
                body: `We've completely rewritten the HomePage to support dynamic news feeds from Mojang and GitHub! Added Mac OS support. Fixed tons of bugs.`,
                date: new Date().toISOString(),
                url: 'https://github.com/pentagon',
                assets: [
                    { name: 'Pentagon-Setup-0.2.0.exe', downloadUrl: 'https://github.com/pentagon', size: 45000000 }
                ]
            },
            {
                version: '0.1.5',
                name: 'CurseForge Search & Bugfixes',
                body: 'Integrated CurseForge API, squashed the white-screen bug on the Mods page, and polished the Accounts UI.',
                date: new Date(Date.now() - 86400000 * 2).toISOString(),
                url: 'https://github.com/pentagon',
                assets: []
            }
        ];

        return {
            releases: mockReleases,
            updateAvailable: true, // Forcing true so the Update button shows up
            currentVersion: this.CURRENT_VERSION
        };
    }
}
