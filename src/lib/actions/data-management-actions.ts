"use server";

import { auth, getShopId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag, revalidatePath } from "next/cache";

// ────────── EXPORT ──────────────────────────────────────────────────────────

export type ExportCategory =
    | "customers" | "products" | "categories" | "services"
    | "sales" | "transactions" | "suppliers" | "agenda"
    | "debts" | "financeAccounts" | "receiptSettings" | "reminders"
    | "saleItems" | "serviceUsedParts" | "inventoryMovements"
    | "supplierTransactions" | "serviceLogs" | "returnTickets" | "settings";

export async function getExportData(categories: ExportCategory[]) {
    const shopId = await getShopId();
    const result: Record<string, any[]> = {};

    await Promise.all(categories.map(async (cat) => {
        let rawData: any[] = [];
        switch (cat) {
            case "customers":
                rawData = await prisma.customer.findMany({ where: { shopId } }); break;
            case "products":
                rawData = await prisma.product.findMany({ where: { shopId } }); break;
            case "categories":
                rawData = await prisma.category.findMany({ where: { shopId } }); break;
            case "services":
                rawData = await prisma.serviceTicket.findMany({ where: { shopId } }); break;
            case "sales":
                rawData = await prisma.sale.findMany({ where: { shopId } }); break;
            case "transactions":
                rawData = await prisma.transaction.findMany({ where: { shopId } }); break;
            case "suppliers":
                rawData = await prisma.supplier.findMany({ where: { shopId } }); break;
            case "agenda":
                rawData = await (prisma as any).agendaEvent.findMany({ where: { shopId } }); break;
            case "debts":
                rawData = await prisma.debt.findMany({ where: { shopId } }); break;
            case "financeAccounts":
                rawData = await prisma.financeAccount.findMany({ where: { shopId } }); break;
            case "receiptSettings":
                rawData = await prisma.receiptSettings.findMany({ where: { shopId } }); break;
            case "reminders":
                rawData = await prisma.reminder.findMany({ where: { shopId } }); break;
            case "saleItems":
                rawData = await prisma.saleItem.findMany({ where: { shopId } }); break;
            case "serviceUsedParts":
                rawData = await prisma.serviceUsedPart.findMany({ where: { shopId } }); break;
            case "inventoryMovements":
                rawData = await prisma.inventoryMovement.findMany({ where: { shopId } }); break;
            case "supplierTransactions":
                rawData = await prisma.supplierTransaction.findMany({ where: { shopId } }); break;
            case "serviceLogs":
                rawData = await prisma.serviceLog.findMany({ where: { shopId } }); break;
            case "returnTickets":
                rawData = await prisma.returnTicket.findMany({ where: { shopId } }); break;
            case "settings":
                rawData = await prisma.setting.findMany({ where: { shopId } }); break;
        }

        // Sanitize data: Convert Decimals and serialize
        result[cat] = JSON.parse(JSON.stringify(rawData));
    }));

    return result;
}

// ────────── IMPORT ──────────────────────────────────────────────────────────

export async function importData(data: Record<string, any[]>, mode: "merge" | "restore" = "restore"): Promise<{ success: boolean; stats: Record<string, number>; error?: string }> {
    const shopId = await getShopId();
    const stats: Record<string, number> = {};

    try {
        await prisma.$transaction(async (tx: any) => {
            if (mode === "restore") {
                // Wipe data completely before restoring (except WhatsApp/Gemini keys)
                const deleteOrder = [
                    tx.attachment.deleteMany({ where: { shopId } }),
                    tx.saleItem.deleteMany({ where: { shopId } }),
                    tx.serviceUsedPart.deleteMany({ where: { shopId } }),
                    tx.serviceLog.deleteMany({ where: { shopId } }),
                    tx.returnTicket.deleteMany({ where: { shopId } }),
                    tx.inventoryMovement.deleteMany({ where: { shopId } }),
                    tx.inventoryLog.deleteMany({ where: { shopId } }),
                    tx.transaction.deleteMany({ where: { shopId } }),
                    tx.sale.deleteMany({ where: { shopId } }),
                    tx.serviceTicket.deleteMany({ where: { shopId } }),
                    tx.dailySession.deleteMany({ where: { shopId } }),
                    tx.debt.deleteMany({ where: { shopId } }),
                    tx.deviceHubInfo.deleteMany({ where: { shopId } }),
                    tx.product.deleteMany({ where: { shopId } }),
                    tx.shortageItem.deleteMany({ where: { shopId } }),
                    tx.customer.deleteMany({ where: { shopId } }),
                    tx.supplierTransaction.deleteMany({ where: { shopId } }),
                    tx.purchaseOrderItem.deleteMany({ where: { shopId } }),
                    tx.purchaseOrder.deleteMany({ where: { shopId } }),
                    tx.supplier.deleteMany({ where: { shopId } }),
                    tx.stockAIAlert.deleteMany({ where: { shopId } }),
                    tx.notification.deleteMany({ where: { shopId } }),
                    tx.reminder.deleteMany({ where: { shopId } }),
                    tx.agendaEvent.deleteMany({ where: { shopId } }),
                    tx.setting.deleteMany({ where: { shopId, NOT: { OR: [{ key: { startsWith: "whatsapp" } }, { key: "gemini_api_key" }] } } }),
                    tx.receiptSettings.deleteMany({ where: { shopId } }),
                    tx.financeAccount.deleteMany({ where: { shopId } }),
                    tx.category.deleteMany({ where: { shopId } })
                ];
                for (const del of deleteOrder) await del;
            }

            // Define topological restore order
            const restoreOrder = [
                { key: "settings", model: tx.setting },
                { key: "receiptSettings", model: tx.receiptSettings },
                { key: "financeAccounts", model: tx.financeAccount },
                { key: "customers", model: tx.customer },
                { key: "suppliers", model: tx.supplier },
                { key: "reminders", model: tx.reminder },
                { key: "agenda", model: tx.agendaEvent },
                { key: "categories", model: tx.category, selfRelational: true }, // parentId
                { key: "products", model: tx.product },
                { key: "serviceTickets", model: tx.serviceTicket },
                { key: "debts", model: tx.debt },
                { key: "supplierTransactions", model: tx.supplierTransaction },
                { key: "sales", model: tx.sale },
                { key: "saleItems", model: tx.saleItem },
                { key: "serviceUsedParts", model: tx.serviceUsedPart },
                { key: "serviceLogs", model: tx.serviceLog },
                { key: "inventoryMovements", model: tx.inventoryMovement },
                { key: "returnTickets", model: tx.returnTicket },
                { key: "transactions", model: tx.transaction },
            ];

            for (const step of restoreOrder) {
                const items = data[step.key];
                if (items && items.length > 0) {
                    if (step.selfRelational) {
                        // For self-relations like categories with parentId, insert roots first
                        const sorted = [...items].sort((a, b) => (!a.parentId ? -1 : 1));
                        for (const item of sorted) {
                            try {
                                await step.model.create({ data: { ...item, shopId } });
                                stats[step.key] = (stats[step.key] || 0) + 1;
                            } catch { /* ignore dups */ }
                        }
                    } else {
                        // Bulk create is faster but we might need to skip duplicates
                        try {
                            const res = await step.model.createMany({
                                data: items.map(item => ({ ...item, shopId })),
                                skipDuplicates: true
                            });
                            stats[step.key] = res.count;
                        } catch (e: any) {
                            console.error(`Restore error on ${step.key}:`, e.message);
                            // Fallback to row-by-row if createMany fails due to edge cases
                            for (const item of items) {
                                try {
                                    await step.model.create({ data: { ...item, shopId } });
                                    stats[step.key] = (stats[step.key] || 0) + 1;
                                } catch { /* ignore */ }
                            }
                        }
                    }
                }
            }
        });

        revalidateTag(`dashboard-${shopId}`);
        revalidatePath("/", "layout");

        return { success: true, stats };
    } catch (error: any) {
        console.error("importData error", error);
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

import { getGoogleDriveClient, ensureBackupFolder, uploadBackup } from "@/lib/google-drive";

/**
 * Ensures Google Drive folder exists and saves its ID to settings.
 */
export async function ensureGoogleDriveFolderAction() {
    const shopId = await getShopId();

    try {
        const drive = await getGoogleDriveClient(shopId);
        const folderId = await ensureBackupFolder(drive);

        // Save Folder ID to settings
        await prisma.setting.upsert({
            where: { shopId_key: { shopId, key: "googleDriveFolderId" } },
            create: { shopId, key: "googleDriveFolderId", value: folderId },
            update: { value: folderId }
        });

        revalidatePath("/ayarlar");
        return { success: true, folderId };
    } catch (error: any) {
        console.error("[DRIVE FOLDER ERROR]", error);
        return { success: false, error: error.message || "Drive klasörü oluşturulamadı. Lütfen Google ile giriş yapıldığından emin olun." };
    }
}

/** Backup to Google Drive (Functional) */
export async function backupToDriveAction() {
    const shopId = await getShopId();

    // 1. Get Google Drive Settings
    const settings = await prisma.setting.findMany({
        where: {
            shopId,
            key: { in: ["googleDriveEnabled", "googleDriveFolderId"] }
        }
    });

    const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

    if (config.googleDriveEnabled !== "true") {
        return { success: false, error: "Google Drive entegrasyonu aktif değil." };
    }

    try {
        const drive = await getGoogleDriveClient(shopId);
        let folderId = config.googleDriveFolderId;

        if (!folderId) {
            folderId = await ensureBackupFolder(drive);
            await prisma.setting.upsert({
                where: { shopId_key: { shopId, key: "googleDriveFolderId" } },
                create: { shopId, key: "googleDriveFolderId", value: folderId },
                update: { value: folderId }
            });
        }

        // Prepare backup data
        const data = await getExportData([
            "customers", "products", "categories", "services", "sales", "transactions",
            "suppliers", "agenda", "debts", "financeAccounts", "receiptSettings", "reminders",
            "saleItems", "serviceUsedParts", "inventoryMovements", "supplierTransactions",
            "serviceLogs", "returnTickets", "settings"
        ]);

        const fileName = `yedek_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}.json`;

        await uploadBackup(drive, folderId, data, fileName);

        return { success: true, message: "Yedek Google Drive'a başarıyla yüklendi." };
    } catch (error: any) {
        console.error("[DRIVE UPLOAD ERROR]", error);
        return { success: false, error: error.message || "Drive yüklemesi sırasında hata oluştu." };
    }
}

export async function getWhatsAppStatusAction() {
    try {
        const shopId = await getShopId();
        const { whatsappManager } = await import("@/lib/whatsapp/whatsapp-manager");
        return await whatsappManager.getStatus(shopId);
    } catch (error: any) {
        return { status: "DISCONNECTED", qr: undefined };
    }
}

/** Send WhatsApp Message using local whatsapp-web.js */
export async function sendWhatsAppAction(phone: string, message: string) {
    try {
        const shopId = await getShopId();
        const { whatsappManager } = await import("@/lib/whatsapp/whatsapp-manager");
        await whatsappManager.sendMessage(shopId, phone, message);
        return { success: true };
    } catch (error: any) {
        console.error("[WHATSAPP ERROR]", error.message);
        return { success: false, error: error.message };
    }
}

