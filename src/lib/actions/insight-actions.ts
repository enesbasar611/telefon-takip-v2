"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

export async function getPendingProcurement() {
    try {
        const shopId = await getShopId();
        const items = await prisma.shortageItem.findMany({
            where: { shopId, isResolved: false },
            include: {
                product: {
                    select: {
                        name: true,
                        stock: true,
                        sku: true,
                        category: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return serializePrisma(items);
    } catch (error) {
        console.error("Error fetching pending procurement:", error);
        return [];
    }
}

export async function getDeadStockProducts() {
    try {
        const shopId = await getShopId();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const productsWithSales = await prisma.saleItem.findMany({
            where: {
                shopId,
                sale: {
                    createdAt: { gte: ninetyDaysAgo }
                }
            },
            select: { productId: true },
            distinct: ['productId']
        });

        const activeProductIds = productsWithSales.map(p => p.productId);

        const products = await prisma.product.findMany({
            where: {
                shopId,
                stock: { gt: 0 },
                id: { notIn: activeProductIds }
            },
            include: {
                category: { select: { name: true } }
            },
            orderBy: { updatedAt: "desc" },
            take: 50
        });

        return serializePrisma(products);
    } catch (error) {
        console.error("Error fetching dead stock products:", error);
        return [];
    }
}

export async function getReadyDevices() {
    try {
        const shopId = await getShopId();
        const devices = await prisma.serviceTicket.findMany({
            where: { shopId, status: "READY" },
            include: {
                customer: { select: { name: true } }
            },
            orderBy: { updatedAt: "desc" }
        });
        return serializePrisma(devices);
    } catch (error) {
        console.error("Error fetching ready devices:", error);
        return [];
    }
}
