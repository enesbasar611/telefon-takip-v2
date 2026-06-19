import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;

        const [settings, shop] = await Promise.all([
            prisma.eDMSettings.findUnique({
                where: { shopId: String(shopId) },
            }),
            prisma.shop.findUnique({
                where: { id: String(shopId) },
            })
        ]);

        return NextResponse.json({
            edmActive: settings?.edmActive ?? false,
            settings: {
                senderVkn: settings?.senderVkn || shop?.taxNumber || "",
                senderName: settings?.senderName || shop?.companyName || shop?.name || "",
                senderAddress: settings?.senderAddress || shop?.address || "",
                senderCity: settings?.senderCity || shop?.companyCity || "İstanbul",
                senderDistrict: settings?.senderDistrict || shop?.companyDistrict || "",
                senderTaxOffice: settings?.senderTaxOffice || shop?.taxOffice || "",
                environment: settings?.environment || "TEST",
                username: settings?.username || "",
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const shopId = user.shopId || user.currentShopId;
        const isSuperAdmin = user.role === "SUPER_ADMIN";

        const body = await req.json();

        const {
            senderVkn,
            senderName,
            senderAddress,
            senderCity,
            senderDistrict,
            senderTaxOffice,
            username,
            password,
            apiUrl,
            environment,
            edmActive,
        } = body;

        // Validasyon
        if (!senderVkn || !senderName) {
            return NextResponse.json(
                { error: "VKN ve ünvan zorunludur." },
                { status: 400 }
            );
        }

        if (senderVkn.length !== 10 || !/^\d{10}$/.test(senderVkn)) {
            return NextResponse.json(
                { error: "VKN 10 haneli rakam olmalıdır." },
                { status: 400 }
            );
        }

        // Şifreyi base64 ile şifrele (geçici çözüm — production'da daha güvenli olmalı)
        const passwordEncrypted = password
            ? Buffer.from(password).toString("base64")
            : undefined;

        const settings = await prisma.eDMSettings.upsert({
            where: { shopId: String(shopId) },
            update: {
                senderVkn,
                senderName,
                senderAddress: senderAddress || null,
                senderCity: senderCity || null,
                senderDistrict: senderDistrict || null,
                senderTaxOffice: senderTaxOffice || null,
                username: username || null,
                ...(passwordEncrypted && { passwordEncrypted }),
                apiUrl: apiUrl || null,
                environment: environment || "TEST",
                // Sadece Super Admin edmActive'yi değiştirebilir
                ...(isSuperAdmin && { edmActive: edmActive ?? false }),
            },
            create: {
                shopId: String(shopId),
                senderVkn,
                senderName,
                senderAddress: senderAddress || null,
                senderCity: senderCity || null,
                senderDistrict: senderDistrict || null,
                senderTaxOffice: senderTaxOffice || null,
                username: username || null,
                passwordEncrypted: passwordEncrypted || null,
                apiUrl: apiUrl || null,
                environment: environment || "TEST",
                edmActive: isSuperAdmin ? (edmActive ?? false) : false,
            },
        });

        // Shop modelini de güncelle
        await prisma.shop.update({
            where: { id: String(shopId) },
            data: {
                taxNumber: senderVkn,
                companyName: senderName,
            },
        });

        return NextResponse.json({
            success: true,
            settings: {
                senderVkn: settings.senderVkn,
                senderName: settings.senderName,
                environment: settings.environment,
                edmActive: settings.edmActive,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
