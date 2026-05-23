import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function GET(request: Request) {
    try {
        const shopId = await getShopId();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q");

        const where: any = { shopId };
        if (q) {
            where.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { taxNumber: { contains: q } },
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            select: {
                id: true,
                name: true,
                phone: true,
                taxNumber: true,
                taxOffice: true,
                address: true,
                email: true,
            },
            orderBy: { name: "asc" },
            take: 100,
        });

        return NextResponse.json(serializePrisma(customers));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
