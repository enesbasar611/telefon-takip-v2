import { NextResponse } from "next/server";
import { getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const shopId = await getShopId();
        const settings = await prisma.eDMSettings.findUnique({
            where: { shopId },
        });
        return NextResponse.json({ settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const shopId = await getShopId();
        const body = await request.json();

        const {
            senderVkn,
            senderName,
            username,
            passwordEncrypted,
            apiUrl,
            registrationUrl,
            environment,
            isActive,
        } = body;

        if (!senderVkn || !senderName) {
            return NextResponse.json(
                { error: "VKN ve ünvan zorunludur." },
                { status: 400 }
            );
        }

        const settings = await prisma.eDMSettings.upsert({
            where: { shopId },
            update: {
                senderVkn,
                senderName,
                username,
                passwordEncrypted,
                apiUrl,
                registrationUrl,
                environment: environment || "TEST",
                isActive: isActive ?? false,
            },
            create: {
                shopId,
                senderVkn,
                senderName,
                username,
                passwordEncrypted,
                apiUrl,
                registrationUrl,
                environment: environment || "TEST",
                isActive: isActive ?? false,
            },
        });

        // Aynı zamanda Shop modelini de güncelle (genel firma kartı)
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                taxNumber: senderVkn,
                companyName: senderName,
            },
        });

        return NextResponse.json({ settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
