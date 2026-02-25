import { net } from 'electron';

export interface ModrinthSearchResult {
    project_id: string;
    project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader';
    slug: string;
    author: string;
    title: string;
    description: string;
    categories: string[];
    display_categories: string[];
    versions: string[];
    downloads: number;
    follows: number;
    icon_url: string;
    date_created: string;
    date_modified: string;
    latest_version: string;
    license: string;
    client_side: string;
    server_side: string;
    gallery: string[];
}

export interface ModrinthSearchResponse {
    hits: ModrinthSearchResult[];
    offset: number;
    limit: number;
    total_hits: number;
}

export class ModPlatformService {
    private static MODRINTH_API = 'https://api.modrinth.com/v2';
    private static CURSEFORGE_API = 'https://api.curseforge.com/v1';
    private static CURSEFORGE_API_KEY = '$2a$10$wuAJuNZuted3NORVmpgUC.m8sI.pv1tOPKZyBgLFGjxFp/br0lZCC';
    private static USER_AGENT = 'PentagonLauncher/0.1.0 (contact@pentagon.com)';

    /**
     * Search Modrinth for projects (mods, modpacks)
     */
    public static async searchModrinth(query: string, type: 'mod' | 'modpack' = 'modpack', limit: number = 20, offset: number = 0): Promise<ModrinthSearchResponse> {
        const facets = `[["project_type:${type}"]]`;
        const urlOptions = new URLSearchParams({
            query: query,
            facets: facets,
            limit: limit.toString(),
            offset: offset.toString()
        });

        const url = `${this.MODRINTH_API}/search?${urlOptions.toString()}`;

        return new Promise((resolve, reject) => {
            const request = net.request(url);
            request.setHeader('User-Agent', this.USER_AGENT);

            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    try {
                        if (response.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else {
                            reject(new Error(`Modrinth returned ${response.statusCode}: ${data}`));
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

    /**
     * Get specific project details
     */
    public static async getModrinthProject(slugOrId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = net.request(`${this.MODRINTH_API}/project/${slugOrId}`);
            request.setHeader('User-Agent', this.USER_AGENT);

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
     * Search CurseForge for projects
     * classId: 6 = Mods, 4471 = Modpacks (we will default to 6 for 'mod' type, 4471 for modpacks)
     */
    public static async searchCurseForge(query: string, type: 'mod' | 'modpack' = 'modpack', limit: number = 20, offset: number = 0): Promise<ModrinthSearchResponse> {
        const classId = type === 'mod' ? 6 : 4471;

        const urlOptions = new URLSearchParams({
            gameId: '432', // Minecraft
            classId: classId.toString(),
            searchFilter: query,
            pageSize: limit.toString(),
            index: offset.toString()
        });

        const url = `${this.CURSEFORGE_API}/mods/search?${urlOptions.toString()}`;

        return new Promise((resolve, reject) => {
            const request = net.request(url);
            request.setHeader('User-Agent', this.USER_AGENT);
            request.setHeader('x-api-key', this.CURSEFORGE_API_KEY);
            request.setHeader('Accept', 'application/json');

            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk.toString());
                response.on('end', () => {
                    try {
                        if (response.statusCode === 200) {
                            const parsed = JSON.parse(data);
                            // Normalize to Modrinth format so frontend doesn't need to care
                            const hits = parsed.data.map((cfMod: any) => ({
                                project_id: cfMod.id.toString(),
                                project_type: type,
                                slug: cfMod.slug,
                                author: cfMod.authors && cfMod.authors.length > 0 ? cfMod.authors[0].name : 'Unknown',
                                title: cfMod.name,
                                description: cfMod.summary,
                                categories: [],
                                display_categories: [],
                                versions: [],
                                downloads: cfMod.downloadCount,
                                follows: 0,
                                icon_url: cfMod.logo ? cfMod.logo.url : '',
                                date_created: cfMod.dateCreated,
                                date_modified: cfMod.dateModified,
                                latest_version: '',
                                license: '',
                                client_side: 'optional',
                                server_side: 'optional',
                                gallery: []
                            }));

                            resolve({
                                hits: hits,
                                offset: parsed.pagination.index,
                                limit: parsed.pagination.pageSize,
                                total_hits: parsed.pagination.totalCount
                            });
                        } else {
                            reject(new Error(`CurseForge returned ${response.statusCode}: ${data}`));
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
}
