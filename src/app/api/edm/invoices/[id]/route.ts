import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopId();
        const { id } = params;

        const invoice = await prisma.eDMInvoice.findFirst({
            where: { id, shopId },
            include: {
                customer: { select: { id: true, name: true, taxNumber: true, taxOffice: true, address: true } },
                lines: true,
                sale: { select: { id: true, totalAmount: true, createdAt: true } },
                serviceTicket: { select: { id: true, deviceBrand: true, deviceModel: true, status: true } },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopId();
        const { id } = params;

        const invoice = await prisma.eDMInvoice.findFirst({
            where: { id, shopId },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
        }

        // TODO: EDM REST API üzerinden iptal et
        // Şimdilik sadece DB'de iptal olarak işaretle
        await prisma.eDMInvoice.update({
            where: { id },
            data: { status: "CANCELLED", cancelledAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
