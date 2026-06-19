/**
 * EDM Bilişim REST + SOAP Client
 * Multi-Tenant SaaS yapısı ile uyumlu, REST API öncelikli entegrasyon.
 * 
 * REST API Base: https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test
 * Invoice View:  https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/{type}
 */

import axios from 'axios';
import { v4 as uuidv4 } from "uuid";

/* ─── Constants ─── */

const DEFAULT_SOAP_URL = "https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc";
const DEFAULT_REST_URL = "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test";
const INVOICE_VIEW_BASE = "https://view.edmbilisim.com.tr/fatura/ViewInvoice";

// Test ortamında e-Fatura simülasyonu için kullanılacak özel VKN
const TEST_EINVOICE_VKN = "1111111111";

/**
 * GİB uyumlu fatura numarası şablonu üretir.
 * Önemli: EDM dokümanına göre "BSR2009123456789" şablonu gönderilirse 
 * EDM otomatik olarak dükkanın sıradaki numarasını atar.
 */
export function generateGibInvoiceId(prefix: string = "BSR"): string {
    return `${prefix.substring(0, 3).toUpperCase()}2009123456789`;
}

/**
 * PROFILE_ID TEST ALTERNATIFLERI (Eğer TEMELINVOICE patlarsa sırayla dene):
 * - EFATURA: TEMELINVOICE, TICARIINVOICE, TEMEL, TICARI, TEMEL_FATURA, TICARI_FATURA, EFATURA
 * - EARSIV: EARSIVFATURA, EARSIV, EARSIV_FATURA
 */

/**
 * e-Fatura/e-Arşiv tipine göre doğru GİB ProfileID'sini döndürür.
 * EDM SOAP Enum Listesi: TEMELFATURA, TICARIFATURA, EARSIVFATURA
 */
function resolveProfileId(invoiceType: "efatura" | "earsiv", scenario?: string): string {
    if (invoiceType === "earsiv") return "EARSIVFATURA";
    if (scenario === "TICARI") return "TICARIFATURA";
    return "TEMELFATURA";
}

/** TEST ortamı için varsayılan GİB posta kutusu etiketi */
const DEFAULT_TEST_RECEIVER_ALIAS = "urn:mail:defaultpk@edmbilisim.com.tr";

/* ─── Types ─── */

export interface EdmCredentials {
    username: string;
    password: string;
    senderVkn: string;
    senderName?: string;
    senderAddress?: string;
    senderCity?: string;
    senderDistrict?: string;
    senderTaxOffice?: string;
    invoicePrefix?: string;
    baseUrl?: string;
    isRest?: boolean;
}

export interface EdmSession {
    sessionId: string;
    username: string;
    expiresAt: Date;
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
    invoiceType?: "SATIS" | "IADE";
    currency?: string;
    notes?: string;
    sequenceNumber?: number;
    [key: string]: any;
}

export interface EdmInvoiceLineItem {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    unitCode?: string;
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

/* ─── Session Cache ─── */

const sessionCache = new Map<string, EdmSession>();
const SESSION_TTL_MS = 25 * 60 * 1000;

export function forceClearSession(username: string) {
    console.log(`[EDM Session] Cache temizleniyor: ${username}`);
    sessionCache.delete(username);
    sessionCache.delete(`REST_${username}`);
}

/* ─── REST Request Header Builder (DRY) ─── */

function buildRestRequestHeader(sessionId?: string): any {
    const now = new Date().toISOString().split('.')[0]; // YYYY-MM-DDTHH:mm:ss
    return {
        // Uppercase Variations
        SESSION_ID: sessionId || "0",
        CLIENT_TXN_ID: uuidv4(),
        ACTION_DATE: now,
        REASON: "EDM REST API",
        APPLICATION_NAME: "BasarTeknikERP",
        HOSTNAME: "TakipV2",
        CHANNEL_NAME: "API",
        SIMULATION_FLAG: "N",
        COMPRESSED: "N",

        // Mixed Case Variations (Strict WCF compatibility)
        sessioN_ID: sessionId || "0",
        clienT_TXN_ID: uuidv4(),
        actioN_DATE: now,
        actioN_DATESpecified: true,
        reason: "EDM REST API",
        applicatioN_NAME: "BasarTeknikERP",
        hostname: "TakipV2",
        channeL_NAME: "API",
        simulatioN_FLAG: "N",
        compressed: "N"
    };
}

/* ─── REST Call Helper ─── */

async function callEdmRest(
    endpoint: string,
    body: any,
    sessionId?: string,
    baseUrl?: string
): Promise<any> {
    const restUrl = baseUrl || process.env.EDM_REST_API_URL || DEFAULT_REST_URL;
    const url = `${restUrl}${endpoint}`;

    try {
        const response = await axios.post(url, {
            REQUEST_HEADER: buildRestRequestHeader(sessionId),
            requesT_HEADER: buildRestRequestHeader(sessionId),
            ...body
        });

        // Check for warning/errors in the response
        const returnData = response.data?.requesT_RETURN || response.data?.REQUEST_RETURN;
        if (returnData?.returN_CODE && returnData.returN_CODE !== 0) {
            const warnings = returnData.warnings?.join(", ") || "Bilinmeyen hata";
            console.error(`[EDM REST Error] ${endpoint}: ${warnings}`);
            throw new Error(`EDM REST Hatası (${endpoint}): ${warnings}`);
        }

        return response.data;
    } catch (error: any) {
        console.error(`[EDM REST Error - ${endpoint}]:`, error.response?.data || error.message);
        throw new Error(`EDM REST Hatası (${endpoint}): ${error.message}`);
    }
}

/* ═══════════════════════════════════════════
   LOGIN (REST)
   ═══════════════════════════════════════════ */

export async function getEdmRestSession(credentials: EdmCredentials): Promise<EdmSession> {
    const cacheKey = `REST_${credentials.username}`;

    const cached = sessionCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
        console.log(`[EDM REST Session] Cache HIT: ${cacheKey}`);
        return cached;
    }

    console.log(`[EDM REST Login] Başlatılıyor...`);

    const data = await callEdmRest("/LoginRequest", {
        useR_NAME: credentials.username,
        password: credentials.password,
        // Uppercase fallbacks
        USER_NAME: credentials.username,
        PASSWORD: credentials.password
    }, undefined, credentials.baseUrl);

    const sessionId = data?.sessioN_ID;

    if (!sessionId || sessionId === "0") {
        const errorMsg = data?.requesT_RETURN?.warnings?.[0] || "Geçersiz yanıt.";
        throw new Error(`EDM REST Oturum Açılamadı: ${errorMsg}`);
    }

    const session: EdmSession = {
        sessionId,
        username: credentials.username,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    };

    sessionCache.set(cacheKey, session);
    console.log(`[EDM REST Session] Yeni Oturum Alındı: ${sessionId}`);
    return session;
}

/* ═══════════════════════════════════════════
   CHECK USER (Mükellef Sorgulama - REST)
   ═══════════════════════════════════════════ */

export async function checkEdmUser(
    credentials: EdmCredentials,
    taxNumber: string
): Promise<CheckUserResult> {
    const isTestEnv = (process.env.EDM_ENVIRONMENT || "TEST") === "TEST";

    // TEST ortamında özel VKN ile e-Fatura simülasyonu
    if (isTestEnv && taxNumber === TEST_EINVOICE_VKN) {
        console.log(`[EDM CheckUser] TEST MODU: VKN ${taxNumber} → e-Fatura mükellefi olarak simüle ediliyor.`);
        return {
            isEInvoice: true,
            alias: "urn:mail:defaultpk@edmbilisim.com.tr",
            message: "TEST: e-Fatura mükellefi (simülasyon)."
        };
    }

    try {
        const session = await getEdmRestSession(credentials);

        const endpoint = "/api/CheckUserRequest";
        const data = await callEdmRest(endpoint, {
            endpoint: endpoint,
            user: {
                identifier: taxNumber,
                documenttype: "INVOICE"
            }
        }, session.sessionId, credentials.baseUrl);

        console.log(`[EDM CheckUser] Ham Yanıt (${taxNumber}):`, JSON.stringify(data, null, 2));

        // EDM REST CheckUser yanıtında kullanıcı listesi var mı kontrol et
        const users = data?.useR_LIST || data?.user_list || data?.users || [];
        const hasEInvoice = Array.isArray(users) && users.length > 0;

        if (hasEInvoice) {
            const firstUser = users[0];
            const alias = firstUser?.aliaS_LIST?.[0]?.alias ||
                firstUser?.alias_list?.[0]?.alias ||
                firstUser?.ALIAS ||
                firstUser?.alias ||
                "default";

            console.log(`[EDM CheckUser] Mükellef Bulundu: ${taxNumber} | Alias: ${alias}`);
            return {
                isEInvoice: true,
                alias,
                message: "Mükellef e-Fatura kullanıcısı."
            };
        }

        console.log(`[EDM CheckUser] Mükellef e-Arşiv: ${taxNumber}`);
        return {
            isEInvoice: false,
            message: "Mükellef e-Arşiv kullanıcısı (e-Fatura kaydı bulunamadı)."
        };
    } catch (error: any) {
        console.warn(`[EDM CheckUser] Sorgu başarısız, e-Arşiv varsayıldı: ${error.message}`);
        return {
            isEInvoice: false,
            message: `Sorgulama başarısız (e-Arşiv varsayıldı): ${error.message}`
        };
    }
}

/* ═══════════════════════════════════════════
   INVOICE VIEW URL BUILDER
   ═══════════════════════════════════════════ */

export function getInvoiceViewUrl(
    senderVkn: string,
    ettn: string,
    type: "efatura" | "earsiv"
): string {
    /**
     * EDM Public View Link (Path Format)
     * Format: https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/{TYPE}
     */
    return `https://view.edmbilisim.com.tr/fatura/ViewInvoice/${senderVkn}/${ettn}/${type}`;
}

/* ═══════════════════════════════════════════
   SEND INVOICE (REST - e-Fatura / e-Arşiv)
   ═══════════════════════════════════════════ */

import { buildInvoiceUblXml } from "./xml-builder";

export async function sendRestInvoice(
    credentials: EdmCredentials,
    payload: EdmInvoicePayload,
    invoiceType: "efatura" | "earsiv",
    receiverAlias?: string
): Promise<SendInvoiceResult> {
    const session = await getEdmRestSession(credentials);
    const uuid = uuidv4();
    const vkn = credentials.senderVkn;

    // Resmi EDM "Automatic Invoice ID" kuralına göre sabit şablon gönderiyoruz.
    // EDM bu şablonu görünce sıradaki boş numarayı otomatik üretip faturaya basacak.
    const prefix = (payload.invoiceId && /^[A-Z]{3}/i.test(payload.invoiceId))
        ? payload.invoiceId.substring(0, 3).toUpperCase()
        : (credentials.invoicePrefix || "BSR");
    const gibInvoiceId = generateGibInvoiceId(prefix);
    const profileId = resolveProfileId(invoiceType, payload.invoiceScenario);

    console.log(`[EDM SendInvoice] ${invoiceType.toUpperCase()} gönderiliyor: ${gibInvoiceId} (Otomatik Numaratör Şablonu) | UUID: ${uuid} | ProfileID: ${profileId}`);

    // UBL XML Oluştur
    const xml = buildInvoiceUblXml({
        uuid,
        invoiceId: gibInvoiceId,
        issueDate: payload.issueDate,
        invoiceScenario: profileId,
        invoiceType: payload.invoiceType || "SATIS",
        currency: payload.currency || "TRY",
        note: payload.notes || "",
        sender: {
            vkn: vkn,
            name: credentials.senderName || "GÖNDERİCİ ÜNVAN EKSİK",
            address: credentials.senderAddress || "ADRES EKSİK",
            city: credentials.senderCity || "İSTANBUL",
            district: credentials.senderDistrict || "MERKEZ",
            country: "Türkiye",
            taxOffice: credentials.senderTaxOffice || ""
        },
        receiver: {
            vkn: payload.customer.vknTckn,
            name: payload.customer.name,
            address: payload.customer.address || "",
            city: payload.customer.city || "Istanbul",
            district: payload.customer.district || "",
            country: "Türkiye",
            taxOffice: payload.customer.taxOffice || "",
            email: payload.customer.email,
            phone: payload.customer.phone,
            alias: receiverAlias || (invoiceType === "efatura" ? DEFAULT_TEST_RECEIVER_ALIAS : "")
        },
        items: payload.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            unitCode: item.unitCode || "C62"
        }))
    });

    const b64xml = Buffer.from(xml).toString('base64');

    // EDM REST Fatura Gövdesi (Swagger: /SendInvoiceRequest veya /api/SetArchiveInvoiceRequest)
    // ÖNEMLİ: Key'ler Swagger/SOAP WSDL ile tam eşleşmeli (Genellikle ALL CAPS)
    const subtotal = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = payload.items.reduce((sum, item) => {
        const lineTotal = item.quantity * item.unitPrice;
        return sum + (lineTotal * (item.vatRate / 100));
    }, 0);
    const grandTotal = subtotal + taxTotal;

    const receiverVkn = payload.customer.vknTckn;
    const isTckn = receiverVkn.length === 11;

    // Integer Enum Mappings for EDM REST
    const mapProfileToEnum = (profile: string): number => {
        if (invoiceType === "earsiv") return 2; // E-Archive is always enum 2

        const p = profile.toUpperCase();
        if (p.includes("TICARI")) return 1;
        if (p.includes("EARSIV")) return 2;
        return 0; // TEMEL (e-Invoice)
    };

    const mapTypeToEnum = (type: string): number => {
        const t = type.toUpperCase();
        if (t.includes("IADE")) return 1;
        if (t.includes("TEVKIFAT")) return 2;
        if (t.includes("ISTISNA")) return 3;
        return 0; // SATIS
    };

    // Swagger: INVOICEMODEL Structure
    const invoiceModel = {
        invoiceheader: {
            profileid: mapProfileToEnum(profileId),
            id: gibInvoiceId,
            uuid: uuid,
            issuedate: new Date(payload.issueDate).toISOString(), // Swagger expects date-time
            issuetime: new Date().toTimeString().split(' ')[0], // HH:mm:ss
            invoicetype: mapTypeToEnum(payload.invoiceType || "SATIS"),
            note: payload.notes || "",
            currency: payload.currency || "TRY",
            customerparty: {
                vkn: receiverVkn,
                pk: receiverAlias || (invoiceType === "efatura" ? DEFAULT_TEST_RECEIVER_ALIAS : ""),
                city: payload.customer.city || "Istanbul",
                county: payload.customer.district || "",
                adress: payload.customer.address || "Merkez Mah.",
                adsoyad: payload.customer.name
            },
            isaccomodation: false,
            isdespatch: false
        },
        invoiceline: payload.items.map(item => ({
            quantity: item.quantity,
            price: item.unitPrice,
            percent: Math.round(item.vatRate),
            name: item.name,
            unitcode: item.unitCode || "C62",
            accomodationtax: false
        })),
        invoicetotal: {
            total: subtotal,
            totalkdv: taxTotal
        }
    };

    try {
        const endpoint = "/LoadInvoiceRequestModel";
        const requestBody = {
            endpoint: endpoint,
            invoice: {
                ...invoiceModel,
                invoiceheader: {
                    ...invoiceModel.invoiceheader,
                    senderparty: {
                        vkn: credentials.senderVkn,
                        city: credentials.senderCity || "Istanbul",
                        county: credentials.senderDistrict || "",
                        adress: credentials.senderAddress || "Merkez",
                        adsoyad: credentials.senderName
                    }
                }
            },
            content: b64xml
        };

        console.log("================== EDM GÖNDERİLEN PAYLOAD (STRİKT) ==================");
        console.log(JSON.stringify(requestBody, null, 2));

        const data = await callEdmRest(endpoint, requestBody, session.sessionId, credentials.baseUrl);

        console.log("================== EDM GERÇEK YANIT ==================");
        console.log(JSON.stringify(data, null, 2));
        console.log("======================================================");

        // Check for success: sonuc is usually the indicator for this model
        if (data?.sonuc === false || data?.error) {
            throw new Error(data?.error || "EDM Fatura yükleme hatası!");
        }

        const realInvoiceId = data?.invoice?.id || gibInvoiceId;

        return {
            success: true,
            uuid,
            invoiceId: realInvoiceId,
            invoiceType,
            viewUrl: getInvoiceViewUrl(vkn, uuid, invoiceType),
            rawResponse: data
        };
    } catch (error: any) {
        console.error("[EDM SendInvoice] Hata:", error.message);
        const viewUrl = getInvoiceViewUrl(vkn, uuid, invoiceType);
        return {
            success: false,
            uuid,
            invoiceId: gibInvoiceId,
            invoiceType,
            viewUrl,
            error: error.message,
            rawResponse: error.response?.data || error.rawResponse
        };
    }
}

// Alias for compatibility with routes
export { sendRestInvoice as sendInvoice };

/* ═══════════════════════════════════════════
   GET INVOICES (REST)
   ═══════════════════════════════════════════ */

export async function getInvoices(
    credentials: EdmCredentials,
    filters: { startDate?: string; endDate?: string; direction?: "INBOUND" | "OUTBOUND" }
): Promise<any[]> {
    const session = await getEdmRestSession(credentials);

    const formatDate = (dateStr: string) => {
        if (dateStr.includes("T")) return dateStr;
        return `${dateStr}T00:00:00`;
    };

    const body = {
        invoicE_SEARCH_KEY: {
            starT_DATE: filters.startDate ? formatDate(filters.startDate) : undefined,
            enD_DATE: filters.endDate ? formatDate(filters.endDate) : undefined,
            invoicE_DIRECTION: filters.direction || "OUTBOUND",
            limiT: 100
        },
        headeR_ONLY: "Y", // Dashboard listesi için sadece header yeterli
        invoicE_CONTENT_TYPE: 0
    };

    try {
        const data = await callEdmRest("/GetInvoiceRequest", body, session.sessionId, credentials.baseUrl);
        return data?.invoicE_LIST || [];
    } catch (error) {
        console.error("[EDM getInvoices] Hata:", error);
        return [];
    }
}

/**
 * Gets the HTML content of a specific invoice from EDM.
 */
export async function getInvoiceHtml(
    credentials: EdmCredentials,
    uuid: string,
    direction: "INBOUND" | "OUTBOUND" | "EARSIV" = "OUTBOUND"
): Promise<string | null> {
    const session = await getEdmRestSession(credentials);

    const body = {
        invoicE_SEARCH_KEY: {
            uuid: uuid,
            invoicE_DIRECTION: direction
        },
        headeR_ONLY: "N",
        invoicE_CONTENT_TYPE: 2 // HTML
    };

    try {
        console.log(`[EDM getInvoiceHtml] Kayıt sorgulanıyor: UUID=${uuid}, Yön=${direction}`);
        const data = await callEdmRest("/GetInvoiceRequest", body, session.sessionId, credentials.baseUrl);
        const invoice = data?.invoicE_LIST?.[0];
        const invoiceContent = invoice?.CONTENT;

        if (invoiceContent) {
            console.log(`[EDM getInvoiceHtml] İçerik bulundu, uzunluk: ${invoiceContent.length}`);
            // Base64 kontrolü ve decode
            if (invoiceContent.length > 100 && !invoiceContent.trim().startsWith("<")) {
                try {
                    return Buffer.from(invoiceContent, "base64").toString("utf-8");
                } catch (e) {
                    console.warn("[EDM getInvoiceHtml] Base64 decode hatası, ham veri dönülüyor.");
                    return invoiceContent;
                }
            }
            return invoiceContent;
        }

        // --- Fallback Mekanizması ---
        if (direction === "OUTBOUND") {
            console.log("[EDM getInvoiceHtml] Outbound bulunamadı, Inbound deneniyor...");
            return getInvoiceHtml(credentials, uuid, "INBOUND");
        } else if (direction === "INBOUND") {
            console.log("[EDM getInvoiceHtml] e-Fatura havuzlarında bulunamadı, e-Arşiv (EARSIV) deneniyor...");
            return getInvoiceHtml(credentials, uuid, "EARSIV");
        }

        console.warn("[EDM getInvoiceHtml] Hiçbir havuzda içerik bulunamadı.");
        return null;
    } catch (error) {
        console.error("[EDM getInvoiceHtml] Kritik Hata:", error);
        return null;
    }
}


/* ═══════════════════════════════════════════
   MULTI-TENANT: DB'den Bayi Credential'larını Al
   ═══════════════════════════════════════════ */

import prisma from "@/lib/prisma";

export async function getShopEdmCredentials(shopId: string): Promise<EdmCredentials> {
    const [settings, shop] = await Promise.all([
        prisma.eDMSettings.findUnique({ where: { shopId } }),
        prisma.shop.findUnique({ where: { id: shopId } })
    ]);

    if (!settings || !settings.edmActive) {
        throw new Error("Bu dükkan için e-Fatura entegrasyonu aktif değil.");
    }

    if (!settings.username || !settings.passwordEncrypted) {
        throw new Error("EDM kullanıcı adı veya şifresi tanımlı değil. E-Fatura Ayarları'ndan bilgilerinizi girin.");
    }

    // Şifre base64 ile depolanıyor
    const password = Buffer.from(settings.passwordEncrypted, "base64").toString("utf-8");

    return {
        username: settings.username,
        password,
        senderVkn: settings.senderVkn || shop?.taxNumber || "",
        senderName: settings.senderName || shop?.companyName || shop?.name || undefined,
        senderAddress: settings.senderAddress || shop?.address || undefined,
        senderCity: settings.senderCity || shop?.companyCity || "İstanbul",
        senderDistrict: settings.senderDistrict || shop?.companyDistrict || undefined,
        senderTaxOffice: settings.senderTaxOffice || shop?.taxOffice || undefined,
        baseUrl: settings.apiUrl || process.env.EDM_REST_API_URL || DEFAULT_REST_URL,
        isRest: true
    };
}

