"use server";

import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Destructively resets all transactional data for the current shop.
 * Used for a "clean start" during onboarding.
 */
export async function resetShopData() {
    try {
        const shopId = await getShopId();

        await prisma.$transaction([
            prisma.serviceUsedPart.deleteMany({ where: { shopId } }),
            prisma.serviceLog.deleteMany({ where: { shopId } }),
            prisma.inventoryMovement.deleteMany({ where: { shopId } }),
            prisma.saleItem.deleteMany({ where: { shopId } }),
            prisma.attachment.deleteMany({ where: { shopId } }),
            prisma.transaction.deleteMany({ where: { shopId } }),
            prisma.sale.deleteMany({ where: { shopId } }),
            prisma.returnTicket.deleteMany({ where: { shopId } }),
            prisma.inventoryLog.deleteMany({ where: { shopId } }),
            prisma.serviceTicket.deleteMany({ where: { shopId } }),
            prisma.deviceHubInfo.deleteMany({ where: { shopId } }),
            prisma.product.deleteMany({ where: { shopId } }),
            prisma.category.deleteMany({ where: { shopId } }),
            prisma.stockAIAlert.deleteMany({ where: { shopId } }),
            prisma.notification.deleteMany({ where: { shopId } }),
            prisma.reminder.deleteMany({ where: { shopId } }),
            prisma.shortageItem.deleteMany({ where: { shopId } }),
            prisma.dailySession.deleteMany({ where: { shopId } }),
            prisma.debt.deleteMany({ where: { shopId } }),
            prisma.supplierTransaction.deleteMany({ where: { shopId } }),
            prisma.purchaseOrderItem.deleteMany({ where: { shopId } }),
            prisma.purchaseOrder.deleteMany({ where: { shopId } }),
            prisma.supplier.deleteMany({ where: { shopId } }),
            prisma.financeAccount.deleteMany({ where: { shopId } }),
            prisma.agendaEvent.deleteMany({ where: { shopId } }),
            prisma.receiptSettings.deleteMany({ where: { shopId } }),
            prisma.setting.deleteMany({ where: { shopId } }),
            prisma.customer.deleteMany({ where: { shopId } }),
            prisma.shop.update({
                where: { id: shopId },
                data: {
                    isFirstLogin: true,
                    whatsappSessionId: null,
                    enabledModules: ["SERVICE", "STOCK", "SALE", "FINANCE"],
                    themeConfig: null
                } as any
            })
        ]);

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("resetShopData error:", error);
        return { success: false, error: "Veriler sıfırlanamadı." };
    }
}

export async function saveOnboardingModules(modules: string[]) {
    try {
        const shopId = await getShopId();
        await prisma.shop.update({
            where: { id: shopId },
            data: { enabledModules: modules }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Modüller kaydedilemedi." };
    }
}

export async function saveOnboardingIntegrations(data: { whatsappConnected: boolean; geminiApiKey?: string }) {
    try {
        const shopId = await getShopId();

        if (data.geminiApiKey) {
            await prisma.setting.upsert({
                where: { shopId_key: { shopId, key: "gemini_api_key" } },
                update: { value: data.geminiApiKey },
                create: { shopId, key: "gemini_api_key", value: data.geminiApiKey }
            });
        }

        if (data.whatsappConnected) {
            // Logic to mark as connected or store session id
            // For now we just mock high-level state
            await prisma.shop.update({
                where: { id: shopId },
                data: { whatsappSessionId: `session_${shopId}` } as any
            });
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: "Entegrasyonlar kaydedilemedi." };
    }
}

export async function saveOnboardingFinance(accounts: any[]) {
    try {
        const shopId = await getShopId();

        // Clean start for finance accounts
        await prisma.financeAccount.deleteMany({ where: { shopId } });

        const creations = accounts.map(acc => prisma.financeAccount.create({
            data: {
                name: acc.name,
                type: acc.type,
                balance: acc.balance || 0,
                limit: acc.limit || null,
                billingDay: acc.billingDay || null,
                shopId,
                isDefault: acc.isDefault || false
            } as any
        }));

        await Promise.all(creations);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Finansal kurulum yapılamadı." };
    }
}

export async function finishOnboarding() {
    try {
        const shopId = await getShopId();
        await prisma.shop.update({
            where: { id: shopId },
            data: { isFirstLogin: false } as any
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Onboarding bitirilemedi." };
    }
}
