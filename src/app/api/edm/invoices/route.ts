import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendInvoice, getInvoices, getShopEdmCredentials, checkEdmUser, getInvoiceViewUrl } from "@/lib/edm/rest-client";
import { invoiceSchema } from "@/lib/validations/edm-schemas";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";

// Test VKN (EDM test ortami icin varsayilan)
const DEFAULT_TEST_VKN = "3230512384";

/**
 * POST /api/edm/invoices
 * Yeni e-Fatura olusturur ve EDM'e gonderir
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            console.error("[EDM Invoice API] Yetkisiz erisim");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;

        console.log("[EDM Invoice API] POST baslandi", {
            shopId,
            username: user.email,
        });

        // Dukkanin EDM ayarlarini ve credential'larini al
        let credentials;
        try {
            credentials = await getShopEdmCredentials(String(shopId));
        } catch (error: any) {
            console.warn("[EDM Invoice API] EDM ayarlari bulunamadi:", error.message);
            return NextResponse.json(
                { error: error.message || "e-Fatura modulu aktif degil veya kurulum tamamlanmadı." },
                { status: 403 }
            );
        }

        // Request body'yi al ve validate et
        const body = await req.json();
        const validated = invoiceSchema.parse(body);

        console.log("[EDM Invoice API] Validasyon basarili", {
            invoiceId: validated.invoiceId,
            scenario: validated.invoiceScenario,
            type: validated.invoiceType,
        });

        // 3. Veritabanından Müşteri Bilgilerini Al veya Doğrula (Zorunlu EDM Detayları İçin)
        let dbCustomer = null;
        if (body.customerId) {
            dbCustomer = await prisma.customer.findUnique({
                where: { id: body.customerId }
            });
        } else {
            dbCustomer = await prisma.customer.findFirst({
                where: {
                    shopId: String(shopId),
                    taxNumber: validated.customer.vknTckn
                }
            });
        }

        // Eğer veritabanında varsa ve formdaki veriler eksikse veritabanındakini kullan (Defansif)
        const finalCustomerName = (validated.customer.name?.length > 3)
            ? validated.customer.name
            : (dbCustomer?.name || validated.customer.name);

        const finalTaxNo = dbCustomer?.taxNumber || validated.customer.vknTckn;
        const finalAddress = (validated.customer.address?.length > 5)
            ? validated.customer.address
            : (dbCustomer?.address || validated.customer.address || "Merkez");

        // Mükellef sorgulama yap (Ground Truth)
        console.log("[EDM Invoice API] Mükellef sorgulanıyor:", finalTaxNo);
        const checkResult = await checkEdmUser(credentials, finalTaxNo);
        const isEInvoice = checkResult.isEInvoice;

        if (dbCustomer) {
            await prisma.customer.update({
                where: { id: dbCustomer.id },
                data: { isEInvoiceUser: isEInvoice }
            });
        }

        // Fatura tipini ve senaryosunu alıcının durumuna göre ayarla
        const invoiceType = isEInvoice ? "efatura" : "earsiv";

        // Eğer e-Arşiv ise senaryo her zaman TEMEL (EARSIVFATURA) olmalı
        // e-Fatura ise kullanıcının seçtiği (TEMEL/TICARI) korunmalı
        const finalScenario = isEInvoice ? validated.invoiceScenario : "TEMEL";

        // Fatura tipini SATIS/IADE formatına çevir (Schema enum'dan al)
        const mappedInvoiceTypeForUbl = validated.invoiceType === "TEVKIFAT" ? "SATIS" : (validated.invoiceType as any);

        const result = await sendInvoice(
            credentials,
            {
                invoiceId: validated.invoiceId,
                issueDate: validated.issueDate,
                dueDate: validated.dueDate,
                currency: validated.currency,
                note: validated.note,
                invoiceScenario: finalScenario,
                invoiceType: mappedInvoiceTypeForUbl,
                customer: {
                    name: finalCustomerName,
                    vknTckn: finalTaxNo,
                    taxOffice: validated.customer.taxOffice || dbCustomer?.taxOffice || undefined,
                    address: finalAddress,
                    city: validated.customer.city || "İSTANBUL",
                    district: validated.customer.district || "Merkez",
                    email: (validated.customer.email || dbCustomer?.email || undefined) as string | undefined,
                    phone: (validated.customer.phone || dbCustomer?.phone || undefined) as string | undefined,
                },
                items: validated.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    vatRate: item.vatRate,
                    unitCode: item.unitCode
                })),
            },
            invoiceType,
            checkResult.alias
        );

        // DB'ye kaydet
        const invoiceClassification = isEInvoice ? "EINVOICE" : "EARCHIVE";

        const invoice = await prisma.eDMInvoice.create({
            data: {
                shopId: String(shopId),
                uuid: result.uuid,
                invoiceId: result.invoiceId,
                type: invoiceClassification,
                status: result.success ? "SENT" : "ERROR",
                customerId: dbCustomer?.id || null,
                totalAmount: validated.items.reduce((sum, item) => {
                    const total = item.quantity * item.unitPrice;
                    const vat = total * (item.vatRate / 100);
                    return sum + total + vat;
                }, 0),
                subtotal: validated.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                taxTotal: validated.items.reduce((sum, item) => {
                    const total = item.quantity * item.unitPrice;
                    return sum + (total * (item.vatRate / 100));
                }, 0),
                currency: validated.currency,
                issueDate: new Date(validated.issueDate),
                note: validated.note || null,
                viewUrl: result.viewUrl || null,
                edmError: result.error || null,
            },
        });

        // Fatura kalemlerini kaydet
        await prisma.eDMInvoiceLine.createMany({
            data: validated.items.map((item) => ({
                invoiceId: invoice.id,
                shopId: String(shopId),
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                vatRate: item.vatRate,
                vatAmount: (item.quantity * item.unitPrice) * (item.vatRate / 100),
                unitCode: item.unitCode || "C62",
            })),
        });

        console.log("[EDM Invoice API] EDM Yanıtı:", JSON.stringify(result, null, 2));

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || "Fatura EDM'e gönderilemedi.",
                debug: result.rawResponse
            }, { status: 400 });
        }

        // 6. Basarili yanit don
        return NextResponse.json({
            success: true,
            uuid: result.uuid,
            invoiceId: invoice.id,      // Local DB ID (cuid)
            gibNumber: result.invoiceId, // GİB No (BSR2026...)
            invoiceType: invoiceType,   // efatura veya earsiv
            viewUrl: getInvoiceViewUrl(credentials.senderVkn, result.uuid, invoiceType),
            message: "Fatura basariyla gonderildi ve kaydedildi.",
        });
    } catch (error: any) {
        console.error("[EDM Invoice API] POST Hata:", error.message);

        if (error instanceof ZodError) {
            return NextResponse.json({
                error: "Validasyon hatasi",
                details: error.errors
            }, { status: 400 });
        }

        return NextResponse.json(
            { error: error.message || "Fatura olusturulurken hata olustu." },
            { status: 500 }
        );
    }
}

/**
 * GET /api/edm/invoices
 * Giden faturalari listeler
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;

        let credentials;
        try {
            credentials = await getShopEdmCredentials(String(shopId));
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;
        const source = searchParams.get("source") || "db"; // 'db' veya 'edm'

        if (source === "db") {
            const dbInvoices = await prisma.eDMInvoice.findMany({
                where: { shopId: String(shopId) },
                orderBy: { createdAt: "desc" },
                include: { lines: true },
            });
            return NextResponse.json({ invoices: dbInvoices, count: dbInvoices.length, source: "db" });
        }

        const invoices = await getInvoices(credentials, {
            startDate,
            endDate,
            direction: "OUTBOUND",
        });

        return NextResponse.json({ invoices, count: invoices.length, source: "edm" });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Faturalar listelenirken hata olustu." },
            { status: 500 }
        );
    }
}