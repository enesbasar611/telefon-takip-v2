import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

interface WhatsAppSession {
    client: Client;
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
    private getSession(shopId: string): WhatsAppSession {
        let session = globalThis.whatsappSessions[shopId];

        if (!session) {
            console.log(`[WHATSAPP] Creating new session for shop: ${shopId}`);
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

        client.on('qr', async (qr) => {
            console.log(`[WHATSAPP] QR Received for ${shopId}`);
            session.status = 'QR';
            session.error = undefined;
            session.qr = await qrcode.toDataURL(qr);
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

        client.on('auth_failure', (msg) => {
            console.error(`[WHATSAPP] Auth failure ${shopId}`, msg);
            session.status = 'DISCONNECTED';
            session.error = "Kimlik doğrulama hatası. Lütfen tekrar bağlanın.";
        });

        client.on('disconnected', (reason) => {
            console.log(`[WHATSAPP] Disconnected ${shopId}`, reason);
            session.status = 'DISCONNECTED';
            session.qr = undefined;
            session.me = undefined;

            if ((reason as any) === 'NAVIGATION') {
                session.error = "Tarayıcı navigasyon hatası.";
            } else if ((reason as any) === 'LOGOUT') {
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
        const session = this.getSession(shopId);

        if (!force && (session.status === 'CONNECTED' || session.status === 'CONNECTING' || session.status === 'QR')) {
            console.log(`[WHATSAPP] Session ${shopId} already exists with status: ${session.status}`);
            return;
        }

        if (force) {
            console.log(`[WHATSAPP] Force re-initializing ${shopId}`);
            try {
                await session.client.destroy().catch(() => { });
            } catch (e) { }
            delete globalThis.whatsappSessions[shopId];
            const newSession = this.getSession(shopId);
            return this.doInitialize(shopId, newSession);
        }

        return this.doInitialize(shopId, session);
    }

    private async doInitialize(shopId: string, session: WhatsAppSession): Promise<void> {
        try {
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
            session.error = (err as Error).message;
        }
    }

    public async getStatus(shopId: string) {
        const session = this.getSession(shopId);

        let actualStatus = session.status;
        try {
            const state = await session.client.getState().catch(() => null);
            if (state === 'CONNECTED') {
                actualStatus = 'CONNECTED';
                session.status = 'CONNECTED';
            } else if (!state || state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNLAUNCHED') {
                if (actualStatus !== 'QR' && actualStatus !== 'CONNECTING') {
                    actualStatus = 'DISCONNECTED';
                    session.status = 'DISCONNECTED';
                }
            }
        } catch (e) { }

        return {
            status: actualStatus,
            qr: session.qr,
            error: session.error,
            me: session.me
        };
    }

    public async sendMessage(shopId: string, to: string, message: string) {
        console.log(`[WHATSAPP] Sending message for shop ${shopId} to ${to}`);
        const session = this.getSession(shopId);

        // Ensure connected
        if (session.status !== 'CONNECTED') {
            await this.initialize(shopId).catch(() => { });

            let attempts = 0;
            // Status might change via event emitters
            while (attempts < 5) {
                const updatedSession = globalThis.whatsappSessions[shopId];
                if (updatedSession?.status === 'CONNECTED') break;
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            const currentStatus = (globalThis.whatsappSessions[shopId] as WhatsAppSession)?.status;
            if (currentStatus !== 'CONNECTED') {
                throw new Error('WhatsApp henüz hazır değil veya bağlı değil.');
            }
        }

        const formattedTo = to.includes('@c.us') ? to : `${to.replace(/\D/g, '')}@c.us`;
        try {
            const currentSession = globalThis.whatsappSessions[shopId];
            if (!currentSession) throw new Error("Oturum bulunamadı");
            return await currentSession.client.sendMessage(formattedTo, message);
        } catch (error) {
            console.error(`[WHATSAPP] Send error ${shopId}`, error);
            throw error;
        }
    }
}

export const whatsappManager = new WhatsAppManager();
