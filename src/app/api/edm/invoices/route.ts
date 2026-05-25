import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getEdmSession, sendInvoice, getInvoices } from "@/lib/edm/rest-client";
import { invoiceSchema } from "@/lib/validations/edm-schemas";
import { ZodError } from "zod";

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

        // Dukkanin EDM ayarlarini kontrol et
        const edmSettings = await prisma.eDMSettings.findUnique({
            where: { shopId: String(shopId) },
        });

        if (!edmSettings || !edmSettings.edmActive) {
            console.warn("[EDM Invoice API] EDM modulu aktif degil", { shopId });
            return NextResponse.json(
                { error: "e-Fatura modulu aktif degil. Lutfen yoneticiye basvurun." },
                { status: 403 }
            );
        }

        // Request body'yi al ve validate et
        const body = await req.json();
        console.log("[EDM Invoice API] Validasyon baslaniyor", {
            invoiceId: body.invoiceId,
            items: body.items?.length,
        });

        const validated = invoiceSchema.parse(body);

        console.log("[EDM Invoice API] Validasyon basarili", {
            invoiceId: validated.invoiceId,
            scenario: validated.invoiceScenario,
            type: validated.invoiceType,
        });

        // EDM'e gonder
        const senderVkn = edmSettings.senderVkn || DEFAULT_TEST_VKN;
        const credentials = {
            username: edmSettings.username!,
            password: decryptPassword(edmSettings.passwordEncrypted),
            senderVkn,
            baseUrl: edmSettings.apiUrl || undefined,
        };

        console.log("[EDM Invoice API] EDM gonderimi baslaniyor", {
            invoiceId: validated.invoiceId,
            senderVkn,
            customer: validated.customer.name,
        });

        // Muesteri veritabaninda kayitli mi kontrol et (TCKN/VKN ile)
        let localCustomer = await prisma.customer.findFirst({
            where: { 
                shopId: String(shopId),
                taxNumber: validated.customer.taxNumber
            }
        });

        const result = await sendInvoice(credentials, {
            invoiceId: validated.invoiceId,
            issueDate: validated.issueDate,
            dueDate: validated.dueDate,
            currency: validated.currency,
            note: validated.note,
            invoiceScenario: validated.invoiceScenario,
            invoiceType: validated.invoiceType,
            customer: {
                ...validated.customer,
                isEInvoiceUser: localCustomer?.isEInvoiceUser ?? undefined,
            },
            items: validated.items,
        });

        // XSLT sablonunu fatura tipine gore sec
        // isEInvoiceUser'a gore otomatik belirle
        const isEarsiv = localCustomer?.isEInvoiceUser === false;
        let xsltContent: string | null = null;
        try {
            const fs = await import("fs");
            const xsltFileName = isEarsiv ? "e-arsiv.xslt" : "e-fatura.xslt";
            const xsltPath = process.cwd() + "/public/" + xsltFileName;
            xsltContent = fs.readFileSync(xsltPath, "utf8");
            console.log(`[EDM Invoice API] XSLT sablonu okundu: ${xsltFileName} (isEarsiv=${isEarsiv})`);
        } catch (xsltError) {
            console.warn("[EDM Invoice API] XSLT sablonu okunamadi:", xsltError);
        }

        // DB'ye kaydet (invoice classification from local customer override)
        const invoiceClassification = localCustomer?.isEInvoiceUser === false ? "EARCHIVE" : "EINVOICE";

        const invoice = await prisma.eDMInvoice.create({
            data: {
                shopId: String(shopId),
                uuid: result.uuid,
            invoiceId: validated.invoiceId,
            type: invoiceClassification,
                status: "SENT",
                customerId: localCustomer?.id || null,
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
                rawResponse: JSON.stringify(result),
                xmlContent: result.xmlContent || null,
                xsltContent: xsltContent || null,
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

        console.log("[EDM Invoice API] Islem basarili", {
            invoiceId: validated.invoiceId,
            uuid: result.uuid,
            dbId: invoice.id,
        });

        return NextResponse.json({
            success: true,
            uuid: result.uuid,
            invoiceId: invoice.id,
            message: "Fatura basariyla gonderildi ve kaydedildi.",
        });
    } catch (error: any) {
        console.error("[EDM Invoice API] POST Hata", {
            message: error.message,
            name: error.name,
            stack: error.stack?.split("\n").slice(0, 3).join(" "),
        });

        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    error: "Validasyon hatasi",
                    details: error.errors.map(e => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Fatura olusturulurken hata olustu." },
            { status: 500 }
        );
    }
}

/**
 * GET /api/edm/invoices
 * Giden faturalari listeler (İstege gore DB veya EDM Canli)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            console.error("[EDM Invoice API] GET: Yetkisiz erisim");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;

        console.log("[EDM Invoice API] GET baslandi", { shopId });

        const edmSettings = await prisma.eDMSettings.findUnique({
            where: { shopId: String(shopId) },
        });

        if (!edmSettings || !edmSettings.edmActive) {
            console.warn("[EDM Invoice API] GET: EDM modulu aktif degil", { shopId });
            return NextResponse.json(
                { error: "e-Fatura modulu aktif degil." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;
        const source = searchParams.get("source") || "db"; // 'db' veya 'edm'

        const senderVkn = edmSettings.senderVkn || DEFAULT_TEST_VKN;
        const credentials = {
            username: edmSettings.username!,
            password: decryptPassword(edmSettings.passwordEncrypted),
            senderVkn,
            baseUrl: edmSettings.apiUrl || undefined,
        };

        // DB'den faturalari cek (customerId NULL olsa bile)
        if (source === "db") {
            const dbInvoices = await prisma.eDMInvoice.findMany({
                where: { shopId: String(shopId) },
                orderBy: { createdAt: "desc" },
                include: { lines: true },
            });
            console.log("DB_GELEN_FATURALAR:", JSON.stringify(dbInvoices, null, 2));
            return NextResponse.json({ invoices: dbInvoices, count: dbInvoices.length, source: "db" });
        }

        console.log("[EDM Invoice API] Faturalari sorgulaniyor", {
            senderVkn,
            dateRange: `${startDate} - ${endDate}`,
        });

        const invoices = await getInvoices(credentials, {
            startDate,
            endDate,
            direction: "OUTBOUND",
        });

        console.log("[EDM Invoice API] GET Basarili", {
            count: invoices.length,
        });

        return NextResponse.json({ invoices, count: invoices.length, source: "edm" });
    } catch (error: any) {
        console.error("[EDM Invoice API] GET Hata", {
            message: error.message,
            name: error.name,
        });
        return NextResponse.json(
            { error: error.message || "Faturalar listelenirken hata olustu." },
            { status: 500 }
        );
    }
}

/* ─── Helpers ─── */
function decryptPassword(encrypted: string | null): string {
    if (!encrypted) throw new Error("Sifreli parola bulunamadi.");
    try {
        return Buffer.from(encrypted, "base64").toString("utf8");
    } catch {
        console.warn("[EDM Invoice API] Sifre cozme hatasi, duz metin kullaniliyor");
        return encrypted;
    }
}