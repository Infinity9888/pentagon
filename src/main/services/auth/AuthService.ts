import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PathResolver } from '../utils/PathResolver';
import { MSAAuthFlow } from './MSAAuthFlow';

// ─── Types ────────────────────────────────────────────────────────

export type AccountType = 'msa' | 'offline';
export type AccountState = 'unchecked' | 'offline' | 'working' | 'online' | 'disabled' | 'errored' | 'expired' | 'gone';

export interface Token {
    token: string;
    refreshToken?: string;
    issueInstant: string;
    notAfter: string;
    extra: Record<string, any>;
}

export interface MinecraftProfile {
    id: string;
    name: string;
    skinUrl?: string;
    skinData?: string; // base64
    capes?: Array<{ id: string; url: string; alias: string }>;
}

export interface AccountData {
    internalId: string;
    type: AccountType;
    state: AccountState;

    // MSA-specific
    msaClientId?: string;
    msaToken?: Token;
    userToken?: Token;
    xstsToken?: Token;

    // Minecraft
    accessToken: string;
    profile: MinecraftProfile;
}

// ─── Constants ────────────────────────────────────────────────────

const MSA_CLIENT_ID = 'c36a9fb6-4f2a-41ff-90bd-ae7cc92031eb';
const MSA_AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize';
const MSA_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const MSA_SCOPE = 'XboxLive.SignIn XboxLive.offline_access';
const XBOX_USER_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_LOGIN_URL = 'https://api.minecraftservices.com/launcher/login';
const MC_ENTITLEMENTS_URL = 'https://api.minecraftservices.com/entitlements/mcstore';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

// ─── AuthService ──────────────────────────────────────────────────

export class AuthService {
    private accounts: AccountData[] = [];
    private defaultAccountId: string | null = null;
    private accountsFilePath: string = '';
    private initialized = false;

    constructor() {
        // Lazy init — app.getPath() is not available until app is ready
    }

    private ensureInitialized(): void {
        if (this.initialized) return;
        const dataDir = PathResolver.getDataDir();
        this.accountsFilePath = path.join(dataDir, 'accounts.json');
        this.loadAccounts();
        this.initialized = true;
    }

    // ─── Offline Auth ──────────────────────────────────────────────

    async loginOffline(username: string): Promise<AccountData> {
        this.ensureInitialized();
        const uuid = this.offlineUUID(username);
        const account: AccountData = {
            internalId: crypto.randomUUID(),
            type: 'offline',
            state: 'offline',
            accessToken: '0',
            profile: {
                id: uuid,
                name: username
            }
        };

        this.accounts.push(account);
        if (!this.defaultAccountId) {
            this.defaultAccountId = account.internalId;
        }
        this.saveAccounts();
        return account;
    }

    /**
     * Generates UUID from username exactly as Minecraft does it.
     * Reimplements Java's UUID.nameUUIDFromBytes("OfflinePlayer:<username>")
     */
    offlineUUID(username: string): string {
        const input = Buffer.from(`OfflinePlayer:${username}`, 'utf8');
        const hash = crypto.createHash('md5').update(input).digest();

        // Set version to 3 (name-based)
        hash[6] = (hash[6] & 0x0f) | 0x30;
        // Set variant to IETF
        hash[8] = (hash[8] & 0x3f) | 0x80;

        const hex = hash.toString('hex');
        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32)
        ].join('-');
    }

    // ─── MSA Auth ──────────────────────────────────────────────────

    async loginMSA(): Promise<AccountData | null> {
        this.ensureInitialized();
        console.log('[AuthService] Starting MSA OAuth2 Login Flow...');
        try {
            const result = await MSAAuthFlow.loginMSA();

            const account: AccountData = {
                internalId: crypto.randomUUID(),
                type: 'msa',
                state: 'working',
                msaClientId: MSA_CLIENT_ID,
                msaToken: result.msaToken,
                userToken: result.userToken,
                xstsToken: result.xstsToken,
                accessToken: result.minecraftToken,
                profile: result.profile
            };

            this.accounts.push(account);
            if (!this.defaultAccountId) {
                this.defaultAccountId = account.internalId;
            }
            this.saveAccounts();
            console.log('[AuthService] MSA Login successful for', account.profile.name);
            return account;
        } catch (error: any) {
            console.error('[AuthService] MSA Login failed:', error.message);
            throw error;
        }
    }

    // ─── Refresh ───────────────────────────────────────────────────

    async refresh(accountId: string): Promise<boolean> {
        this.ensureInitialized();
        const account = this.accounts.find(a => a.internalId === accountId);
        if (!account) return false;

        if (account.type === 'offline') {
            // Offline accounts don't need refresh
            return true;
        }

        try {
            if (!account.msaToken || !account.msaToken.refreshToken) {
                return false;
            }

            console.log(`[AuthService] Refreshing MSA token for ${account.profile.name}...`);
            const result = await MSAAuthFlow.refresh(account.msaToken.refreshToken);

            // Update account tokens
            account.msaToken = result.msaToken;
            account.userToken = result.userToken;
            account.xstsToken = result.xstsToken;
            account.accessToken = result.minecraftToken;
            account.profile = result.profile;
            account.state = 'working';

            this.saveAccounts();
            return true;
        } catch (error: any) {
            console.error('[AuthService] Refresh failed:', error.message);
            account.state = 'expired';
            this.saveAccounts();
            return false;
        }
    }

    // ─── Account Management ────────────────────────────────────────

    getAccounts(): { accounts: AccountData[]; defaultId: string | null } {
        this.ensureInitialized();
        return {
            accounts: this.accounts.map(a => ({ ...a })),
            defaultId: this.defaultAccountId
        };
    }

    removeAccount(id: string): boolean {
        this.ensureInitialized();
        const idx = this.accounts.findIndex(a => a.internalId === id);
        if (idx === -1) return false;
        this.accounts.splice(idx, 1);
        if (this.defaultAccountId === id) {
            this.defaultAccountId = this.accounts[0]?.internalId ?? null;
        }
        this.saveAccounts();
        return true;
    }

    setDefault(id: string): boolean {
        this.ensureInitialized();
        if (!this.accounts.find(a => a.internalId === id)) return false;
        this.defaultAccountId = id;
        this.saveAccounts();
        return true;
    }

    // ─── Persistence ───────────────────────────────────────────────

    private loadAccounts(): void {
        try {
            if (fs.existsSync(this.accountsFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.accountsFilePath, 'utf8'));
                this.accounts = data.accounts || [];
                this.defaultAccountId = data.defaultId || null;
            }
        } catch (err) {
            console.error('[AuthService] Failed to load accounts:', err);
            this.accounts = [];
        }
    }

    private saveAccounts(): void {
        try {
            const data = JSON.stringify({
                accounts: this.accounts,
                defaultId: this.defaultAccountId
            }, null, 2);
            fs.writeFileSync(this.accountsFilePath, data, 'utf8');
        } catch (err) {
            console.error('[AuthService] Failed to save accounts:', err);
        }
    }
}
