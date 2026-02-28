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

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': this.USER_AGENT
                }
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Modrinth returned ${response.status}: ${text}`);
            }
            return JSON.parse(text);
        } catch (e: any) {
            throw new Error(`Failed to search Modrinth: ${e.message}`);
        }
    }

    /**
     * Get specific project details
     */
    public static async getModrinthProject(slugOrId: string): Promise<any> {
        const url = `${this.MODRINTH_API}/project/${slugOrId}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': this.USER_AGENT
                }
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Modrinth returned ${response.status}: ${text}`);
            }
            return JSON.parse(text);
        } catch (e: any) {
            throw new Error(`Failed to fetch Modrinth project ${slugOrId}: ${e.message}`);
        }
    }

    /**
     * Get versions for a project, filtered by game version and loader
     */
    public static async getModrinthVersions(slugOrId: string, loaders?: string[], gameVersions?: string[]): Promise<any[]> {
        let url = `${this.MODRINTH_API}/project/${slugOrId}/version`;
        const params = new URLSearchParams();

        if (loaders && loaders.length > 0) {
            params.append('loaders', JSON.stringify(loaders));
        }
        if (gameVersions && gameVersions.length > 0) {
            params.append('game_versions', JSON.stringify(gameVersions));
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        try {
            const res = await fetch(url, { headers: { 'User-Agent': this.USER_AGENT } });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Modrinth returned ${res.status}: ${text}`);
            }
            return await res.json();
        } catch (e: any) {
            throw new Error(`Failed to fetch modrinth versions for ${slugOrId} at ${url}: ${e.message}`);
        }
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

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'x-api-key': this.CURSEFORGE_API_KEY,
                    'Accept': 'application/json'
                }
            });

            const text = await response.text();
            if (!response.ok) {
                throw new Error(`CurseForge returned ${response.status}: ${text}`);
            }

            const parsed = JSON.parse(text);
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

            return {
                hits: hits,
                offset: parsed.pagination.index,
                limit: parsed.pagination.pageSize,
                total_hits: parsed.pagination.totalCount
            };
        } catch (e: any) {
            throw new Error(`Failed to search CurseForge: ${e.message}`);
        }
    }

    /**
     * Get files for a CurseForge project, filtered by game version and loader type
     * @param modId CurseForge Project ID
     * @param gameVersion Minecraft version string (e.g., '1.20.1')
     * @param modLoaderType CurseForge Loader ID (1=Forge, 4=Fabric, 5=Quilt, 6=NeoForge)
     */
    public static async getCurseForgeModFiles(modId: string, gameVersion?: string, modLoaderType?: number): Promise<any[]> {
        const urlOptions = new URLSearchParams();
        urlOptions.append('pageSize', '50'); // Usually 50 is enough for recent files
        if (gameVersion) urlOptions.append('gameVersion', gameVersion);
        if (modLoaderType !== undefined) urlOptions.append('modLoaderType', modLoaderType.toString());

        const url = `${this.CURSEFORGE_API}/mods/${modId}/files?${urlOptions.toString()}`;

        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'x-api-key': this.CURSEFORGE_API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`CurseForge returned ${res.status}: ${text}`);
            }

            const data = await res.json();
            return data.data || [];
        } catch (e: any) {
            throw new Error(`Failed to fetch CurseForge files for ${modId}: ${e.message}`);
        }
    }

    /**
     * Get a specific file from CurseForge
     */
    public static async getCurseForgeFile(modId: string, fileId: string): Promise<any> {
        const url = `${this.CURSEFORGE_API}/mods/${modId}/files/${fileId}`;

        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'x-api-key': this.CURSEFORGE_API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`CurseForge returned ${res.status}: ${text}`);
            }

            const data = await res.json();
            return data.data;
        } catch (e: any) {
            throw new Error(`Failed to fetch CurseForge file ${fileId} for mod ${modId}: ${e.message}`);
        }
    }
}
