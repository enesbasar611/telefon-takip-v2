/**
 * EDM Bilişim SOAP Client
 * Hata ayıklama (Debug) ve Cache yönetimi güçlendirilmiş versiyon.
 */

import axios from 'axios';
import { v4 as uuidv4 } from "uuid";

const DEFAULT_SOAP_URL = "https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc";

export interface EdmCredentials {
    username: string;
    password: string;
    senderVkn: string;
    baseUrl?: string;
}

export interface EdmSession {
    sessionId: string;
    username: string;
    expiresAt: Date;
}

export interface EdmInvoicePayload {
    invoiceId: string;
    issueDate: string;
    customer: any;
    items: any[];
    [key: string]: any;
}

/* ─── Session Cache ─── */
const sessionCache = new Map<string, EdmSession>();
const SESSION_TTL_MS = 25 * 60 * 1000;

/**
 * Session Cache'i anlık olarak temizlemek için kullanılan yardımcı fonksiyon
 */
export function forceClearSession(username: string) {
    console.log(`[EDM Session] Cache temizleniyor: ${username}`);
    sessionCache.delete(username);
}

/* ─── SOAP Helpers ─── */

const wrapSoap = (method: string, body: string, sessionId: string = "0") => `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soapenv:Header>
      <tem:REQUEST_HEADER>
         <tem:SESSION_ID>${sessionId}</tem:SESSION_ID>
         <tem:APPLICATION_NAME>TELEFON_TAKIP</tem:APPLICATION_NAME>
      </tem:REQUEST_HEADER>
   </soapenv:Header>
   <soapenv:Body>
      <tem:${method}>
         ${body}
      </tem:${method}>
   </soapenv:Body>
</soapenv:Envelope>`;

function extractTagValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : "";
}

/**
 * EDM SOAP Çağrısı yapar - Hata yakalama (500) geliştirildi
 */
async function callEdmSoap(methodName: string, xmlContent: string, sessionId: string = "0", baseUrl?: string): Promise<string> {
    const url = baseUrl || DEFAULT_SOAP_URL;
    const soapAction = methodName;

    try {
        const response = await axios.post(url, wrapSoap(methodName, xmlContent, sessionId), {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": soapAction
            }
        });

        const text = response.data;

        if (text.includes("Fault") || text.includes("faultstring")) {
            const faultStr = extractTagValue(text, "faultstring") || "Bilinmeyen SOAP Hatası";
            throw new Error(`EDM SOAP Hatası: ${faultStr}`);
        }

        return text;
    } catch (error: any) {
        // Hata Detayı Yakalama (500 vs.)
        if (error.response) {
            console.error(`[EDM Sunucusu 500 Detay - ${methodName}]:`, error.response.data);
        } else {
            console.error(`[EDM Hata Detayı - ${methodName}]:`, error.message);
        }
        throw new Error(`EDM Servis Hatası: ${error.message}`);
    }
}

/* ─── Login (SOAP) ─── */

export async function getEdmSession(credentials: EdmCredentials): Promise<EdmSession> {
    const cacheKey = credentials.username;

    // DEBUG: Session cache durumunu gör
    console.log(`[EDM Session] Cache kontrol (${cacheKey}): ${sessionCache.has(cacheKey) ? "MEVCUT" : "BOŞ (Yeni Login Lazım)"}`);

    const cached = sessionCache.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
        return cached;
    }

    console.log(`[EDM Login] SOAP Login Başlatılıyor...`);

    const body = `
        <tem:USER_NAME>${credentials.username}</tem:USER_NAME>
        <tem:PASSWORD>${credentials.password}</tem:PASSWORD>
    `;

    const responseXml = await callEdmSoap("LoginRequest", body, "0", credentials.baseUrl);
    const sessionId = extractTagValue(responseXml, "SESSION_ID") || extractTagValue(responseXml, "LoginResult") || extractTagValue(responseXml, "SESSION_IDValue");

    if (!sessionId || sessionId === "0") {
        throw new Error("EDM Oturum Açılamadı: Geçersiz kullanıcı adı veya şifre.");
    }

    const session: EdmSession = {
        sessionId,
        username: credentials.username,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    };

    sessionCache.set(cacheKey, session);
    console.log(`[EDM Session] Yeni Oturum Alındı: ${sessionId}`);
    return session;
}

/* ─── CheckUser (SOAP) ─── */

export async function checkUser(
    credentials: EdmCredentials,
    vknTckn: string
): Promise<{ isEInvoice: boolean; alias?: string; message?: string }> {
    const session = await getEdmSession(credentials);

    const body = `
        <tem:USER_NAME>${credentials.username}</tem:USER_NAME>
        <tem:PASSWORD>${credentials.password}</tem:PASSWORD>
        <tem:vknTckn>${vknTckn}</tem:vknTckn>
    `;

    try {
        const responseXml = await callEdmSoap("CheckUserRequest", body, session.sessionId, credentials.baseUrl);

        const usersMatch = responseXml.includes("ALIAS") || responseXml.includes("RECEIVING_ALIAS");
        const alias = extractTagValue(responseXml, "ALIAS") || extractTagValue(responseXml, "RECEIVING_ALIAS");

        return {
            isEInvoice: usersMatch,
            alias: usersMatch ? (alias || "default") : undefined,
            message: usersMatch ? "Mükellef e-Fatura kullanıcısı." : "Mükellef e-Arşiv kullanıcısı.",
        };
    } catch (error: any) {
        return {
            isEInvoice: false,
            message: "Sorgulama sorgulanamadı (e-Arşiv kabul edildi)."
        };
    }
}

/* ─── Invoices (SOAP) ─── */

export async function sendInvoice(
    credentials: EdmCredentials,
    payload: EdmInvoicePayload
): Promise<{ uuid: string; invoiceId: string; status: string; xmlContent?: string }> {
    const session = await getEdmSession(credentials);
    const methodName = "SendInvoiceRequest";
    const uuid = uuidv4();

    console.log(`[EDM SendInvoice] SOAP Gönderiliyor: ${payload.invoiceId}`);

    const body = `
        <tem:INVOICE_UUID>${uuid}</tem:INVOICE_UUID>
        <tem:INVOICE_ID>${payload.invoiceId}</tem:INVOICE_ID>
    `;

    try {
        const responseXml = await callEdmSoap(methodName, body, session.sessionId, credentials.baseUrl);
        return {
            uuid,
            invoiceId: payload.invoiceId,
            status: "SUCCESS",
            xmlContent: responseXml
        };
    } catch (error: any) {
        throw error;
    }
}

export async function getInvoices(
    credentials: EdmCredentials,
    options: { startDate?: string; endDate?: string; direction?: "INBOUND" | "OUTBOUND" }
): Promise<any[]> {
    const session = await getEdmSession(credentials);
    const body = `
        <tem:START_DATE>${options.startDate || ""}</tem:START_DATE>
        <tem:END_DATE>${options.endDate || ""}</tem:END_DATE>
    `;

    try {
        const responseXml = await callEdmSoap("GetInvoiceRequest", body, session.sessionId, credentials.baseUrl);
        return [];
    } catch (error: any) {
        return [];
    }
}
