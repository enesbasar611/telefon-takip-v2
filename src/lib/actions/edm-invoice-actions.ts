"use server";

import { getShopId } from "@/lib/auth";
import {
    getShopEdmCredentials,
    checkEdmUser,
    sendRestInvoice,
    getInvoiceViewUrl,
    type EdmInvoicePayload,
    type EdmInvoiceLineItem,
    type SendInvoiceResult,
    type CheckUserResult
} from "@/lib/edm/rest-client";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/* ═══════════════════════════════════════════
   TEST: EDM REST Login + CheckUser
   ═══════════════════════════════════════════ */

export async function testEdmRestLogin() {
    try {
        const { getEdmRestSession } = await import("@/lib/edm/rest-client");
        const credentials = {
            username: process.env.EDM_USERNAME || "basarteknik",
            password: process.env.EDM_PASSWORD || "Abc.123",
            senderVkn: process.env.EDM_SENDER_VKN || "3230512384",
            senderName: "BASAR TEKNIK",
            baseUrl: "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test/api",
            environment: "TEST"
        } as any;

        const session = await getEdmRestSession(credentials);

        return {
            success: true,
            sessionId: session.sessionId,
            username: session.username,
            expiresAt: session.expiresAt.toISOString(),
            message: "Giriş başarılı! SESSION_ID başarıyla alındı."
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            message: "EDM Bilişim REST API giriş hatası."
        };
    }
}

/* ═══════════════════════════════════════════
   MÜKELLEF SORGULAMA (CheckUser)
   ═══════════════════════════════════════════ */

export async function checkCustomerEInvoiceStatus(taxNumber: string) {
    try {
        const shopId = await getShopId();
        let credentials;

        try {
            credentials = await getShopEdmCredentials(shopId);
        } catch {
            // Fallback: .env üzerinden doğrudan credential'ları al
            credentials = {
                username: process.env.EDM_USERNAME || "basarteknik",
                password: process.env.EDM_PASSWORD || "Abc.123",
                senderVkn: process.env.EDM_SENDER_VKN || "3230512384",
                senderName: "BASAR TEKNIK",
                baseUrl: "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test/api",
                environment: "TEST"
            } as any;
        }

        const result = await checkEdmUser(credentials, taxNumber);

        return {
            success: true,
            ...result
        };
    } catch (error: any) {
        return {
            success: false,
            isEInvoice: false,
            message: `Sorgulama hatası: ${error.message}`
        };
    }
}

/* ═══════════════════════════════════════════
   FATURA OLUŞTUR VE GÖNDER
   ═══════════════════════════════════════════ */

interface CreateInvoiceInput {
    // Kaynak bilgisi
    sourceType: "SALE" | "SERVICE";
    sourceId: string; // saleId veya serviceTicketId

    // Müşteri bilgisi
    customerId?: string;
    customerName: string;
    customerTaxNumber?: string;
    customerTaxOffice?: string;
    customerAddress?: string;
    customerCity?: string;
    customerDistrict?: string;
    customerEmail?: string;
    customerPhone?: string;

    // Fatura kalemleri
    items: {
        name: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
    }[];

    // Diğer
    currency?: string;
    notes?: string;
}

export async function createAndSendInvoice(input: CreateInvoiceInput): Promise<{
    success: boolean;
    invoiceId?: string;
    uuid?: string;
    viewUrl?: string;
    invoiceType?: "efatura" | "earsiv";
    error?: string;
}> {
    try {
        const shopId = await getShopId();

        // 1) EDM Credentials al (DB → fallback .env)
        let credentials;
        try {
            credentials = await getShopEdmCredentials(shopId);
        } catch {
            credentials = {
                username: process.env.EDM_USERNAME || "basarteknik",
                password: process.env.EDM_PASSWORD || "Abc.123",
                senderVkn: process.env.EDM_SENDER_VKN || "3230512384",
                senderName: "BASAR TEKNIK",
                baseUrl: "https://restapi.edmbilisim.com.tr/EFaturaEDM_API_Test/api",
                environment: "TEST"
            } as any;
        }

        // 2) Mükellef sorgula → e-Fatura mı e-Arşiv mi?
        let invoiceType: "efatura" | "earsiv" = "earsiv";
        let receiverAlias: string | undefined;

        if (input.customerTaxNumber) {
            const checkResult = await checkEdmUser(credentials, input.customerTaxNumber);
            if (checkResult.isEInvoice) {
                invoiceType = "efatura";
                receiverAlias = checkResult.alias;
            }
        }

        // 3) Fatura numarası üret
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const invoiceId = `${invoiceType === "efatura" ? "EFT" : "EAR"}${dateStr}${randomSuffix}`;

        // 4) Payload hazırla
        const payload: EdmInvoicePayload = {
            invoiceId,
            issueDate: new Date().toISOString(),
            customer: {
                name: input.customerName,
                vknTckn: input.customerTaxNumber || "",
                taxOffice: input.customerTaxOffice,
                address: input.customerAddress,
                city: input.customerCity,
                district: input.customerDistrict,
                email: input.customerEmail,
                phone: input.customerPhone,
            },
            items: input.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate,
                unitCode: "C62"
            })),
            currency: input.currency || "TRY",
            notes: input.notes
        };

        // 5) EDM REST ile gönder
        const result = await sendRestInvoice(credentials, payload, invoiceType, receiverAlias);

        // 6) DB'ye kaydet
        const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxTotal = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.vatRate / 100)), 0);

        await prisma.eDMInvoice.create({
            data: {
                shopId,
                uuid: result.uuid,
                invoiceId: result.invoiceId,
                type: invoiceType === "efatura" ? "EINVOICE" : "EARCHIVE",
                status: result.success ? "SENT" : "ERROR",
                customerId: input.customerId || null,
                saleId: input.sourceType === "SALE" ? input.sourceId : null,
                serviceTicketId: input.sourceType === "SERVICE" ? input.sourceId : null,
                totalAmount: subtotal + taxTotal,
                subtotal,
                taxTotal,
                currency: input.currency || "TRY",
                issueDate: new Date(),
                note: input.notes || null,
                viewUrl: result.viewUrl || null,
                edmError: result.error || null,
                lines: {
                    create: input.items.map(item => ({
                        shopId,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.quantity * item.unitPrice > 0 ? item.unitPrice : 0,
                        totalPrice: item.quantity * item.unitPrice,
                        vatRate: item.vatRate,
                        vatAmount: item.quantity * item.unitPrice * (item.vatRate / 100),
                    }))
                }
            }
        });

        revalidatePath("/efatura");

        return {
            success: result.success,
            invoiceId: result.invoiceId,
            uuid: result.uuid,
            viewUrl: result.viewUrl,
            invoiceType,
            error: result.error
        };
    } catch (error: any) {
        console.error("[createAndSendInvoice] Hata:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/* ═══════════════════════════════════════════
   FATURA GÖRÜNTÜLEME URL'Sİ AL
   ═══════════════════════════════════════════ */

export async function getInvoiceViewLink(invoiceDbId: string) {
    try {
        const shopId = await getShopId();

        const invoice = await prisma.eDMInvoice.findFirst({
            where: { id: invoiceDbId, shopId }
        });

        if (!invoice) {
            return { success: false, error: "Fatura bulunamadı." };
        }

        // Shop'un VKN'sini al
        const settings = await prisma.eDMSettings.findUnique({
            where: { shopId }
        });

        const vkn = settings?.senderVkn || process.env.EDM_SENDER_VKN || "3230512384";
        const type = invoice.type === "EINVOICE" ? "efatura" : "earsiv";

        const viewUrl = getInvoiceViewUrl(vkn, invoice.uuid, type);

        return {
            success: true,
            viewUrl,
            uuid: invoice.uuid,
            invoiceId: invoice.invoiceId,
            type
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
