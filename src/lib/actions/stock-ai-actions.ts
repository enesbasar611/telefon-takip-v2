"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { InventoryMovement } from "@prisma/client";
import { getShopId } from "@/lib/auth";

export type AIAlertType = "LOW_STOCK" | "STAGNANT" | "TRENDING" | "CRITICAL" | "SUGGESTION";

export async function getAIAlerts() {
    try {
        const shopId = await getShopId();
        const now = new Date();
        const alerts = await (prisma as any).stockAIAlert.findMany({
            where: {
                expiresAt: {
                    gt: now,
                },
                shopId
            },
            include: {
                product: {
                    include: {
                        category: true
                    }
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return serializePrisma(alerts);
    } catch (error) {
        console.error("AI Alerts fetch error:", error);
        return [];
    }
}

export async function triggerAIAnalysis() {
    try {
        const shopId = await getShopId();
        const products = await prisma.product.findMany({
            where: { shopId },
            include: {
                movements: {
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                        },
                        shopId
                    },
                },
                category: true,
            },
        });

        const newAlerts = [];
        const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

        for (const product of products) {
            // 1. Critical Stock Heuristic
            if (product.stock <= product.criticalStock && product.stock > 0) {
                newAlerts.push({
                    type: "CRITICAL",
                    message: `${product.name} stok seviyesi kritik düzeyde (${product.stock} adet kaldı). Hemen tedarik önerilir.`,
                    productId: product.id,
                    expiresAt,
                    shopId
                });
            }

            // 2. Out of Stock Heuristic
            if (product.stock === 0) {
                newAlerts.push({
                    type: "LOW_STOCK",
                    message: `${product.name} stokta kalmadı! Müşteri kaybını önlemek için sipariş geçilmeli.`,
                    productId: product.id,
                    expiresAt,
                    shopId
                });
            }

            // 3. Stagnant Stock (No movement in 30 days)
            const salesIn30Days = product.movements.filter((m: InventoryMovement) => m.type === "SALE").length;
            if (salesIn30Days === 0 && product.stock > 10) {
                newAlerts.push({
                    type: "STAGNANT",
                    message: `${product.name} son 30 gündür hiç satılmadı. Kampanya veya indirim düşünülebilir.`,
                    productId: product.id,
                    expiresAt,
                    shopId
                });
            }

            // 4. Fast Moving Trend
            const recentSales = product.movements.filter((m: InventoryMovement) => m.type === "SALE" && m.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
            if (recentSales > 5) {
                newAlerts.push({
                    type: "TRENDING",
                    message: `${product.name} bu hafta popüler! (${recentSales} satış). Stok takviyesi iyi bir fikir olabilir.`,
                    productId: product.id,
                    expiresAt,
                    shopId
                });
            }
        }

        // Batch create alerts (avoiding duplicates for the same product in shorter windows if needed, but here we just add them)
        // Cleanup old ones for these products first to avoid clutter? 
        // For simplicity, we just add.

        if (newAlerts.length > 0) {
            // First cleanup expired for hygiene
            await (prisma as any).stockAIAlert.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                    shopId
                },
            });

            // Create new ones
            for (const alert of newAlerts) {
                // Check if a similar alert exists in the last 12 hours for this product to avoid spam
                const existing = await (prisma as any).stockAIAlert.findFirst({
                    where: {
                        productId: alert.productId,
                        type: alert.type,
                        shopId,
                        createdAt: {
                            gt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
                        }
                    }
                });

                if (!existing) {
                    await (prisma as any).stockAIAlert.create({
                        data: alert
                    });
                }
            }
        }

        revalidatePath("/stok/stok-ai");
        return { success: true, count: newAlerts.length };
    } catch (error) {
        console.error("AI Analysis error:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteAIAlert(id: string) {
    try {
        const shopId = await getShopId();
        await (prisma as any).stockAIAlert.delete({
            where: { id, shopId },
        });
        revalidatePath("/stok/stok-ai");
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
export async function resolveAIAlertsForProduct(productId: string) {
    try {
        const shopId = await getShopId();
        const product = await prisma.product.findUnique({
            where: { id: productId, shopId }
        });

        if (!product) return { success: false };

        // If stock is now above critical, remove CRITICAL and LOW_STOCK alerts
        if (product.stock > product.criticalStock) {
            await (prisma as any).stockAIAlert.deleteMany({
                where: {
                    productId: product.id,
                    type: { in: ["CRITICAL", "LOW_STOCK"] },
                    shopId
                }
            });
        }

        revalidatePath("/stok/stok-ai");
        return { success: true };
    } catch (error) {
        console.error("Resolve AI Alerts error:", error);
        return { success: false };
    }
}
