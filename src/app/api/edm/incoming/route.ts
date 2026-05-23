import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EdmService } from "@/lib/edm/service";

export async function GET(request: Request) {
    try {
        const shopId = await getShopId();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");

        const where: any = { shopId };
        if (status) where.status = status;

        const [invoices, total] = await Promise.all([
            prisma.eDMIncomingInvoice.findMany({
                where,
                orderBy: { issueDate: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.eDMIncomingInvoice.count({ where }),
        ]);

        return NextResponse.json({ invoices, total, page, limit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const shopId = await getShopId();

        const settings = await prisma.eDMSettings.findUnique({
            where: { shopId },
        });

        if (!settings?.isActive) {
            return NextResponse.json(
                { error: "e-Fatura entegrasyonu aktif değil." },
                { status: 400 }
            );
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const envelopes = await EdmService.getIncomingEnvelopes(startDate, endDate);
        let created = 0;
        let updated = 0;

        for (const env of envelopes) {
            const uuid = env.UUID || env.uuid;
            const invoiceId = env.ID || env.id || env.invoiceId;
            if (!uuid) continue;

            const existing = await prisma.eDMIncomingInvoice.findUnique({
                where: { shopId_uuid: { shopId, uuid } },
            });

            const data = {
                shopId,
                uuid,
                invoiceId: invoiceId || uuid,
                senderVkn: env.senderVKN || env.sender || "",
                senderName: env.senderName || env.supplier || "Bilinmeyen",
                receiverVkn: env.receiverVKN || settings.senderVkn,
                amount: env.payableAmount?.value || env.amount || 0,
                currency: env.payableAmount?.currencyID === 0 ? "TRY" : (env.currency || "TRY"),
                status: env.status || "PENDING",
                issueDate: env.issueDate ? new Date(env.issueDate) : new Date(),
                envelopeId: env.envelopeId || null,
            };

            if (existing) {
                await prisma.eDMIncomingInvoice.update({
                    where: { id: existing.id },
                    data: {
                        status: data.status,
                        amount: data.amount,
                        syncedAt: new Date(),
                    },
                });
                updated++;
            } else {
                await prisma.eDMIncomingInvoice.create({ data });
                created++;
            }
        }

        return NextResponse.json({
            success: true,
            created,
            updated,
            totalProcessed: envelopes.length,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
