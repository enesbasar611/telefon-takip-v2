import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopId();
        const { id } = params;
        const body = await request.json();
        const { taxNumber, taxOffice } = body;

        if (!taxNumber) {
            return NextResponse.json(
                { error: "VKN/TCKN zorunludur." },
                { status: 400 }
            );
        }

        const len = taxNumber.length;
        if (len !== 10 && len !== 11) {
            return NextResponse.json(
                { error: "VKN 10, TCKN 11 haneli olmalıdır." },
                { status: 400 }
            );
        }

        const customer = await prisma.customer.update({
            where: { id, shopId },
            data: {
                taxNumber,
                taxOffice: taxOffice || null,
            },
        });

        return NextResponse.json({ success: true, customer });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
