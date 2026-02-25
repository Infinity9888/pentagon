import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface AppSettings {
    javaPath: string;
    minRam: number;
    maxRam: number;
    jvmArgs: string;
    instancesDir: string;
    theme: string;
    language: string;
    closeOnLaunch: boolean;
    showConsole: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    javaPath: '',
    minRam: 1024,
    maxRam: 4096,
    jvmArgs: '-XX:+UseG1GC',
    instancesDir: '',
    theme: 'dark',
    language: 'ru',
    closeOnLaunch: false,
    showConsole: true
};

export class SettingsService {
    private settings: AppSettings;
    private settingsFilePath: string = '';
    private initialized = false;

    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
    }

    private ensureInitialized(): void {
        if (this.initialized) return;
        const dataDir = path.join(app.getPath('userData'), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.settingsFilePath = path.join(dataDir, 'settings.json');
        this.loadSettings();
        this.initialized = true;
    }

    public getSettings(): AppSettings {
        this.ensureInitialized();
        return { ...this.settings };
    }

    public updateSettings(updates: Partial<AppSettings>): void {
        this.ensureInitialized();
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
    }

    private loadSettings(): void {
        try {
            if (fs.existsSync(this.settingsFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.settingsFilePath, 'utf8'));
                this.settings = { ...DEFAULT_SETTINGS, ...data };
            }
        } catch (err) {
            console.error('[SettingsService] Failed to load settings:', err);
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    private saveSettings(): void {
        try {
            fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings, null, 2), 'utf8');
        } catch (err) {
            console.error('[SettingsService] Failed to save settings:', err);
        }
    }
}

export const settingsService = new SettingsService();
