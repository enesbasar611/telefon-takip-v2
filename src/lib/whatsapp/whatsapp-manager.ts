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
                // Clear the session directory if logout to allow fresh login
                // (Handled by whatsapp-web.js LocalAuth)
            } else {
                session.error = "Bağlantı koptu. Telefonunuzun internete bağlı olduğundan emin olun.";
            }
        });
    }

    public async initialize(shopId: string) {
        const session = this.getSession(shopId);
        if (session.status === 'CONNECTED' || session.status === 'CONNECTING') return;

        try {
            session.status = 'CONNECTING';
            await session.client.initialize();
        } catch (err) {
            console.error(`[WHATSAPP] Init error ${shopId}`, err);
            session.status = 'DISCONNECTED';
        }
    }

    public async getStatus(shopId: string) {
        const session = this.getSession(shopId);

        let actualStatus = session.status;
        try {
            const state = await session.client.getState();
            if (state === 'CONNECTED') {
                actualStatus = 'CONNECTED';
            } else if (state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNLAUNCHED') {
                if (actualStatus !== 'QR' && actualStatus !== 'CONNECTING') {
                    actualStatus = 'DISCONNECTED';
                }
            }
        } catch (e) {
            // Event based status
        }

        return {
            status: actualStatus,
            qr: session.qr,
            error: session.error,
            me: session.me
        };
    }

    public async sendMessage(shopId: string, to: string, message: string) {
        const session = this.getSession(shopId);

        if (session.status !== 'CONNECTED') {
            if (session.status === 'DISCONNECTED') {
                this.initialize(shopId).catch(console.error);
            }

            let attempts = 0;
            while ((session.status as any) !== 'CONNECTED' && attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                if ((session.status as any) === 'QR') {
                    throw new Error('WhatsApp bağlantısı kurulmamış. Lütfen ayarlardan QR kodu taratın.');
                }
            }

            if ((session.status as any) !== 'CONNECTED') {
                throw new Error('WhatsApp henüz hazır değil veya bağlı değil.');
            }
        }

        let formattedTo = to.replace(/\D/g, '');
        if (formattedTo.startsWith('0')) formattedTo = '90' + formattedTo.substring(1);
        else if (formattedTo.length === 10 && formattedTo.startsWith('5')) formattedTo = '90' + formattedTo;

        if (!formattedTo.includes('@c.us')) formattedTo = `${formattedTo}@c.us`;

        return await session.client.sendMessage(formattedTo, message);
    }

    public async logout(shopId: string) {
        const session = globalThis.whatsappSessions[shopId];
        if (!session) return;

        try {
            await session.client.logout();
            session.status = 'DISCONNECTED';
            session.qr = undefined;
            session.me = undefined;
        } catch (err) {
            console.error(`[WHATSAPP] Logout error ${shopId}`, err);
        }
    }
}

export const whatsappManager = new WhatsAppManager();
