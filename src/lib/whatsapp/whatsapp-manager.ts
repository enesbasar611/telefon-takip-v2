import type { Client as WhatsAppClient } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

interface WhatsAppSession {
    client: WhatsAppClient;
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR' | 'SLEEPING';
    qr?: string;
    error?: string;
    errorCode?: 'LOGGED_OUT_BY_PHONE' | 'AUTH_FAILURE' | 'CONNECTION_LOST' | 'NAVIGATION' | 'TIMEOUT';
    me?: { name: string; number: string };
    lastActivity?: number;
}

declare global {
    var whatsappSessions: Record<string, WhatsAppSession | undefined>;
    var whatsappInitializing: Set<string>;
    var whatsappSleeping: Record<string, { me?: { name: string; number: string }; sleepTime: number } | undefined>;
}

if (!globalThis.whatsappSessions) {
    globalThis.whatsappSessions = {};
}

if (!globalThis.whatsappInitializing) {
    globalThis.whatsappInitializing = new Set();
}
if (!globalThis.whatsappSleeping) {
    globalThis.whatsappSleeping = {};
}

class WhatsAppManager {
    constructor() {
        this.startCleanupInterval();
    }

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
            session.errorCode = undefined;
            session.qr = undefined;
            session.lastActivity = Date.now();

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
            session.errorCode = undefined;
        });

        client.on('auth_failure', (msg: any) => {
            console.error(`[WHATSAPP] Auth failure ${shopId}`, msg);
            session.status = 'DISCONNECTED';
            session.error = "Kimlik doğrulama hatası. Lütfen tekrar bağlanın.";
            session.errorCode = 'AUTH_FAILURE';
        });

        client.on('disconnected', (reason: any) => {
            console.log(`[WHATSAPP] Disconnected ${shopId}`, reason);
            session.status = 'DISCONNECTED';
            session.qr = undefined;
            session.me = undefined;

            if (reason === 'NAVIGATION') {
                session.error = "Tarayıcı navigasyon hatası.";
                session.errorCode = 'NAVIGATION';
            } else if (reason === 'LOGOUT') {
                session.error = "Telefonunuzdan bağlı cihazlar kısmından çıkış yapıldı. Lütfen WhatsApp'ı yeniden bağlayın.";
                session.errorCode = 'LOGGED_OUT_BY_PHONE';
                // Telefondan çıkış yapıldığında session'ı temizle
                try {
                    session.client.destroy().catch(() => { });
                } catch (e) { }
                delete globalThis.whatsappSessions[shopId];
            } else {
                session.error = "Bağlantı koptu. Telefonunuzun internete bağlı olduğundan emin olun.";
                session.errorCode = 'CONNECTION_LOST';
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
        // Zaten başlatılıyorsa (Race condition önleyici)
        if (globalThis.whatsappInitializing.has(shopId)) {
            console.log(`[WHATSAPP] Session ${shopId} is already initializing...`);
            return;
        }

        const session = await this.getSession(shopId);

        if (!force && (session.status === 'CONNECTED' || session.status === 'CONNECTING' || session.status === 'QR')) {
            console.log(`[WHATSAPP] Session ${shopId} already exists with status: ${session.status}`);
            return;
        }

        globalThis.whatsappInitializing.add(shopId);

        try {
            if (force) {
                console.log(`[WHATSAPP] Force re-initializing ${shopId}`);
                try {
                    await session.client.destroy().catch(() => { });
                    this.clearSingletonLock(shopId);
                } catch (e) { }
                delete globalThis.whatsappSessions[shopId];
                const newSession = await this.getSession(shopId);
                await this.doInitialize(shopId, newSession);
            } else {
                await this.doInitialize(shopId, session);
            }
        } catch (error) {
            globalThis.whatsappInitializing.delete(shopId);
            throw error;
        } finally {
            globalThis.whatsappInitializing.delete(shopId);
        }
    }

    public async autoInitializeAll() {
        try {
            const { default: prisma } = await import('@/lib/prisma');

            const autoInitSettings = await prisma.setting.findMany({
                where: {
                    key: 'whatsappAutoInit',
                    value: 'true'
                },
                select: { shopId: true }
            });

            console.log(`[WHATSAPP] Auto-initializing ${autoInitSettings.length} shops...`);

            for (const setting of autoInitSettings) {
                // Beklemeden başlat (paralel)
                this.initialize(setting.shopId).catch(err => {
                    console.error(`[WHATSAPP] Auto-init failed for ${setting.shopId}:`, err);
                });
            }
        } catch (error) {
            console.error('[WHATSAPP] Auto-initialize error:', error);
        }
    }

    private startCleanupInterval() {
        const IDLE_TIMEOUT = 1000 * 60 * 30; // 30 dakika inaktivite
        const CHECK_INTERVAL = 1000 * 60 * 5; // 5 dakikada bir kontrol

        setInterval(() => {
            const now = Date.now();
            Object.entries(globalThis.whatsappSessions).forEach(([shopId, session]) => {
                if (!session || globalThis.whatsappInitializing.has(shopId)) return;

                // Bağlı ve uzun süredir inaktif olan sessionları uyku moduna al
                if (session.status === 'CONNECTED' && session.lastActivity) {
                    const idle = now - session.lastActivity;
                    if (idle > IDLE_TIMEOUT) {
                        console.log(`[WHATSAPP] Putting ${shopId} to sleep (idle ${Math.round(idle / 60000)}min)`);
                        session.status = 'SLEEPING';
                        // Chromium'u kapat ama session verisini (me, auth) koru
                        session.client.destroy().catch(() => { });
                        delete globalThis.whatsappSessions[shopId];
                        // Sleeping durumunu geçici olarak sakla (globalThis üzerinde)
                        if (!globalThis.whatsappSleeping) globalThis.whatsappSleeping = {};
                        globalThis.whatsappSleeping[shopId] = {
                            me: session.me,
                            sleepTime: now
                        };
                    }
                }

                // Disconnected ve hatalı sessionları temizle (kaynak tasarrufu)
                if (session.status === 'DISCONNECTED' && session.errorCode !== 'LOGGED_OUT_BY_PHONE') {
                    const lastAct = session.lastActivity || 0;
                    if (now - lastAct > IDLE_TIMEOUT) {
                        console.log(`[WHATSAPP] Cleaning up stale disconnected session: ${shopId}`);
                        try { session.client.destroy().catch(() => { }); } catch (e) { }
                        delete globalThis.whatsappSessions[shopId];
                    }
                }
            });
        }, CHECK_INTERVAL);
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

    public async getStatus(shopId: string) {
        let session = globalThis.whatsappSessions[shopId];
        const sleeping = globalThis.whatsappSleeping?.[shopId];

        // Uyku modundaysa bilgileri döndür
        if (!session && sleeping) {
            return {
                status: 'SLEEPING' as const,
                qr: undefined,
                me: sleeping.me,
                error: undefined,
                errorCode: undefined
            };
        }

        // Lazy Auto-Init: Eğer session yoksa ve otomatik başlatma aktifse başlat
        if (!session && !globalThis.whatsappInitializing.has(shopId)) {
            try {
                this.checkAndAutoInit(shopId);
            } catch (e) { }
        }

        return {
            status: session?.status || 'DISCONNECTED',
            qr: session?.qr,
            me: session?.me,
            error: session?.error,
            errorCode: session?.errorCode
        };
    }

    private async checkAndAutoInit(shopId: string) {
        try {
            const { default: prisma } = await import('@/lib/prisma');
            const autoInitSetting = await prisma.setting.findUnique({
                where: { shopId_key: { shopId, key: 'whatsappAutoInit' } }
            });

            if (autoInitSetting?.value === 'true') {
                console.log(`[WHATSAPP] Lazy auto-init triggered for shop: ${shopId}`);
                this.initialize(shopId).catch(() => { });
            }
        } catch (e) { }
    }

    /** Uyku modundaki bir session'ı uyandır (re-initialize) */
    public async wakeUp(shopId: string): Promise<void> {
        // Sleeping state'i temizle
        if (globalThis.whatsappSleeping?.[shopId]) {
            delete globalThis.whatsappSleeping[shopId];
        }
        console.log(`[WHATSAPP] Waking up session for ${shopId}`);
        await this.initialize(shopId, true);
    }

    public async sendMessage(shopId: string, to: string, message: string) {
        try {
            let session = globalThis.whatsappSessions[shopId];
            const isSleeping = globalThis.whatsappSleeping?.[shopId];

            // Uyku modunda veya bağlı değilse uyandırmayı dene
            if (!session || session.status !== 'CONNECTED') {
                const sessionErrorCode = session?.errorCode;
                if (isSleeping || !session) {
                    // Lazy wake: uyandır ve yeniden bağlan
                    console.log(`[WHATSAPP] Lazy wake for message send - shop: ${shopId}`);
                    await this.wakeUp(shopId);

                    // Yeniden bağlanmayı bekle (max 30 saniye)
                    let waitedMs = 0;
                    while (waitedMs < 30000) {
                        session = globalThis.whatsappSessions[shopId];
                        if (session?.status === 'CONNECTED') break;
                        await new Promise(r => setTimeout(r, 2000));
                        waitedMs += 2000;
                    }

                    session = globalThis.whatsappSessions[shopId];
                    if (!session || session.status !== 'CONNECTED') {
                        throw new Error('WhatsApp uyandırılamadı. Lütfen ayarlardan bağlantıyı kontrol edin.');
                    }
                } else if (sessionErrorCode === 'LOGGED_OUT_BY_PHONE') {
                    throw new Error('LOGGED_OUT_BY_PHONE');
                } else {
                    this.initialize(shopId).catch(() => { });
                    throw new Error('WhatsApp bağlı değil. Lütfen Ayarlar > Modüller > WhatsApp bölümünden bağlantıyı başlatın.');
                }
            }

            // Aktivite zamanını güncelle
            session.lastActivity = Date.now();

            // Numara formatla
            let formattedTo = to.replace(/\D/g, '');

            // Uluslararası numara desteği (+) ile başlama durumu
            if (to.startsWith('+')) {
                // + zaten kaldırıldı replace ile, direkt kullan
            } else if (formattedTo.length === 10 && formattedTo.startsWith('5')) {
                // Türkiye: 5xx... -> 905xx...
                formattedTo = '90' + formattedTo;
            } else if (formattedTo.length === 11 && formattedTo.startsWith('05')) {
                // Türkiye: 05xx... -> 905xx...
                formattedTo = '90' + formattedTo.substring(1);
            }

            if (!formattedTo.endsWith('@c.us') && !formattedTo.endsWith('@g.us')) {
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
