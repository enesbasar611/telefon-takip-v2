import type { Client as WhatsAppClient } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

interface WhatsAppSession {
    client: WhatsAppClient;
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR';
    qr?: string;
    error?: string;
    me?: { name: string; number: string };
}

declare global {
    var whatsappSessions: Record<string, WhatsAppSession | undefined>;
}

if (!globalThis.whatsappSessions) {
    globalThis.whatsappSessions = {};
}

class WhatsAppManager {
    private async getSession(shopId: string): Promise<WhatsAppSession> {
        let session = globalThis.whatsappSessions[shopId];

        if (!session) {
            console.log(`[WHATSAPP] Creating new session for shop: ${shopId}`);

            // Dynamic import for heavy packages
            const { Client, LocalAuth } = await import('whatsapp-web.js');

            const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

            const puppeteerArgs = [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
            ];

            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: `shop-${shopId}`,
                    dataPath: './.whatsapp-auth'
                }),
                puppeteer: {
                    headless: true,
                    executablePath,
                    args: puppeteerArgs,
                }
            });

            session = {
                client,
                status: 'DISCONNECTED'
            };

            globalThis.whatsappSessions[shopId] = session;
            this.setupEventListeners(shopId, session);
        }

        return session;
    }

    private setupEventListeners(shopId: string, session: WhatsAppSession) {
        const { client } = session;

        client.on('qr', async (qr: string) => {
            console.log(`[WHATSAPP] QR received for ${shopId}`);
            session.qr = await qrcode.toDataURL(qr);
            session.status = 'QR';
            session.error = undefined;
        });

        client.on('ready', () => {
            console.log(`[WHATSAPP] Client ready for ${shopId}`);
            session.status = 'CONNECTED';
            session.error = undefined;
            session.qr = undefined;

            const me = client.info;
            if (me) {
                session.me = {
                    name: me.pushname || 'Bilinmeyen Cihaz',
                    number: me.wid.user
                };
            }
        });

        client.on('authenticated', () => {
            console.log(`[WHATSAPP] Authenticated ${shopId}`);
            session.error = undefined;
        });

        client.on('auth_failure', (msg: any) => {
            console.error(`[WHATSAPP] Auth failure ${shopId}`, msg);
            session.status = 'DISCONNECTED';
            session.error = "Kimlik doğrulama hatası. Lütfen tekrar bağlanın.";
        });

        client.on('disconnected', (reason: any) => {
            console.log(`[WHATSAPP] Disconnected ${shopId}`, reason);
            session.status = 'DISCONNECTED';
            session.qr = undefined;
            session.me = undefined;

            if (reason === 'NAVIGATION') {
                session.error = "Tarayıcı navigasyon hatası.";
            } else if (reason === 'LOGOUT') {
                session.error = "Oturum kapatıldı.";
            } else {
                session.error = "Bağlantı koptu. Telefonunuzun internete bağlı olduğundan emin olun.";
            }
        });
    }

    public async logout(shopId: string) {
        const session = globalThis.whatsappSessions[shopId];
        if (session) {
            try {
                await session.client.logout().catch(() => { });
                await session.client.destroy().catch(() => { });
            } catch (e) { }
            delete globalThis.whatsappSessions[shopId];
        }
    }

    public async initialize(shopId: string, force = false): Promise<void> {
        const session = await this.getSession(shopId);

        if (!force && (session.status === 'CONNECTED' || session.status === 'CONNECTING' || session.status === 'QR')) {
            console.log(`[WHATSAPP] Session ${shopId} already exists with status: ${session.status}`);
            return;
        }

        if (force) {
            console.log(`[WHATSAPP] Force re-initializing ${shopId}`);
            try {
                await session.client.destroy().catch(() => { });
                this.clearSingletonLock(shopId);
            } catch (e) { }
            delete globalThis.whatsappSessions[shopId];
            const newSession = await this.getSession(shopId);
            return this.doInitialize(shopId, newSession);
        }

        return this.doInitialize(shopId, session);
    }

    private async doInitialize(shopId: string, session: WhatsAppSession): Promise<void> {
        try {
            // Her başlatma öncesi kilit dosyalarını temizleyelim (stale lock sorunu için)
            this.clearSingletonLock(shopId);

            console.log(`[WHATSAPP] Initializing client for ${shopId}...`);
            session.status = 'CONNECTING';
            session.error = undefined;

            const initPromise = session.client.initialize();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('WhatsApp başlatma zaman aşımı (45s)')), 45000)
            );

            await Promise.race([initPromise, timeoutPromise]);
        } catch (err) {
            console.error(`[WHATSAPP] Init error ${shopId}:`, err);
            session.status = 'DISCONNECTED';
            session.error = `Bağlantı hatası: ${err instanceof Error ? err.message : String(err)}`;
        }
    }

    private clearSingletonLock(shopId: string) {
        try {
            const sessionPath = path.join(process.cwd(), '.whatsapp-auth', `session-shop-${shopId}`);
            if (!fs.existsSync(sessionPath)) return;

            const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

            // Ana dizindeki kilitler
            lockFiles.forEach(file => {
                const filePath = path.join(sessionPath, file);
                if (fs.existsSync(filePath)) {
                    console.log(`[WHATSAPP] Removing stale lock file: ${filePath}`);
                    try { fs.unlinkSync(filePath); } catch (e) { }
                }
            });

            // Default dizini altındaki kilitler (Chromium bazen buraya koyar)
            const defaultPath = path.join(sessionPath, 'Default');
            if (fs.existsSync(defaultPath)) {
                lockFiles.forEach(file => {
                    const filePath = path.join(defaultPath, file);
                    if (fs.existsSync(filePath)) {
                        console.log(`[WHATSAPP] Removing stale lock file in Default: ${filePath}`);
                        try { fs.unlinkSync(filePath); } catch (e) { }
                    }
                });
            }
        } catch (e) {
            console.error(`[WHATSAPP] Error clearing locks for ${shopId}:`, e);
        }
    }

    public getSessions() {
        return Object.entries(globalThis.whatsappSessions).map(([shopId, session]) => ({
            shopId,
            status: session?.status,
            qr: !!session?.qr,
            me: session?.me,
            error: session?.error
        }));
    }

    public getStatus(shopId: string) {
        const session = globalThis.whatsappSessions[shopId];
        return {
            status: session?.status || 'DISCONNECTED',
            qr: session?.qr,
            me: session?.me,
            error: session?.error
        };
    }

    public async sendMessage(shopId: string, to: string, message: string) {
        try {
            const session = await this.getSession(shopId);

            // Eğer bağlı değilse veya kuyruktaysa beklemeyelim, hata fırlatalım
            if (session.status !== 'CONNECTED') {
                // Initialize but don't await, let it connect for next time
                this.initialize(shopId);
                throw new Error('WhatsApp bağlı değil.');
            }

            // Numara formatla (+ sil, @c.us ekle)
            let formattedTo = to.replace(/\D/g, '');
            if (!formattedTo.endsWith('@c.us')) {
                formattedTo += '@c.us';
            }

            console.log(`[WHATSAPP] Sending message to ${formattedTo} for shop ${shopId}`);
            await session.client.sendMessage(formattedTo, message);
            return { success: true };
        } catch (error: any) {
            console.error(`[WHATSAPP] Send message error for ${shopId}:`, error);
            throw error;
        }
    }
}

export const whatsappManager = new WhatsAppManager();
