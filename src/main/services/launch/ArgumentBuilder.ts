import * as path from 'path';

export interface LaunchParams {
    auth_player_name: string;
    version_name: string;
    game_directory: string;
    assets_root: string;
    assets_index_name: string;
    auth_uuid: string;
    auth_access_token: string;
    user_type: string;
    version_type: string;
    resolution_width?: string;
    resolution_height?: string;
    natives_directory: string;
    launcher_name: string;
    launcher_version: string;
    classpath: string[];
}

export class ArgumentBuilder {
    /**
     * Builds the full array of arguments to be passed to child_process.spawn('java', args)
     */
    static build(versionJson: any, params: LaunchParams): string[] {
        const jvmArgs = this.parseArguments(versionJson.arguments?.jvm || this.getLegacyJvmArgs(), params);
        const gameArgs = this.parseArguments(versionJson.arguments?.game || versionJson.minecraftArguments, params);

        return [
            ...jvmArgs,
            versionJson.mainClass,
            ...gameArgs
        ];
    }

    private static parseArguments(argsRule: any, params: LaunchParams): string[] {
        if (!argsRule) return [];

        let parsedArgs: string[] = [];

        // Older versions (like 1.8.9) used a single string for game arguments
        if (typeof argsRule === 'string') {
            parsedArgs = argsRule.split(' ');
        }
        // Modern versions use arrays with rules
        else if (Array.isArray(argsRule)) {
            for (const arg of argsRule) {
                if (typeof arg === 'string') {
                    parsedArgs.push(arg);
                } else if (typeof arg === 'object') {
                    // Check if the rules apply to the current environment
                    if (this.evaluateRules(arg.rules, params)) {
                        if (Array.isArray(arg.value)) {
                            parsedArgs.push(...arg.value);
                        } else if (typeof arg.value === 'string') {
                            parsedArgs.push(arg.value);
                        }
                    }
                }
            }
        }

        // Apply string interpolation
        return parsedArgs.map(arg => this.substituteVariables(arg, params));
    }

    private static evaluateRules(rules: any[], params: LaunchParams): boolean {
        if (!rules) return true;

        let allow = false;
        for (const rule of rules) {
            let match = true;

            // OS Name rule (e.g. windows)
            if (rule.os?.name && rule.os.name !== this.getOSName()) {
                match = false;
            }

            // Arch rule (e.g. x86)
            if (rule.os?.arch && rule.os.arch !== process.arch) {
                match = false;
            }

            // Feature rules (e.g. has_custom_resolution, has_quick_plays_support)
            if (rule.features) {
                for (const [feature, expectedValue] of Object.entries(rule.features)) {
                    const supportedFeatures: Record<string, boolean> = {
                        has_custom_resolution: !!(params.resolution_width && params.resolution_height),
                        is_demo_user: false,
                        has_quick_plays_support: false,
                        is_quick_play_singleplayer: false,
                        is_quick_play_multiplayer: false,
                        is_quick_play_realms: false
                    };

                    const actualValue = supportedFeatures[feature] ?? false;
                    if (actualValue !== expectedValue) {
                        match = false;
                        break;
                    }
                }
            }

            if (match) {
                allow = rule.action === 'allow';
            }
        }

        return allow;
    }

    private static getLegacyJvmArgs() {
        return [
            {
                rules: [{ action: "allow", os: { name: "osx" } }],
                value: ["-XstartOnFirstThread"]
            },
            {
                rules: [{ action: "allow", os: { name: "windows" } }],
                value: "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump"
            },
            {
                rules: [{ action: "allow", os: { name: "windows", version: "^10\\." } }],
                value: ["-Dos.name=Windows 10", "-Dos.version=10.0"]
            },
            "-Djava.library.path=${natives_directory}",
            "-Dminecraft.launcher.brand=${launcher_name}",
            "-Dminecraft.launcher.version=${launcher_version}",
            "-cp",
            "${classpath}"
        ];
    }

    private static getOSName(): string {
        switch (process.platform) {
            case 'win32': return 'windows';
            case 'darwin': return 'osx';
            case 'linux': return 'linux';
            default: return 'unknown';
        }
    }

    private static substituteVariables(str: string, params: LaunchParams): string {
        let res = str;

        // General replacements
        res = res.replace(/\$\{auth_player_name\}/g, params.auth_player_name);
        res = res.replace(/\$\{version_name\}/g, params.version_name);
        res = res.replace(/\$\{game_directory\}/g, params.game_directory);
        res = res.replace(/\$\{assets_root\}/g, params.assets_root);
        res = res.replace(/\$\{assets_index_name\}/g, params.assets_index_name);
        res = res.replace(/\$\{auth_uuid\}/g, params.auth_uuid);
        res = res.replace(/\$\{auth_access_token\}/g, params.auth_access_token);
        res = res.replace(/\$\{user_type\}/g, params.user_type);
        res = res.replace(/\$\{version_type\}/g, params.version_type);

        if (params.resolution_width) res = res.replace(/\$\{resolution_width\}/g, params.resolution_width);
        if (params.resolution_height) res = res.replace(/\$\{resolution_height\}/g, params.resolution_height);

        res = res.replace(/\$\{natives_directory\}/g, params.natives_directory);
        res = res.replace(/\$\{launcher_name\}/g, params.launcher_name);
        res = res.replace(/\$\{launcher_version\}/g, params.launcher_version);

        // Classpath requires joining the array with the OS specific separator (';' on Windows, ':' on Unix)
        if (res.includes('${classpath}')) {
            const separator = process.platform === 'win32' ? ';' : ':';
            res = res.replace(/\$\{classpath\}/g, params.classpath.join(separator));
        }

        return res;
    }
}
