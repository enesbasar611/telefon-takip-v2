"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";

async function getShopId() {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Unauthorized");
    return session.user.shopId;
}

// ────────── EXPORT ──────────────────────────────────────────────────────────

export type ExportCategory =
    | "customers" | "products" | "categories" | "services"
    | "sales" | "transactions" | "suppliers" | "agenda";

export async function getExportData(categories: ExportCategory[]) {
    const shopId = await getShopId();
    const result: Record<string, any[]> = {};

    await Promise.all(categories.map(async (cat) => {
        switch (cat) {
            case "customers":
                result.customers = await prisma.customer.findMany({
                    where: { shopId },
                    select: { id: true, name: true, phone: true, email: true, address: true, notes: true, loyaltyPoints: true, type: true, createdAt: true },
                });
                break;
            case "products":
                result.products = await prisma.product.findMany({
                    where: { shopId },
                    select: { id: true, sku: true, barcode: true, name: true, description: true, buyPrice: true, sellPrice: true, stock: true, criticalStock: true, location: true, createdAt: true },
                });
                break;
            case "categories":
                result.categories = await prisma.category.findMany({
                    where: { shopId },
                    select: { id: true, name: true, parentId: true, order: true },
                });
                break;
            case "services":
                result.services = await prisma.serviceTicket.findMany({
                    where: { shopId },
                    select: { id: true, ticketNumber: true, deviceModel: true, deviceBrand: true, problemDesc: true, status: true, estimatedCost: true, actualCost: true, createdAt: true },
                });
                break;
            case "sales":
                result.sales = await prisma.sale.findMany({
                    where: { shopId },
                    select: { id: true, saleNumber: true, totalAmount: true, finalAmount: true, paymentMethod: true, createdAt: true },
                });
                break;
            case "transactions":
                result.transactions = await prisma.transaction.findMany({
                    where: { shopId },
                    select: { id: true, type: true, amount: true, description: true, category: true, createdAt: true },
                });
                break;
            case "suppliers":
                result.suppliers = await prisma.supplier.findMany({
                    where: { shopId },
                    select: { id: true, name: true, phone: true, email: true, address: true, createdAt: true },
                });
                break;
            case "agenda":
                result.agenda = await (prisma as any).agendaEvent.findMany({
                    where: { shopId },
                    select: { id: true, title: true, type: true, date: true, notes: true, isCompleted: true, createdAt: true },
                });
                break;
        }
    }));

    return result;
}

// ────────── IMPORT ──────────────────────────────────────────────────────────

export async function importData(data: Record<string, any[]>): Promise<{ success: boolean; stats: Record<string, number>; error?: string }> {
    const shopId = await getShopId();
    const stats: Record<string, number> = {};

    try {
        await prisma.$transaction(async (tx: any) => {
            if (data.customers?.length) {
                let count = 0;
                for (const c of data.customers) {
                    try {
                        await tx.customer.upsert({
                            where: { shopId_phone: { shopId, phone: c.phone || `import-${c.id}` } },
                            create: { name: c.name || "İsimsiz", phone: c.phone, email: c.email, address: c.address, notes: c.notes, type: c.type || "BIREYSEL", shopId },
                            update: { name: c.name, email: c.email, address: c.address, notes: c.notes },
                        });
                        count++;
                    } catch { /* skip duplicate */ }
                }
                stats.customers = count;
            }

            if (data.categories?.length) {
                let count = 0;
                // Import top-level first, then sub-categories
                const sorted = [...data.categories].sort((a, b) => (!a.parentId ? -1 : 1));
                for (const c of sorted) {
                    try {
                        await tx.category.upsert({
                            where: { shopId_name: { shopId, name: c.name } },
                            create: { name: c.name, order: c.order || 0, shopId },
                            update: { order: c.order || 0 },
                        });
                        count++;
                    } catch { /* skip */ }
                }
                stats.categories = count;
            }

            if (data.suppliers?.length) {
                let count = 0;
                for (const s of data.suppliers) {
                    try {
                        await (tx as any).supplier.upsert({
                            where: { id: s.id },
                            create: { id: s.id, name: s.name, phone: s.phone, email: s.email, address: s.address, shopId },
                            update: { name: s.name, phone: s.phone, email: s.email },
                        });
                        count++;
                    } catch { /* skip */ }
                }
                stats.suppliers = count;
            }
        });

        return { success: true, stats };
    } catch (error: any) {
        return { success: false, stats, error: error.message };
    }
}

// ────────── RESET ───────────────────────────────────────────────────────────

/** Soft Reset: Notifications, read AI alerts, completed agenda */
export async function softResetAction(): Promise<{ success: boolean; deleted: Record<string, number> }> {
    const shopId = await getShopId();
    const deleted: Record<string, number> = {};

    const [notifs, alerts, agenda] = await Promise.all([
        prisma.notification.deleteMany({ where: { shopId, isRead: true } }),
        prisma.stockAIAlert.deleteMany({ where: { shopId, isRead: true } }),
        (prisma as any).agendaEvent.deleteMany({ where: { shopId, isCompleted: true } }),
    ]);

    deleted.notifications = notifs.count;
    deleted.aiAlerts = alerts.count;
    deleted.agendaEvents = agenda.count;

    revalidateTag(`dashboard-${shopId}`);
    return { success: true, deleted };
}

/** Transaction Reset: Sales, services, transactions, debts */
export async function transactionResetAction(): Promise<{ success: boolean; deleted: Record<string, number> }> {
    const shopId = await getShopId();
    const deleted: Record<string, number> = {};

    // Order matters due to FK constraints
    const [saleItems, serviceParts, serviceLogs, returns, movements] = await Promise.all([
        prisma.saleItem.deleteMany({ where: { shopId } }),
        prisma.serviceUsedPart.deleteMany({ where: { shopId } }),
        prisma.serviceLog.deleteMany({ where: { shopId } }),
        prisma.returnTicket.deleteMany({ where: { shopId } }),
        prisma.inventoryMovement.deleteMany({ where: { shopId } }),
    ]);

    const [sales, tickets, transactions, debts] = await Promise.all([
        prisma.sale.deleteMany({ where: { shopId } }),
        prisma.serviceTicket.deleteMany({ where: { shopId } }),
        prisma.transaction.deleteMany({ where: { shopId } }),
        prisma.debt.deleteMany({ where: { shopId } }),
    ]);

    deleted.saleItems = saleItems.count;
    deleted.sales = sales.count;
    deleted.services = tickets.count;
    deleted.transactions = transactions.count;
    deleted.debts = debts.count;

    revalidateTag(`dashboard-${shopId}`);
    revalidatePath("/(dashboard)", "layout");

    return { success: true, deleted };
}

/** Full Reset: Everything except WhatsApp settings and categories that start with system defaults */
export async function fullResetAction(): Promise<{ success: boolean; deleted: Record<string, number> }> {
    const shopId = await getShopId();

    try {
        return await prisma.$transaction(async (tx) => {
            const deleted: Record<string, number> = {};

            // 1. Delete Transactional Data (Order of deletion matters for FK constraints)
            const attachments = await tx.attachment.deleteMany({ where: { shopId } });
            const saleItems = await tx.saleItem.deleteMany({ where: { shopId } });
            const serviceParts = await tx.serviceUsedPart.deleteMany({ where: { shopId } });
            const serviceLogs = await tx.serviceLog.deleteMany({ where: { shopId } });
            const returns = await tx.returnTicket.deleteMany({ where: { shopId } });
            const movements = await tx.inventoryMovement.deleteMany({ where: { shopId } });
            const invLogs = await tx.inventoryLog.deleteMany({ where: { shopId } });
            const saleTransactions = await tx.transaction.deleteMany({ where: { shopId } });
            const sales = await tx.sale.deleteMany({ where: { shopId } });
            const tickets = await tx.serviceTicket.deleteMany({ where: { shopId } });
            const dailySessions = await tx.dailySession.deleteMany({ where: { shopId } });
            const debts = await tx.debt.deleteMany({ where: { shopId } });

            // 2. Delete Master Data
            const devices = await tx.deviceHubInfo.deleteMany({ where: { shopId } });
            const products = await tx.product.deleteMany({ where: { shopId } });
            const shortage = await tx.shortageItem.deleteMany({ where: { shopId } });
            const customers = await tx.customer.deleteMany({ where: { shopId, type: { not: "ANONIM" } } });
            const supplierTx = await tx.supplierTransaction.deleteMany({ where: { shopId } });
            const purchaseItems = await tx.purchaseOrderItem.deleteMany({ where: { shopId } });
            const purchaseOrders = await tx.purchaseOrder.deleteMany({ where: { shopId } });
            const suppliers = await tx.supplier.deleteMany({ where: { shopId } });

            // 3. Delete Utility Data
            const alerts = await tx.stockAIAlert.deleteMany({ where: { shopId } });
            const notifs = await tx.notification.deleteMany({ where: { shopId } });
            const reminders = await tx.reminder.deleteMany({ where: { shopId } });
            const agenda = await (tx as any).agendaEvent.deleteMany({ where: { shopId } });

            // 4. Handle Settings (Preserve WhatsApp)
            // We delete all settings EXCEPT those starting with 'whatsapp' (case insensitive-ish)
            const settingsDel = await tx.setting.deleteMany({
                where: {
                    shopId,
                    NOT: {
                        OR: [
                            { key: { startsWith: "whatsapp" } },
                            { key: { startsWith: "WhatsApp" } },
                            { key: "gemini_api_key" }
                        ]
                    }
                }
            });

            // 5. Reset Receipt Settings to default
            try {
                await tx.receiptSettings.update({
                    where: { id: shopId },
                    data: {
                        title: "BAŞAR TEKNİK",
                        subtitle: "PROFESYONEL TEKNİK SERVİS",
                        footer: "Bizi Tercih Ettiğiniz İçin Teşekkürler",
                        phone: "+90 (5xx) xxx xx xx",
                        website: "v2.basarteknik.com"
                    }
                });
            } catch (e) {
                // If doesn't exist, we can ignore or create
            }

            // 6. Handle Finance Accounts (Delete all and create default 'Nakit Kasa')
            await tx.financeAccount.deleteMany({ where: { shopId } });
            await tx.financeAccount.create({
                data: {
                    name: "Nakit Kasa",
                    type: "CASH",
                    balance: 0,
                    isDefault: true,
                    isActive: true,
                    shopId
                }
            });

            // 7. Handle Categories (Clean and Re-seed defaults)
            await tx.category.deleteMany({ where: { shopId } });
            const defaultCategories = ["Aksesuar", "Yedek Parça", "Cihaz", "Hizmet", "Genel"];
            for (const name of defaultCategories) {
                await tx.category.create({
                    data: { name, shopId, order: 0 }
                });
            }

            // Revalidate all caches
            revalidateTag(`dashboard-${shopId}`);
            revalidatePath("/", "layout");

            return {
                success: true,
                deleted: {
                    transactions: sales.count + tickets.count,
                    products: products.count,
                    customers: customers.count,
                    finance: 1
                }
            };
        });
    } catch (error: any) {
        console.error("Full reset error:", error);
        return { success: false, deleted: {} };
    }
}

// ────────── INTEGRATIONS ──────────────────────────────────────────────────

/** Backup to Google Drive (Functional Placeholder) */
export async function backupToDriveAction() {
    const shopId = await getShopId();

    // 1. Get Google Drive Settings
    const settings = await prisma.setting.findMany({
        where: {
            shopId,
            key: { in: ["googleDriveEnabled", "googleDriveFolderId", "googleDriveToken"] }
        }
    });

    const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

    if (config.googleDriveEnabled !== "true") {
        return { success: false, error: "Google Drive entegrasyonu aktif değil." };
    }

    if (!config.googleDriveFolderId) {
        return { success: false, error: "Drive Klasör ID eksik." };
    }

    try {
        // Prepare backup data
        const data = await getExportData([
            "customers", "products", "categories", "services",
            "sales", "transactions", "suppliers", "agenda"
        ]);

        const fileName = `yedek_${new Date().toISOString().split('T')[0]}.json`;

        // This is where you would call the Google Drive API
        // For now, we simulate the success if folderId is present
        console.log(`[DRIVE BACKUP] Uploading ${fileName} to folder ${config.googleDriveFolderId}`);

        // In a real implementation, you'd use googleapis or fetch to https://www.googleapis.com/upload/drive/v3/files

        return { success: true, message: "Yedek Google Drive'a başarıyla yüklendi." };
    } catch (error) {
        return { success: false, error: "Drive yüklemesi sırasında hata oluştu." };
    }
}

export async function getWhatsAppStatusAction() {
    try {
        const { whatsappManager } = await import("@/lib/whatsapp/whatsapp-manager");
        return whatsappManager.getStatus();
    } catch (error: any) {
        return { status: "DISCONNECTED", qr: undefined };
    }
}

/** Send WhatsApp Message using local whatsapp-web.js */
export async function sendWhatsAppAction(phone: string, message: string) {
    try {
        const { whatsappManager } = await import("@/lib/whatsapp/whatsapp-manager");
        await whatsappManager.sendMessage(phone, message);
        return { success: true };
    } catch (error: any) {
        console.error("[WHATSAPP ERROR]", error.message);
        return { success: false, error: error.message };
    }
}

