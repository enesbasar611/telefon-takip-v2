import { NextResponse } from "next/server";
import { getShopId, getUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EdmService } from "@/lib/edm/service";
import { EDMInvoiceStatus, EDMInvoiceType } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const shopId = await getShopId();
        const userId = await getUserId();
        const body = await request.json();

        const {
            customerId,
            manualCustomer,
            lines,
            issueDate,
            currency = "TRY",
            note,
            sourceType,
            sourceId,
        } = body;

        if (!lines?.length) {
            return NextResponse.json(
                { error: "En az bir kalem zorunludur." },
                { status: 400 }
            );
        }

        let customer: any = null;

        if (customerId) {
            customer = await prisma.customer.findFirst({
                where: { id: customerId, shopId },
            });
            if (!customer) {
                return NextResponse.json(
                    { error: "Müşteri bulunamadı." },
                    { status: 404 }
                );
            }
            if (!customer.taxNumber) {
                return NextResponse.json(
                    { error: "Müşterinin VKN/TCKN bilgisi eksik. Lütfen müşteri kartını güncelleyin." },
                    { status: 400 }
                );
            }
        } else if (manualCustomer) {
            if (!manualCustomer.name || !manualCustomer.taxNumber) {
                return NextResponse.json(
                    { error: "Manuel müşteri için ad ve VKN/TCKN zorunludur." },
                    { status: 400 }
                );
            }
            const taxLen = manualCustomer.taxNumber.length;
            if (taxLen !== 10 && taxLen !== 11) {
                return NextResponse.json(
                    { error: "VKN 10, TCKN 11 haneli olmalıdır." },
                    { status: 400 }
                );
            }
            customer = {
                id: null,
                name: manualCustomer.name,
                taxNumber: manualCustomer.taxNumber,
                taxOffice: manualCustomer.taxOffice || null,
                address: manualCustomer.address || null,
            };
        } else {
            return NextResponse.json(
                { error: "Müşteri seçimi veya manuel giriş zorunludur." },
                { status: 400 }
            );
        }

        const settings = await prisma.eDMSettings.findUnique({
            where: { shopId },
        });

        if (!settings?.isActive) {
            return NextResponse.json(
                { error: "e-Fatura entegrasyonu aktif değil. Ayarlar sayfasından aktifleştirin." },
                { status: 400 }
            );
        }

        // DB'ye DRAFT olarak kaydet
        const invoiceId = `INV${Date.now()}`;
        const uuid = crypto.randomUUID();
        const subtotal = lines.reduce((sum: number, line: any) => sum + line.quantity * line.unitPrice, 0);
        const taxTotal = lines.reduce((sum: number, line: any) => {
            const vatRate = line.vatRate ?? 18;
            return sum + (line.quantity * line.unitPrice * vatRate / 100);
        }, 0);
        const totalAmount = subtotal + taxTotal;

        const edmInvoice = await prisma.eDMInvoice.create({
            data: {
                shopId,
                uuid,
                invoiceId,
                type: EDMInvoiceType.EARCHIVE,
                status: EDMInvoiceStatus.DRAFT,
                customerId: customer.id,
                saleId: sourceType === "SALE" ? sourceId : null,
                serviceTicketId: sourceType === "SERVICE" ? sourceId : null,
                totalAmount,
                subtotal,
                taxTotal,
                currency,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                note,
                lines: {
                    create: lines.map((line: any) => ({
                        shopId,
                        name: line.name,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        totalPrice: line.quantity * line.unitPrice,
                        vatRate: line.vatRate ?? 18,
                        vatAmount: (line.quantity * line.unitPrice * (line.vatRate ?? 18)) / 100,
                        unitCode: line.unitCode || "C62",
                    })),
                },
            },
        });

        // EDM'e gönder
        const edmInput = {
            customer: {
                name: customer.name,
                tckn: customer.taxNumber.length === 11 ? customer.taxNumber : undefined,
                vkn: customer.taxNumber.length === 10 ? customer.taxNumber : undefined,
                taxOffice: customer.taxOffice || undefined,
                address: customer.address || undefined,
                city: "İSTANBUL",
                district: undefined,
            },
            lines: lines.map((line: any) => ({
                name: line.name,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                vatRate: line.vatRate ?? 18,
                unitCode: line.unitCode || "C62",
            })),
            issueDate: issueDate ? new Date(issueDate) : new Date(),
            currency: currency as "TRY" | "USD" | "EUR",
            note,
            uuid,
            invoiceId,
        };

        try {
            const result = await EdmService.sendInvoice(edmInput);

            await prisma.eDMInvoice.update({
                where: { id: edmInvoice.id },
                data: {
                    status: EDMInvoiceStatus.SENT,
                    uuid: result.uuid || uuid,
                    rawResponse: result.rawResponse.slice(0, 10000),
                },
            });

            return NextResponse.json({
                success: true,
                invoice: {
                    id: edmInvoice.id,
                    uuid: result.uuid || uuid,
                    invoiceId: result.requestId,
                    status: EDMInvoiceStatus.SENT,
                },
            });
        } catch (edmError: any) {
            await prisma.eDMInvoice.update({
                where: { id: edmInvoice.id },
                data: {
                    status: EDMInvoiceStatus.ERROR,
                    edmError: edmError.message?.slice(0, 2000) || "Bilinmeyen hata",
                },
            });

            return NextResponse.json(
                { error: edmError.message, invoiceId: edmInvoice.id },
                { status: 502 }
            );
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const shopId = await getShopId();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: any = { shopId };
        if (status) where.status = status;
        if (type) where.type = type;

        const [invoices, total] = await Promise.all([
            prisma.eDMInvoice.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true, taxNumber: true } },
                    lines: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.eDMInvoice.count({ where }),
        ]);

        return NextResponse.json({ invoices, total, page, limit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
