"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkEdmUser } from "@/lib/edm/rest-client";

export async function checkSuperAdmin() {
    const session = await getSession();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }
    if (session.user.role !== "SUPER_ADMIN") {
        throw new Error("Sadece sistem yöneticileri bu işlemi yapabilir.");
    }
    return session.user;
}

export async function getAllShops() {
    try {
        await checkSuperAdmin();
        const shops = await prisma.shop.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                industry: true,
                phone: true,
                email: true,
                address: true,
                isActive: true,
                createdAt: true,
                enabledModules: true,
                themeConfig: true,
                _count: {
                    select: { users: true, customers: true, serviceTickets: true }
                },
                users: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        role: true
                    },
                    where: {
                        OR: [
                            { role: "SHOP_MANAGER" },
                            { role: "ADMIN" }
                        ]
                    },
                    take: 1
                }
            } as any
        });
        return { success: true, data: shops };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateShopThemeConfig(shopId: string, newConfigJson: any) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: { themeConfig: newConfigJson }
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Ayarlar güncellenirken hata oluştu: " + error.message };
    }
}

export async function updateShopModules(shopId: string, enabledModules: string[]) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: { enabledModules }
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Modüller güncellenirken hata oluştu: " + error.message };
    }
}

export async function updateShopStatus(shopId: string, isActive: boolean) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: { isActive } as any
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Dükkan durumu güncellenirken hata oluştu: " + error.message };
    }
}

export async function impersonateShop(shopId: string) {
    try {
        console.log(`[Impersonate] Initiating for shopId: ${shopId}`);
        const user = await checkSuperAdmin();
        console.log(`[Impersonate] Super Admin verified: ${user.email} (${user.id})`);

        // Update the user's shopId in the database.
        await prisma.user.update({
            where: { id: user.id },
            data: { shopId }
        });

        console.log(`[Impersonate] Successfully updated shopId in DB to: ${shopId}`);
        return { success: true };
    } catch (error: any) {
        console.error(`[Impersonate] Failed: ${error.message}`);
        return { success: false, error: "Kimliğe bürünme başarısız: " + error.message };
    }
}

export async function stopImpersonating() {
    try {
        console.log(`[StopImpersonate] Initiating`);
        const user = await checkSuperAdmin();
        console.log(`[StopImpersonate] Super Admin verified: ${user.email} (${user.id})`);

        // Find the "home" shop (Başar Teknik) to return to
        const homeShop = await prisma.shop.findFirst({
            where: {
                OR: [
                    { name: { contains: "BAŞAR", mode: "insensitive" } },
                    { name: { contains: "TEKNİK", mode: "insensitive" } }
                ]
            },
            select: { id: true },
            orderBy: { createdAt: 'asc' }
        }) || await prisma.shop.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true }
        });

        // Update the user's shopId back to their home shop
        await prisma.user.update({
            where: { id: user.id },
            data: { shopId: homeShop?.id || null }
        });

        console.log(`[StopImpersonate] Successfully returned to home shop: ${homeShop?.id}`);
        return { success: true };
    } catch (error: any) {
        console.error(`[StopImpersonate] Failed: ${error.message}`);
        return { success: false, error: "Dönüş başarısız: " + error.message };
    }
}

export async function deleteShop(shopId: string) {
    try {
        await checkSuperAdmin();

        await prisma.$transaction([
            // 1. Dependency heavy models (logs, items, movements)
            prisma.serviceLog.deleteMany({ where: { shopId } }),
            prisma.serviceUsedPart.deleteMany({ where: { shopId } }),
            prisma.inventoryMovement.deleteMany({ where: { shopId } }),
            prisma.returnTicket.deleteMany({ where: { shopId } }),
            prisma.saleItem.deleteMany({ where: { shopId } }),
            prisma.purchaseOrderItem.deleteMany({ where: { shopId } }),
            prisma.supplierTransaction.deleteMany({ where: { shopId } }),

            // 2. Core business records
            prisma.serviceTicket.deleteMany({ where: { shopId } }),
            prisma.attachment.deleteMany({ where: { shopId } }),
            prisma.transaction.deleteMany({ where: { shopId } }),
            prisma.sale.deleteMany({ where: { shopId } }),
            prisma.purchaseOrder.deleteMany({ where: { shopId } }),

            // 3. Entity metadata and secondary records
            prisma.debt.deleteMany({ where: { shopId } }),
            prisma.stockAIAlert.deleteMany({ where: { shopId } }),
            prisma.shortageItem.deleteMany({ where: { shopId } }),
            prisma.inventoryLog.deleteMany({ where: { shopId } }),
            prisma.deviceHubInfo.deleteMany({ where: { shopId } }),
            prisma.notification.deleteMany({ where: { shopId } }),
            prisma.reminder.deleteMany({ where: { shopId } }),
            prisma.agendaEvent.deleteMany({ where: { shopId } }),
            (prisma as any).hiddenAgendaItem.deleteMany({ where: { shopId } }),
            prisma.dailySession.deleteMany({ where: { shopId } }),

            // 4. Structural data
            prisma.product.deleteMany({ where: { shopId } }),
            prisma.category.deleteMany({ where: { shopId } }),
            prisma.supplier.deleteMany({ where: { shopId } }),
            prisma.customer.deleteMany({ where: { shopId } }),
            prisma.financeAccount.deleteMany({ where: { shopId } }),
            prisma.setting.deleteMany({ where: { shopId } }),
            prisma.receiptSettings.deleteMany({ where: { shopId } }),

            // 5. Auth and User cleanup (Force re-approval on next login)
            // PROTECT SUPER ADMIN: Prevent deleting super admin users even if they are in this shop
            prisma.account.deleteMany({
                where: {
                    user: {
                        shopId,
                        role: { not: "SUPER_ADMIN" },
                        email: { not: "qwerty61.enes@gmail.com" }
                    }
                }
            }),
            prisma.session.deleteMany({
                where: {
                    user: {
                        shopId,
                        role: { not: "SUPER_ADMIN" },
                        email: { not: "qwerty61.enes@gmail.com" }
                    }
                }
            }),
            prisma.user.deleteMany({
                where: {
                    shopId,
                    role: { not: "SUPER_ADMIN" },
                    email: { not: "qwerty61.enes@gmail.com" }
                }
            }),

            // 6. Finally the Shop itself
            prisma.shop.delete({ where: { id: shopId } })
        ]);

        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        console.error("Shop delete error:", error);
        return { success: false, error: "Dükkan silinemedi: " + error.message };
    }
}

export async function updateShopGeneral(shopId: string, data: { name: string; industry: string }) {
    try {
        await checkSuperAdmin();
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                name: data.name,
                industry: data.industry
            } as any
        });
        revalidatePath("/admin/shops");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Dükkan bilgileri güncellenemedi: " + error.message };
    }
}

export async function adminCreateShop(data: { name: string; industry: string }) {
    try {
        await checkSuperAdmin();
        const shop = await prisma.shop.create({
            data: {
                name: data.name,
                industry: data.industry,
            } as any
        });
        revalidatePath("/admin/shops");
        return { success: true, data: shop };
    } catch (error: any) {
        return { success: false, error: "Dükkan oluşturulamadı: " + error.message };
    }
}

// ─── EDM Registration Actions ────────────────────────────────────────────────

export async function getShopsForEdmAdmin() {
    try {
        await checkSuperAdmin();
        const shops = await prisma.shop.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                taxNumber: true,
                taxOffice: true,
                companyName: true,
                companyAddress: true,
                companyCity: true,
                companyDistrict: true,
                address: true,
                phone: true,
                email: true,
                isActive: true,
                enabledModules: true,
                edmSettings: {
                    select: {
                        id: true,
                        senderVkn: true,
                        senderName: true,
                        senderAddress: true,
                        senderCity: true,
                        senderDistrict: true,
                        senderTaxOffice: true,
                        environment: true,
                        edmActive: true,
                        username: true,
                    },
                },
                _count: {
                    select: { users: true, customers: true, serviceTickets: true },
                },
            },
        });
        return { success: true, data: shops };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function setupEdmForShop(
    shopId: string,
    data: {
        username?: string;
        password?: string;
        senderVkn?: string;
        senderName?: string;
        senderAddress?: string;
        senderCity?: string;
        senderDistrict?: string;
        senderTaxOffice?: string;
        environment?: string;
        edmActive?: boolean;
    }
) {
    try {
        await checkSuperAdmin();

        // EDMSettings'i güncelle
        const settings = await prisma.eDMSettings.upsert({
            where: { shopId },
            create: {
                shopId,
                username: data.username || null,
                passwordEncrypted: data.password
                    ? Buffer.from(data.password).toString("base64")
                    : null,
                senderVkn: data.senderVkn || null,
                senderName: data.senderName || null,
                senderAddress: data.senderAddress || null,
                senderCity: data.senderCity || null,
                senderDistrict: data.senderDistrict || null,
                senderTaxOffice: data.senderTaxOffice || null,
                environment: data.environment || "TEST",
                edmActive: data.edmActive ?? false,
            },
            update: {
                ...(data.username !== undefined && { username: data.username }),
                ...(data.password && {
                    passwordEncrypted: Buffer.from(data.password).toString("base64"),
                }),
                ...(data.senderVkn !== undefined && { senderVkn: data.senderVkn }),
                ...(data.senderName !== undefined && { senderName: data.senderName }),
                ...(data.senderAddress !== undefined && { senderAddress: data.senderAddress }),
                ...(data.senderCity !== undefined && { senderCity: data.senderCity }),
                ...(data.senderDistrict !== undefined && { senderDistrict: data.senderDistrict }),
                ...(data.senderTaxOffice !== undefined && { senderTaxOffice: data.senderTaxOffice }),
                ...(data.environment !== undefined && { environment: data.environment }),
                ...(data.edmActive !== undefined && { edmActive: data.edmActive }),
            },
        });

        // Shop modelini de güncelle (Senkronizasyon)
        // Eğer VKN veya diğer ticari bilgiler girildiyse Shop tablosuna da işle
        await prisma.shop.update({
            where: { id: shopId },
            data: {
                ...(data.senderVkn !== undefined && { taxNumber: data.senderVkn }),
                ...(data.senderTaxOffice !== undefined && { taxOffice: data.senderTaxOffice }),
                ...(data.senderName !== undefined && { companyName: data.senderName }),
                ...(data.senderAddress !== undefined && { companyAddress: data.senderAddress }),
                ...(data.senderCity !== undefined && { companyCity: data.senderCity }),
                ...(data.senderDistrict !== undefined && { companyDistrict: data.senderDistrict }),
            } as any
        });

        revalidatePath("/admin/edm");
        revalidatePath("/ayarlar");
        return { success: true, data: settings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getEdmBalanceForShop(shopId: string) {
    try {
        await checkSuperAdmin();

        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            select: { taxNumber: true, companyName: true, edmSettings: { select: { senderVkn: true } } },
        });

        const vkn = shop?.taxNumber || shop?.edmSettings?.senderVkn;

        if (!vkn) {
            return { success: false, error: "Dükkanın VKN bilgisi yok." };
        }

        const tenantSettings = await prisma.tenantSettings.findUnique({
            where: { tenant_id: shopId },
        });

        // EDM Credentials (checkUser için lazım olan dükkan özel bilgileri)
        const edmSettings = await prisma.eDMSettings.findUnique({ where: { shopId } });
        const credentials = {
            username: edmSettings?.username || "",
            password: edmSettings?.passwordEncrypted ? Buffer.from(edmSettings.passwordEncrypted, "base64").toString() : "",
            senderVkn: vkn,
            baseUrl: edmSettings?.environment === "PROD"
                ? "https://portal2.edmbilisim.com.tr/EFaturaEDM/EFaturaEDM.svc"
                : "https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc"
        };

        // 1. Mükellef Durumunu Sorgula (e-Fatura mı e-Arşiv mi?)
        const statusResult = await checkEdmUser(credentials, vkn);

        // 2. Bakiyeyi Sorgula (EdmRegistrationService kullanarak)
        const { EdmRegistrationService } = await import("@/lib/edm/registration");
        const balance = await EdmRegistrationService.checkTenantBalance(
            vkn,
            tenantSettings?.integration_code || undefined,
            tenantSettings?.integration_company_id || undefined
        );

        return {
            success: true,
            data: {
                vkn,
                companyName: balance.companyName || shop.companyName,
                counterLeft: balance.counterLeft,
                isEInvoice: statusResult.isEInvoice,
                alias: statusResult.alias,
                message: statusResult.message
            }
        };
    } catch (error: any) {
        console.error("getEdmBalanceForShop error:", error);
        return { success: false, error: error.message };
    }
}
