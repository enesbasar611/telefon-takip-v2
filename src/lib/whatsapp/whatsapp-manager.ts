import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

declare global {
    var whatsappClient: Client | undefined;
    var whatsappQr: string | undefined;
    var whatsappStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR';
    var whatsappError: string | undefined;
}

globalThis.whatsappStatus = globalThis.whatsappStatus || 'DISCONNECTED';
globalThis.whatsappError = globalThis.whatsappError || undefined;

class WhatsAppManager {
    private client: Client;

    constructor() {
        if (globalThis.whatsappClient) {
            this.client = globalThis.whatsappClient;
            return;
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'dukkan-app-v2',
                dataPath: './.whatsapp-auth'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.setupEventListeners();
        globalThis.whatsappClient = this.client;
    }

    private setupEventListeners() {
        this.client.on('qr', async (qr) => {
            console.log('[WHATSAPP] QR Received');
            globalThis.whatsappStatus = 'QR';
            globalThis.whatsappError = undefined;
            globalThis.whatsappQr = await qrcode.toDataURL(qr);
        });

        this.client.on('ready', () => {
            console.log('[WHATSAPP] Client is ready!');
            globalThis.whatsappStatus = 'CONNECTED';
            globalThis.whatsappError = undefined;
            globalThis.whatsappQr = undefined;
        });

        this.client.on('authenticated', () => {
            console.log('[WHATSAPP] Authenticated');
            globalThis.whatsappError = undefined;
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WHATSAPP] Auth failure', msg);
            globalThis.whatsappStatus = 'DISCONNECTED';
            globalThis.whatsappError = "Kimlik doğrulama hatası. Lütfen tekrar bağlanın.";
        });

        this.client.on('disconnected', (reason) => {
            console.log('[WHATSAPP] Disconnected', reason);
            globalThis.whatsappStatus = 'DISCONNECTED';
            globalThis.whatsappQr = undefined;

            if ((reason as any) === 'NAVIGATION') {
                globalThis.whatsappError = "Tarayıcı navigasyon hatası.";
            } else if ((reason as any) === 'LOGOUT') {
                globalThis.whatsappError = "Oturum kapatıldı.";
            } else {
                globalThis.whatsappError = "Bağlantı koptu. Telefonunuzun internete bağlı olduğundan emin olun.";
            }
        });
    }

    public async initialize() {
        if (globalThis.whatsappStatus === 'CONNECTED' || globalThis.whatsappStatus === 'CONNECTING') return;

        try {
            globalThis.whatsappStatus = 'CONNECTING';
            await this.client.initialize();
        } catch (err) {
            console.error('[WHATSAPP] Init error', err);
            globalThis.whatsappStatus = 'DISCONNECTED';
        }
    }

    public getStatus() {
        return {
            status: globalThis.whatsappStatus,
            qr: globalThis.whatsappQr,
            error: globalThis.whatsappError
        };
    }

    public async sendMessage(to: string, message: string) {
        // If not connected, try to initialize and wait up to 20 seconds
        if (globalThis.whatsappStatus !== 'CONNECTED') {
            console.log('[WHATSAPP] Not connected, attempting auto-connect before sending...');

            if (globalThis.whatsappStatus === 'DISCONNECTED') {
                this.initialize().catch(err => console.error('[WHATSAPP] Auto-init error', err));
            }

            // Wait up to 20 seconds for connection
            let attempts = 0;
            while ((globalThis as any).whatsappStatus !== 'CONNECTED' && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;

                if ((globalThis as any).whatsappStatus === 'QR') {
                    throw new Error('WhatsApp bağlantısı kesilmiş. Lütfen Ayarlar -> WhatsApp kısmından QR kodu tekrar okutun.');
                }
            }

            if ((globalThis as any).whatsappStatus !== 'CONNECTED') {
                throw new Error('WhatsApp bağlantısı 20 saniye içerisinde kurulamadı. Lütfen telefonunuzun internetini kontrol edin veya Ayarlar kısmından bağlantıyı tazeleyin.');
            }
        }

        // Format number: Turkey numbers should be 905xxxxxxxxx
        let formattedTo = to.replace(/\D/g, '');
        if (formattedTo.startsWith('0')) {
            formattedTo = '90' + formattedTo.substring(1);
        } else if (formattedTo.length === 10 && formattedTo.startsWith('5')) {
            formattedTo = '90' + formattedTo;
        }

        if (!formattedTo.includes('@c.us')) {
            formattedTo = `${formattedTo}@c.us`;
        }

        return await this.client.sendMessage(formattedTo, message);
    }

    public async logout() {
        try {
            await this.client.logout();
            globalThis.whatsappStatus = 'DISCONNECTED';
            globalThis.whatsappQr = undefined;
        } catch (err) {
            console.error('[WHATSAPP] Logout error', err);
        }
    }
}

export const whatsappManager = new WhatsAppManager();

// Auto-initialize on import (server-side)
if (typeof window === 'undefined') {
    whatsappManager.initialize().catch(console.error);
}
