/**
 * WHATSAPP MANAGER - DEPRECATED
 * Server-side WhatsApp (Puppeteer) has been removed in favor of client-side integration.
 * This class remains as a stub to avoid breaking references during transition.
 */

class WhatsAppManager {
    constructor() {
        console.log("[WHATSAPP] Server-side WhatsApp manager initialized (STUB MODE - Client-side only)");
    }

    public async initialize(shopId: string, force = false): Promise<void> {
        return;
    }

    public async autoInitializeAll() {
        return;
    }

    public getSessions() {
        return [];
    }

    public async getStatus(shopId: string) {
        return {
            status: 'DISCONNECTED' as const,
            qr: undefined,
            me: undefined,
            error: "Sistem güncellendi. WhatsApp artık tarayıcınız veya telefonunuz üzerinden doğrudan gönderim yapar. Sunucu tarafı bağlantısı kaldırılmıştır.",
            errorCode: undefined
        };
    }

    public async logout(shopId: string) {
        return;
    }

    public async wakeUp(shopId: string): Promise<void> {
        return;
    }

    public async sendMessage(shopId: string, to: string, message: string) {
        throw new Error('Sistem Güncellendi: WhatsApp mesajları artık doğrudan tarayıcı üzerinden gönderiliyor. Lütfen sayfayı yenileyin.');
    }
}

export const whatsappManager = new WhatsAppManager();
