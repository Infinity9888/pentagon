import { shell } from 'electron';
import * as http from 'http';
import { Token, MinecraftProfile } from './AuthService';

const MSA_CLIENT_ID = 'c36a9fb6-4f2a-41ff-90bd-ae7cc92031eb';
const MSA_AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize';
const MSA_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const MSA_SCOPE = 'XboxLive.SignIn XboxLive.offline_access';
const XBOX_USER_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_LOGIN_URL = 'https://api.minecraftservices.com/launcher/login';
const MC_ENTITLEMENTS_URL = 'https://api.minecraftservices.com/entitlements/mcstore';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

export interface MSAAuthResult {
    msaToken: Token;
    userToken: Token;
    xstsToken: Token;
    minecraftToken: string;
    profile: MinecraftProfile;
}

export class MSAAuthFlow {
    /**
     * Start the full MSA OAuth2 flow
     */
    static async loginMSA(): Promise<MSAAuthResult> {
        // Step 1: Open browser & Catch redirect
        const redirectPort = await this.findAvailablePort(34567);
        const redirectUri = `http://localhost:${redirectPort}`;
        const code = await this.catchAuthCode(redirectPort, redirectUri);

        // Step 2: Swap code for MSA Token
        const msaToken = await this.getMSAToken(code, redirectUri);

        return await this.authenticateWithMSAToken(msaToken);
    }

    /**
     * Refresh the MSA Token and get new Minecraft Tokens
     */
    static async refresh(refreshToken: string): Promise<MSAAuthResult> {
        const body = new URLSearchParams({
            client_id: MSA_CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });

        const res = await fetch(MSA_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!res.ok) {
            throw new Error(`Failed to refresh MSA token: ${await res.text()}`);
        }

        const data = await res.json() as any;
        const msaToken = this.parseTokenResponse(data);

        return await this.authenticateWithMSAToken(msaToken);
    }

    private static async authenticateWithMSAToken(msaToken: Token): Promise<MSAAuthResult> {
        // Step 3: Xbox User Authentication
        const userToken = await this.getXboxUserToken(msaToken.token);
        const uhs = userToken.extra.uhs;

        // Step 4: XSTS Authorization
        const xstsToken = await this.getXSTSToken(userToken.token);

        // Step 5: Minecraft Services Login
        const minecraftToken = await this.getMinecraftToken(uhs, xstsToken.token);

        // Step 6: Check Entitlements
        const ownsMinecraft = await this.checkEntitlements(minecraftToken);
        if (!ownsMinecraft) {
            throw new Error('This account does not own Minecraft. Please purchase the game.');
        }

        // Step 7: Get Minecraft Profile
        const profile = await this.getMinecraftProfile(minecraftToken);

        return {
            msaToken,
            userToken,
            xstsToken,
            minecraftToken,
            profile,
        };
    }

    private static async catchAuthCode(port: number, redirectUri: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                const url = new URL(req.url || '/', `http://localhost:${port}`);
                if (url.pathname === '/') {
                    const code = url.searchParams.get('code');
                    const error = url.searchParams.get('error');

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(`
                            <html>
                                <head><title>Authentication Successful</title></head>
                                <body style="background: #0a0a0f; color: #22c55e; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
                                    <div>
                                        <h1>Authentication Successful!</h1>
                                        <p>You can now close this tab and return to Pentagon Launcher.</p>
                                    </div>
                                </body>
                            </html>
                        `);
                        server.close();
                        resolve(code);
                    } else if (error) {
                        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end(`Authentication failed: ${error}`);
                        server.close();
                        reject(new Error(error));
                    }
                }
            });

            server.listen(port, () => {
                const authUrl = `${MSA_AUTH_URL}?client_id=${MSA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(MSA_SCOPE)}&prompt=select_account`;
                shell.openExternal(authUrl);
            });

            server.on('error', (err) => {
                reject(err);
            });
        });
    }

    private static async getMSAToken(code: string, redirectUri: string): Promise<Token> {
        const body = new URLSearchParams({
            client_id: MSA_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        });

        const res = await fetch(MSA_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!res.ok) {
            throw new Error(`Failed to get MSA token: ${await res.text()}`);
        }

        const data = await res.json() as any;
        return this.parseTokenResponse(data);
    }

    private static async getXboxUserToken(msaAccessToken: string): Promise<Token> {
        const body = {
            Properties: {
                AuthMethod: 'RPS',
                SiteName: 'user.auth.xboxlive.com',
                RpsTicket: `d=${msaAccessToken}`
            },
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT'
        };

        const res = await fetch(XBOX_USER_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-xbl-contract-version': '1',
            },
            body: JSON.stringify(body)
        });

        const data = await res.json() as any;
        if (!res.ok) {
            throw new Error(`Xbox User Auth failed: ${JSON.stringify(data)}`);
        }

        return {
            token: data.Token,
            issueInstant: data.IssueInstant,
            notAfter: data.NotAfter,
            extra: {
                uhs: data.DisplayClaims?.xui?.[0]?.uhs
            }
        };
    }

    private static async getXSTSToken(xboxUserToken: string): Promise<Token> {
        const body = {
            Properties: {
                SandboxId: 'RETAIL',
                UserTokens: [xboxUserToken]
            },
            RelyingParty: 'rp://api.minecraftservices.com/',
            TokenType: 'JWT'
        };

        const res = await fetch(XSTS_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-xbl-contract-version': '1',
            },
            body: JSON.stringify(body)
        });

        const data = await res.json() as any;

        if (!res.ok) {
            if (data.XErr) {
                switch (data.XErr) {
                    case 2148916233: throw new Error("This Microsoft account does not have an Xbox profile.");
                    case 2148916235: throw new Error("Xbox Live is unavailable in your region.");
                    case 2148916238: throw new Error("Underage account must be added to a Family and given permissions.");
                    case 2148916236: throw new Error("Account requires age verification.");
                    case 2148916227: throw new Error("Your Xbox Live account was banned.");
                    default: throw new Error(`XSTS Error ${data.XErr}: ${data.Message || 'Unknown error'}`);
                }
            }
            throw new Error(`XSTS Auth failed: ${JSON.stringify(data)}`);
        }

        return {
            token: data.Token,
            issueInstant: data.IssueInstant,
            notAfter: data.NotAfter,
            extra: {} // Not strictly needed, uhs is used from Xbox User Token
        };
    }

    private static async getMinecraftToken(uhs: string, xstsToken: string): Promise<string> {
        const body = {
            identityToken: `XBL3.0 x=${uhs};${xstsToken}`, // Some versions use xtoken, some identityToken. The official one uses identityToken usually, but Prism uses xtoken? Let's use what Prism docs say. Wait, the docs in pentagon_knowledge_base say 'xtoken'
        };

        const res = await fetch(MC_LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                xtoken: `XBL3.0 x=${uhs};${xstsToken}`,
                platform: 'PC_LAUNCHER'
            }) // Prism Launcher specifies xtoken
        });

        const data = await res.json() as any;
        if (!res.ok) {
            throw new Error(`Minecraft Login failed: ${JSON.stringify(data)}`);
        }

        return data.access_token;
    }

    private static async checkEntitlements(mcAccessToken: string): Promise<boolean> {
        const res = await fetch(MC_ENTITLEMENTS_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${mcAccessToken}`
            }
        });

        const data = await res.json() as any;
        if (!res.ok) {
            throw new Error(`Failed to check entitlements: ${JSON.stringify(data)}`);
        }

        // Return true if items is an array and has at least one entitlement
        return Array.isArray(data.items) && data.items.length > 0;
    }

    private static async getMinecraftProfile(mcAccessToken: string): Promise<MinecraftProfile> {
        const res = await fetch(MC_PROFILE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${mcAccessToken}`
            }
        });

        const data = await res.json() as any;
        if (!res.ok) {
            throw new Error(`Failed to get Minecraft profile: ${JSON.stringify(data)}`);
        }

        const skins = data.skins || [];
        const activeSkin = skins.find((s: any) => s.state === 'ACTIVE') || skins[0];
        const capesList = data.capes || [];

        return {
            id: data.id,
            name: data.name,
            skinUrl: activeSkin?.url,
            capes: capesList.map((c: any) => ({ id: c.id, url: c.url, alias: c.alias }))
        };
    }

    private static parseTokenResponse(data: any): Token {
        const issueInstant = Date.now();
        const expiresInMs = (data.expires_in || 86400) * 1000;

        return {
            token: data.access_token,
            refreshToken: data.refresh_token,
            issueInstant: new Date(issueInstant).toISOString(),
            notAfter: new Date(issueInstant + expiresInMs).toISOString(),
            extra: {}
        };
    }

    private static async findAvailablePort(startPort: number): Promise<number> {
        let port = startPort;
        while (port < startPort + 50) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
            port++;
        }
        throw new Error("Could not find an available port for local auth server");
    }

    private static isPortAvailable(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = http.createServer();
            server.unref();
            server.on('error', () => resolve(false));
            server.listen(port, () => {
                server.close(() => resolve(true));
            });
        });
    }
}
