import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as os from 'os';

export interface JavaInfo {
    version: string;
    major: number;
    executable: string;
    is64Bit: boolean;
}

export class JavaDetector {
    /**
     * Scans common Windows directories for Java installations
     */
    static async detectJava(): Promise<JavaInfo[]> {
        if (os.platform() !== 'win32') {
            console.warn('[JavaDetector] Not implemented for non-Windows platforms');
            return [];
        }

        const standardPaths = [
            'C:\\Program Files\\Java',
            'C:\\Program Files (x86)\\Java',
            'C:\\Program Files\\Eclipse Adoptium',
            'C:\\Program Files\\AdoptOpenJDK',
            'C:\\Program Files\\Zulu',
            'C:\\Program Files\\BellSoft',
            process.env.JAVA_HOME
        ].filter(Boolean) as string[];

        const javaExecutables: string[] = [];

        // Simple BFS to find java.exe up to depth 3
        for (const basePath of standardPaths) {
            if (!fs.existsSync(basePath)) continue;

            const searchQueue: { p: string; depth: number }[] = [{ p: basePath, depth: 0 }];

            while (searchQueue.length > 0) {
                const current = searchQueue.shift()!;
                if (current.depth > 3) continue;

                try {
                    const stats = fs.statSync(current.p);
                    if (!stats.isDirectory()) continue;

                    const entries = fs.readdirSync(current.p);
                    for (const entry of entries) {
                        const fullPath = path.join(current.p, entry);
                        if (entry.toLowerCase() === 'java.exe') {
                            javaExecutables.push(fullPath);
                        } else {
                            try {
                                if (fs.statSync(fullPath).isDirectory()) {
                                    searchQueue.push({ p: fullPath, depth: current.depth + 1 });
                                }
                            } catch (e) {
                                // Ignore permission errors
                            }
                        }
                    }
                } catch (e) {
                    // Ignore permission errors
                }
            }
        }

        // Deduplicate
        const uniquePaths = Array.from(new Set(javaExecutables));
        const results: JavaInfo[] = [];

        for (const exePath of uniquePaths) {
            try {
                const info = await this.getJavaDetails(exePath);
                if (info) results.push(info);
            } catch (e) {
                console.error(`[JavaDetector] Failed to get details for ${exePath}`, e);
            }
        }

        return results;
    }

    private static getJavaDetails(executablePath: string): Promise<JavaInfo | null> {
        return new Promise((resolve) => {
            cp.execFile(executablePath, ['-version'], { timeout: 2000 }, (error, stdout, stderr) => {
                const output = stderr || stdout; // Java outputs version to stderr usually

                // Parse version
                const versionRegex = /version "(.*?)"/;
                const match = output.match(versionRegex);
                if (!match) return resolve(null);

                const version = match[1];

                // Parse major version (e.g. 1.8.0_301 -> 8, 17.0.1 -> 17)
                let major = 0;
                if (version.startsWith('1.')) {
                    const parts = version.split('.');
                    major = parseInt(parts[1], 10);
                } else {
                    major = parseInt(version.split('.')[0], 10);
                }

                // Parse architecture
                const is64Bit = output.toLowerCase().includes('64-bit');

                resolve({
                    version,
                    major,
                    executable: executablePath,
                    is64Bit
                });
            });
        });
    }

    /**
     * Finds the best matching Java version for a requested major version.
     * e.g. req 17 -> returns Java 17, req 8 -> returns Java 8
     */
    static async getBestJavaForVersion(requiredMajor: number): Promise<string | null> {
        const javas = await this.detectJava();

        // Find exact major match, preferring 64-bit
        const exactMatches = javas.filter(j => j.major === requiredMajor);
        if (exactMatches.length > 0) {
            const best = exactMatches.find(j => j.is64Bit) || exactMatches[0];
            return best.executable;
        }

        // Fallback: If finding exactly is not possible, return highest available 
        // that is >= required (some versions might run fine on newer Java)
        const compatible = javas.filter(j => j.major >= requiredMajor).sort((a, b) => b.major - a.major);
        if (compatible.length > 0) {
            const best = compatible.find(j => j.is64Bit) || compatible[0];
            return best.executable;
        }

        return null;
    }
}
