"use server";

import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";

export async function getShopInfo() {
    try {
        const shopId = await getShopId();
        if (!shopId) return null;

        const shop = await prisma.shop.findUnique({
            where: { id: shopId }
        });

        return shop;
    } catch (error) {
        console.error("getShopInfo error:", error);
        return null;
    }
}
