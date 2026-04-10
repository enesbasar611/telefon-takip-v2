"use server";

import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createShopOnboarding(data: { name: string; industry: string; address?: string; phone?: string; }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return { success: false, error: "Yetkisiz işlem." };
        }

        // Check if user already has a shop
        const existingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { shop: true }
        });

        if (existingUser?.shop) {
            const shop = await prisma.shop.update({
                where: { id: existingUser.shop.id },
                data: {
                    name: data.name,
                    industry: data.industry,
                    address: data.address,
                    phone: data.phone,
                    isFirstLogin: true,
                    enabledModules: ["SERVICE", "STOCK", "SALE", "FINANCE"],
                    themeConfig: null
                } as any
            });

            // SYNC TO RECEIPTS
            await prisma.receiptSettings.upsert({
                where: { id: shop.id },
                update: {
                    title: data.name.toUpperCase(),
                    phone: data.phone || "",
                    address: data.address || "",
                },
                create: {
                    id: shop.id,
                    shopId: shop.id,
                    title: data.name.toUpperCase(),
                    phone: data.phone || "",
                    address: data.address || "",
                }
            });

            return { success: true, shopId: shop.id, shopName: shop.name };
        }

        const shop = await prisma.shop.create({
            data: {
                name: data.name,
                industry: data.industry,
                address: data.address,
                phone: data.phone,
                users: {
                    connect: { id: session.user.id }
                }
            } as any
        });

        // SYNC TO RECEIPTS
        await prisma.receiptSettings.create({
            data: {
                id: shop.id,
                shopId: shop.id,
                title: data.name.toUpperCase(),
                phone: data.phone || "",
                address: data.address || "",
            }
        });

        return { success: true, shopId: shop.id, shopName: shop.name };
    } catch (e: any) {
        return { success: false, error: "Dükkan oluşturulamadı: " + e.message };
    }
}

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

import { generateIndustryConfigWithAI, onboardingAISectorAnalysis } from "./gemini-actions";

export async function getOnboardingAIAnalysis(sector: string) {
    return await onboardingAISectorAnalysis(sector);
}

export async function saveOnboardingModules(modules: string[], sector?: string, extraData?: any) {
    try {
        const shopId = await getShopId();

        let themeConfig: any = {};
        if (sector) {
            // Generate AI configuration for this sector (dynamic fields)
            const aiGen = await generateIndustryConfigWithAI(sector);
            if (aiGen.success) {
                themeConfig = { ...themeConfig, ...aiGen.data };
            }
        }

        // Add AI suggested labels if provided from onboarding
        if (extraData?.labels) {
            themeConfig.labels = extraData.labels;
        }

        await prisma.shop.update({
            where: { id: shopId },
            data: {
                enabledModules: modules,
                industry: sector || null,
                themeConfig: themeConfig
            } as any
        });

        // UPDATE RECEIPT SUBTITLE BASED ON SECTOR
        if (sector) {
            const { getIndustryConfig } = await import("@/lib/industry-utils");
            const indConf = getIndustryConfig(sector as any);
            await prisma.receiptSettings.update({
                where: { id: shopId },
                data: {
                    subtitle: `PROFESYONEL ${indConf.name?.toUpperCase() || ""}`
                }
            });
        }

        // Initialize categories if provided
        if (extraData?.categories && extraData.categories.length > 0) {
            const currentCats = await prisma.category.count({ where: { shopId } });
            if (currentCats === 0) {
                await Promise.all(extraData.categories.map((catName: string) =>
                    prisma.category.create({
                        data: { name: catName, shopId }
                    })
                ));
            }
        }

        return { success: true };
    } catch (error) {
        console.error("saveOnboardingModules error:", error);
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
        const session = await getServerSession(authOptions);

        const creations = accounts.map(async acc => {
            const account = await prisma.financeAccount.create({
                data: {
                    name: acc.name,
                    type: acc.type,
                    balance: acc.balance || 0,
                    limit: acc.limit || null,
                    billingDay: acc.billingDay || null,
                    shopId,
                    isDefault: acc.isDefault || false
                } as any
            });

            // CREATE OPENING TRANSACTION for analytics comparison
            await prisma.transaction.create({
                data: {
                    type: acc.type === 'CREDIT_CARD' ? 'EXPENSE' : 'INCOME',
                    amount: acc.balance || 0,
                    description: "Hesap Açılış Bakiyesi",
                    paymentMethod: acc.type === 'CASH' ? 'CASH' : 'TRANSFER',
                    financeAccountId: account.id,
                    userId: session?.user?.id || "system",
                    shopId,
                    category: "AÇILIŞ"
                }
            });

            return account;
        });

        await Promise.all(creations);

        // CREATE REMINDERS FOR CREDIT CARDS
        const ccAccounts = accounts.filter(acc => acc.type === 'CREDIT_CARD' && acc.billingDay);
        if (ccAccounts.length > 0) {
            const hasAppointmentModule = (await prisma.shop.findUnique({
                where: { id: shopId },
                select: { enabledModules: true }
            }))?.enabledModules.includes('APPOINTMENT');

            if (hasAppointmentModule) {
                const today = new Date();
                const agendaCreations = ccAccounts.map(acc => {
                    const eventDate = new Date(today.getFullYear(), today.getMonth(), acc.billingDay);
                    // If the date has already passed this month, set it for next month
                    if (eventDate < today) eventDate.setMonth(eventDate.getMonth() + 1);

                    return prisma.agendaEvent.create({
                        data: {
                            title: `${acc.name} - Son Ödeme Günü`,
                            type: 'PAYMENT',
                            date: eventDate,
                            notes: "Sistem tarafından otomatik oluşturulan kredi kartı ödeme uyarısı.",
                            category: "Finans",
                            shopId
                        }
                    });
                });
                await Promise.all(agendaCreations);
            }
        }

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

export async function getWhatsAppStatusOnboarding(shopId?: string) {
    try {
        const id = shopId || await getShopId().catch(() => null);
        if (!id) return { success: false, error: "Shop ID bulunamadı." };
        const { whatsappManager } = await import("@/lib/whatsapp/whatsapp-manager");
        return { success: true, ...await whatsappManager.getStatus(id) };
    } catch (error) {
        return { success: false, error: "WhatsApp servis bağlantısı kurulamadı." };
    }
}

export async function reinitWhatsAppOnboarding(shopId?: string) {
    try {
        const id = shopId || await getShopId().catch(() => null);
        if (!id) return { success: false, error: "Shop ID bulunamadı." };
        const { whatsappManager } = await import("@/lib/whatsapp/whatsapp-manager");
        await whatsappManager.logout(id);
        await whatsappManager.initialize(id);
        return { success: true };
    } catch (error) {
        return { success: false, error: "WhatsApp yeniden başlatılamadı." };
    }
}
