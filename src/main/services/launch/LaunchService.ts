import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { app } from 'electron';
import { VersionManager } from './VersionManager';
import { JavaDetector } from './JavaDetector';
import { LibraryResolver } from './LibraryResolver';
import { AssetDownloader } from './AssetDownloader';
import { ArgumentBuilder, LaunchParams } from './ArgumentBuilder';
import { DownloadManager } from '../download/DownloadManager';
import { settingsService } from '../settings/SettingsService';

export class LaunchService {
    private static activeProcesses: Map<string, cp.ChildProcess> = new Map();

    static async launch(
        instanceId: string,
        account: any,
        onProgress: (status: string, progress?: number, total?: number) => void,
        onLog?: (line: string, level?: string) => void
    ): Promise<void> {
        try {
            onProgress('Initializing launch sequence...');

            const instancesDir = path.join(app.getPath('userData'), 'data', 'instances');
            const instanceDir = path.join(instancesDir, instanceId);
            const minecraftDir = path.join(instanceDir, '.minecraft');

            const versionId = '1.20.1';

            onProgress('Fetching version manifest...');
            const versionJson = await VersionManager.getVersionDetails(versionId);

            onProgress('Detecting Java executable...');
            const requiredJava = versionJson.javaVersion?.majorVersion || 8;
            const javaExe = await JavaDetector.getBestJavaForVersion(requiredJava);
            if (!javaExe) {
                throw new Error(`Could not find a suitable Java ${requiredJava} installation.`);
            }

            onProgress('Downloading client.jar...');
            const clientDownload = versionJson.downloads.client;
            const clientJarPath = path.join(VersionManager.versionsDir, versionId, `${versionId}.jar`);
            await DownloadManager.downloadQueue([{
                url: clientDownload.url,
                destination: clientJarPath,
                sha1: clientDownload.sha1,
                size: clientDownload.size
            }], 1);

            onProgress('Resolving and downloading libraries...');
            const nativesDir = path.join(instanceDir, 'natives');
            const classpathPaths = await LibraryResolver.resolveLibraries(
                versionJson,
                nativesDir,
                (total, current) => onProgress('Downloading libraries...', current, total)
            );
            classpathPaths.push(clientJarPath);

            onProgress('Downloading assets...');
            const assetIndexId = versionJson.assetIndex.id;
            const assetsRoot = await AssetDownloader.downloadAssets(
                versionJson.assetIndex,
                (total, current) => onProgress('Downloading assets...', current, total)
            );

            onProgress('Building launch arguments...');
            const launchParams: LaunchParams = {
                auth_player_name: account.profile.name,
                version_name: versionId,
                game_directory: minecraftDir,
                assets_root: assetsRoot,
                assets_index_name: assetIndexId,
                auth_uuid: account.profile.id,
                auth_access_token: account.accessToken,
                user_type: account.type === 'msa' ? 'msa' : 'offline',
                version_type: versionJson.type,
                natives_directory: nativesDir,
                launcher_name: 'Pentagon Launcher',
                launcher_version: '0.2.0',
                classpath: classpathPaths,
                resolution_width: '854',
                resolution_height: '480'
            };

            const fullArgs = ArgumentBuilder.build(versionJson, launchParams);

            // Inject RAM & Custom arguments
            const appSettings = settingsService.getSettings();
            const jvmInjections = [
                `-Xms${appSettings.minRam}M`,
                `-Xmx${appSettings.maxRam}M`
            ];

            if (appSettings.jvmArgs && appSettings.jvmArgs.trim() !== '') {
                jvmInjections.push(...appSettings.jvmArgs.split(' '));
            }

            const mainClassIndex = fullArgs.indexOf(versionJson.mainClass);
            if (mainClassIndex !== -1) {
                fullArgs.splice(mainClassIndex, 0, ...jvmInjections);
            } else {
                fullArgs.unshift(...jvmInjections);
            }

            onProgress('Starting the game process!');

            if (!fs.existsSync(minecraftDir)) fs.mkdirSync(minecraftDir, { recursive: true });

            console.log(`[LaunchService] Spawning: ${javaExe} \nArgs:`, fullArgs.join('\n'));

            const mcProcess = cp.spawn(javaExe, fullArgs, {
                cwd: instanceDir,
                detached: !appSettings.showConsole,
                stdio: appSettings.showConsole ? 'pipe' : 'ignore'
            });

            this.activeProcesses.set(instanceId, mcProcess);

            if (appSettings.showConsole) {
                mcProcess.stdout?.on('data', (d) => {
                    const line = d.toString().trim();
                    if (line) onLog?.(line, 'info');
                });
                mcProcess.stderr?.on('data', (d) => {
                    const line = d.toString().trim();
                    if (line) onLog?.(line, 'warn'); // sometimes info goes to stderr in minecraft
                });
                mcProcess.on('exit', (code) => {
                    this.activeProcesses.delete(instanceId);
                    onLog?.(`Process exited with code ${code}`, 'info');
                });
            } else {
                mcProcess.unref();
            }

            onProgress('Game launched successfully! You can close the launcher.');


            onProgress('Game launched successfully! You can close the launcher.');
        } catch (err: any) {
            console.error(`[LaunchService] Launch failed:`, err);
            onProgress(`Launch Error: ${err.message}`);
            throw err;
        }
    }

    static kill(instanceId: string): boolean {
        const p = this.activeProcesses.get(instanceId);
        if (p) {
            p.kill('SIGKILL');
            this.activeProcesses.delete(instanceId);
            return true;
        }
        return false;
    }
}
