import axios from 'axios';
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

export interface EdmCredentials {
    username: string;
    password: string;
    secretKey?: string;
    senderVkn: string;
    senderName?: string;
    senderAddress?: string;
    senderCity?: string;
    senderDistrict?: string;
    senderTaxOffice?: string;
    baseUrl: string;
}

export interface EdmSession {
    sessionId: string;
    username: string;
    expiresAt: Date;
}

export interface EdmInvoiceLineItem {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    unitCode?: string;
}

export interface EdmInvoicePayload {
    invoiceId: string;
    issueDate: string;
    customer: {
        name: string;
        vknTckn: string;
        taxOffice?: string;
        address?: string;
        city?: string;
        district?: string;
        email?: string;
        phone?: string;
    };
    items: EdmInvoiceLineItem[];
    currency?: string;
    notes?: string;
    invoiceType?: "SATIS" | "IADE" | "TEVKIFAT";
    /** e-Fatura profili: TICARIFATURA veya TEMELFATURA (e-Arşiv için otomatik EARSIV atanır) */
    invoiceProfile?: "TICARIFATURA" | "TEMELFATURA" | "EARSIV";
}

export interface CheckUserResult {
    isEInvoice: boolean;
    alias?: string;
    message: string;
}

export interface SendInvoiceResult {
    success: boolean;
    uuid: string;
    invoiceId: string;
    invoiceType: string;
    viewUrl: string;
    error?: string;
    rawResponse?: any;
}

const sessionCache = new Map<string, EdmSession>();

function getRequestHeader(sessionId?: string) {
    const rawDate = new Date();
    const isoDate = rawDate.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ

    const header: any = {
        clienT_TXN_ID: uuidv4(),
        sessioN_ID: sessionId || "0",
        actioN_DATE: isoDate,
        actioN_DATESpecified: true,
        applicatioN_NAME: "Telefon Takip v2",
        hostname: "Server",
        channeL_NAME: "REST",
        reason: "API Islem",
        compressed: "N",
        intL_TXN_ID: 0,
        intL_TXN_IDSpecified: true,
        intL_PARENT_TXN_ID: 0,
        intL_PARENT_TXN_IDSpecified: true,
        simulatioN_FLAG: "N"
    };

    return header;
}

// FIX #1: Swagger uyumlu çağrı — requesT_HEADER ve root-level case-sensitivity
async function callEdm(endpoint: string, body: any, credentials: EdmCredentials, sessionId?: string) {
    const cleanBaseUrl = credentials.baseUrl.trim().replace(/\/+$/, '');
    const cleanEndpoint = endpoint.trim().startsWith('/') ? endpoint.trim() : `/${endpoint.trim()}`;
    const url = `${cleanBaseUrl}${cleanEndpoint}`;

    const header = getRequestHeader(sessionId);

    const requestBody: any = {
        requesT_HEADER: header,
        ...body
    };

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'accept': 'text/plain'
            },
            timeout: 30000
        });

        // Swagger'da dönüşlerde REQUEST_RETURN / requesT_RETURN yapıları var
        const resData = response.data;
        const returnData = resData?.requesT_RETURN || resData?.REQUEST_RETURN || resData?.request_return;

        if (returnData && (returnData.returN_CODE !== 0 && returnData.RETURN_CODE !== 0)) {
            throw new Error(returnData.warnings?.join(", ") || returnData.ERROR_DESC || 'EDM API Hatası');
        }
        return resData;
    } catch (error: any) {
        const edmError = error.response?.data?.requesT_RETURN?.ERROR_DESC ||
            error.response?.data?.ERROR_DESC ||
            error.message;

        console.error(`[EDM REST ${endpoint} Error]:`, error.response?.data || error.message);
        throw new Error(`EDM Bağlantı Hatası: ${edmError}`);
    }
}

export async function getEdmRestSession(credentials: EdmCredentials): Promise<EdmSession> {
    const cacheKey = credentials.username;
    const cached = sessionCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) return cached;

    // SWAGGER'dan BİREBİR: En kritik harf duyarlılıkları (useR_NAME, password)
    // Secret Key boştur (Test'te onaylandı)
    const data = await callEdm('/LoginRequest', {
        useR_NAME: credentials.username,
        password: credentials.password,
        secreT_KEY: credentials.secretKey || ""
    }, credentials);

    // Dönen session id'yi ayıkla
    const sId = data?.sessioN_ID || data?.SESSION_ID || data?.requesT_RETURN?.sessioN_ID || data?.REQUEST_RETURN?.SESSION_ID;

    if (!sId || sId === "0") {
        throw new Error("EDM Girişi başarısız, oturum ID alınamadı.");
    }

    const session = {
        sessionId: sId,
        username: credentials.username,
        expiresAt: new Date(Date.now() + 25 * 60 * 1000)
    };
    sessionCache.set(cacheKey, session);
    return session;
}

export async function checkEdmUser(credentials: EdmCredentials, taxNumber: string): Promise<CheckUserResult> {
    try {
        const session = await getEdmRestSession(credentials);
        const data = await callEdm('/CheckUserRequestCounter', {
            command: "PROCESS",
            user: {
                identifier: taxNumber
            }
        }, credentials, session.sessionId);

        const users = data?.USER_LIST || data?.useR_LIST || data?.user_list || [];
        if (users.length > 0) {
            const aliasList = users[0]?.ALIAS_LIST || users[0]?.aliaS_LIST || [];
            const alias = aliasList[0]?.alias || users[0]?.ALIAS || "default";
            return { isEInvoice: true, alias, message: "Mükellef e-Fatura kullanıcısı." };
        }
        return { isEInvoice: false, message: "Mükellef e-Arşiv kullanıcısı." };
    } catch (e: any) {
        return { isEInvoice: false, message: `Sorgulama başarısız: ${e.message}` };
    }
}

export async function sendRestInvoice(
    credentials: EdmCredentials,
    payload: EdmInvoicePayload,
    invoiceType: "efatura" | "earsiv",
    receiverAlias?: string
): Promise<SendInvoiceResult> {
    const session = await getEdmRestSession(credentials);
    const uuid = uuidv4();
    const subtotal = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);

    const isEar = invoiceType === "earsiv";
    // FIX #3: Tarih formatı YYYY-MM-DD — saatsiz, EDM şema validasyonu bunu bekliyor
    const pureDate = new Date(payload.issueDate).toISOString().split('T')[0];

    // GİB/EDM Standartları — PROFILE ve TYPE string olarak büyük harfle gönderilmeli
    // e-Arşiv → PROFILE: "EARSIV", TYPE: "SATIS" veya "IADE"
    // e-Fatura → PROFILE: "TICARIFATURA" veya "TEMELFATURA", TYPE: "SATIS" veya "IADE"
    const invoiceProfile: string = isEar
        ? "EARSIV"
        : (payload.invoiceProfile || "TICARIFATURA");

    const invoiceTypeStr: string = payload.invoiceType === "IADE" ? "IADE" : "SATIS";

    console.log(`[EDM REST] Fatura profil: ${invoiceProfile}, tip: ${invoiceTypeStr}, senaryo: ${isEar ? 'e-Arşiv' : 'e-Fatura'}`);

    const invoiceModel = {
        invoicE_HEADER: {
            profilE_ID: invoiceProfile,   // "EARSIV" | "TICARIFATURA" | "TEMELFATURA"
            invoicE_ID: payload.invoiceId,
            uuiD: uuid,
            issuE_DATE: pureDate,
            issuE_TIME: new Date().toTimeString().split(' ')[0],
            invoicE_TYPE: invoiceTypeStr, // "SATIS" | "IADE"
            notE: payload.notes || "",
            currencY_CODE: payload.currency || "TRY",
            sendeR_PARTY: {
                vkn: credentials.senderVkn,
                city: credentials.senderCity || "Istanbul",
                county: credentials.senderDistrict || "",
                adress: credentials.senderAddress || "Merkez",
                adsoyad: credentials.senderName || "Gönderici İşletme"
            },
            customeR_PARTY: {
                vkn: payload.customer.vknTckn,
                pk: receiverAlias || (isEar ? "" : "urn:mail:defaultpk@edmbilisim.com.tr"),
                city: payload.customer.city || "Istanbul",
                county: payload.customer.district || "",
                adress: payload.customer.address || "Merkez Mah.",
                adsoyad: payload.customer.name,
                // FAQ: TCKN için Person/Ad-Soyad ayrımı gerekebilir
                ...(payload.customer.vknTckn.length === 11 ? {
                    firstname: payload.customer.name.split(' ').slice(0, -1).join(' ') || payload.customer.name,
                    lastname: payload.customer.name.split(' ').slice(-1)[0] || ""
                } : {})
            }
        },
        invoicE_LINE: payload.items.map(item => ({
            quantity: item.quantity,
            price: item.unitPrice,
            percent: Math.round(item.vatRate),
            name: item.name,
            unitcode: item.unitCode || "C62"
        })),
        invoicE_TOTAL: { total: subtotal, totalkdv: taxTotal }
    };

    try {
        // EDM hem büyük harfli INVOICE sarmalı ister, hem de içindeki nesneleri 
        // bu sarmalın içinde büyük harfli varyasyonlarla (veya mevcut yapısıyla) bekler.
        const data = await callEdm('/LoadInvoiceRequestModel', {
            command: "PROCESS",
            INVOICE: {
                INVOICESERIAL_REQUESTED: payload.invoiceId.substring(0, 3) || "ETS",
                INVOICE_HEADER: invoiceModel.invoicE_HEADER,
                INVOICE_LINE: invoiceModel.invoicE_LINE,
                INVOICE_TOTAL: invoiceModel.invoicE_TOTAL
            }
        }, credentials, session.sessionId);

        if (data?.sonuc === false || data?.SONUC === false || data?.Sonuc === false) {
            const errorMsg = data?.error || data?.ERROR || data?.erroR || data?.Message || "Fatura gönderilemedi.";
            throw new Error(errorMsg);
        }

        const realInvoiceId = data?.invoice?.id || data?.INVOICE?.id || payload.invoiceId;

        return {
            success: true,
            uuid,
            invoiceId: realInvoiceId,
            invoiceType,
            viewUrl: getInvoiceViewUrl(credentials.senderVkn, uuid, invoiceType),
            rawResponse: data
        };
    } catch (e: any) {
        return {
            success: false,
            uuid,
            invoiceId: payload.invoiceId,
            invoiceType,
            viewUrl: getInvoiceViewUrl(credentials.senderVkn, uuid, invoiceType),
            error: e.message
        };
    }
}

export { sendRestInvoice as sendInvoice };

export function getInvoiceViewUrl(senderVkn: string, uuid: string, type: "efatura" | "earsiv") {
    // Test ortamında EDM kendi VKN'sini (3230512384) bastığı için render linkini buna jurnalliyoruz kanka
    const vkn = senderVkn === "3230512384" ? "3230512384" : (senderVkn || "3230512384");
    return `https://view.edmbilisim.com.tr/fatura/ViewInvoice/${vkn}/${uuid}/${type}`;
}

export async function getInvoices(credentials: EdmCredentials, filters: { startDate?: string; endDate?: string; direction?: "INBOUND" | "OUTBOUND" }) {
    const session = await getEdmRestSession(credentials);
    const formatDate = (dateStr: string) => dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`;

    const body = {
        invoicE_SEARCH_KEY: {
            starT_DATE: filters.startDate ? formatDate(filters.startDate) : undefined,
            enD_DATE: filters.endDate ? formatDate(filters.endDate) : undefined,
            invoicE_DIRECTION: filters.direction || "OUTBOUND",
            limiT: 100
        },
        headeR_ONLY: "Y",
        invoicE_CONTENT_TYPE: 0
    };

    try {
        const data = await callEdm('/GetInvoiceRequest', body, credentials, session.sessionId);
        return data?.invoicE_LIST || data?.INVOICE_LIST || [];
    } catch {
        return [];
    }
}

export async function getInvoiceHTML(credentials: EdmCredentials, uuid: string, type: "efatura" | "earsiv", invoiceId?: string) {
    const session = await getEdmRestSession(credentials);

    // Kanka hem UUID hem de varsa Fatura ID ile arayalım, bazı sunucular UUID'de 503 basabilive
    const body = {
        invoicE_SEARCH_KEY: {
            uuid: uuid,
            ...(invoiceId && { invoicE_ID: invoiceId }),
            invoicE_DIRECTION: "OUTBOUND",
            limiT: 1
        },
        headeR_ONLY: "N",
        invoicE_CONTENT_TYPE: 1
    };

    try {
        const data = await callEdm('/GetInvoiceRequest', body, credentials, session.sessionId);
        const invoices = data?.invoicE_LIST || data?.INVOICE_LIST || [];

        if (invoices.length === 0) {
            // UUID bulamadıysa sadece ID ile son bir şans
            if (invoiceId) {
                const retryBody = { ...body, invoicE_SEARCH_KEY: { invoicE_ID: invoiceId, invoicE_DIRECTION: "OUTBOUND", limiT: 1 } };
                const retryData = await callEdm('/GetInvoiceRequest', retryBody, credentials, session.sessionId);
                const retryInvoices = retryData?.invoicE_LIST || retryData?.INVOICE_LIST || [];
                if (retryInvoices.length > 0) return Buffer.from(retryInvoices[0]?.INVOICE_CONTENT || retryInvoices[0]?.invoicE_CONTENT, 'base64').toString('utf-8');
            }
            throw new Error("Fatura EDM sisteminde bulunamadı.");
        }

        const content = invoices[0]?.INVOICE_CONTENT || invoices[0]?.invoicE_CONTENT;
        if (!content) throw new Error("Fatura içeriği (HTML) boş geldi.");

        return Buffer.from(content, 'base64').toString('utf-8');
    } catch (error: any) {
        console.error("[EDM GetHTML Error]:", error.message);
        throw error; // Route tarafında yakalayıp redirect atacağız
    }
}

// FIX #5: secretKey desteği eklendi
export async function getShopEdmCredentials(shopId: string): Promise<EdmCredentials> {
    const [settings, shop] = await Promise.all([
        prisma.eDMSettings.findUnique({ where: { shopId } }),
        prisma.shop.findUnique({ where: { id: shopId } })
    ]);

    if (!settings || !settings.edmActive) {
        throw new Error("Bu dükkan için e-Fatura entegrasyonu aktif değil.");
    }
    if (!settings.username || !settings.passwordEncrypted) {
        throw new Error("EDM kullanıcı adı veya şifresi eksik.");
    }

    const password = Buffer.from(settings.passwordEncrypted, "base64").toString("utf-8");

    return {
        username: settings.username,
        password,
        secretKey: (settings as any).secretKey || undefined,
        senderVkn: settings.senderVkn || shop?.taxNumber || "",
        senderName: settings.senderName || shop?.companyName || shop?.name || "Bilinmeyen Ünvan",
        senderAddress: settings.senderAddress || shop?.address || "Belirtilmemiş",
        senderCity: settings.senderCity || shop?.companyCity || "İstanbul",
        senderDistrict: settings.senderDistrict || shop?.companyDistrict || "Merkez",
        senderTaxOffice: settings.senderTaxOffice || shop?.taxOffice || "Merkez",
        baseUrl: settings.apiUrl || process.env.EDM_REST_API_URL || "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test"
    };
}
