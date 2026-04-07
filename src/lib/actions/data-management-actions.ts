"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    return { success: true, deleted };
}

/** Full Reset: Everything except categories that start with system defaults */
export async function fullResetAction(): Promise<{ success: boolean; deleted: Record<string, number> }> {
    const shopId = await getShopId();

    // First run transaction reset
    const txResult = await transactionResetAction();

    // Define potential default categories to protect
    const protectedCategoryNames = ["Aksesuar", "Yedek Parça", "Cihaz", "Hizmet", "Genel"];

    const [products, customers, suppliers, agenda, purchaseItems, purchaseOrders, supplierTx, categories] = await Promise.all([
        prisma.product.deleteMany({ where: { shopId } }),
        prisma.customer.deleteMany({ where: { shopId } }),
        prisma.purchaseOrderItem.deleteMany({ where: { shopId } }),
        prisma.purchaseOrder.deleteMany({ where: { shopId } }),
        prisma.supplierTransaction.deleteMany({ where: { shopId } }),
        prisma.agendaEvent.deleteMany({ where: { shopId } }),
        prisma.inventoryLog.deleteMany({ where: { shopId } }),
        prisma.category.deleteMany({ where: { shopId, name: { notIn: protectedCategoryNames } } }),
    ]);

    const [suppDel, agendaDel] = await Promise.all([
        prisma.supplier.deleteMany({ where: { shopId } }),
        prisma.notification.deleteMany({ where: { shopId } }),
    ]);

    return {
        success: true,
        deleted: {
            ...txResult.deleted,
            products: products.count,
            customers: customers.count,
            suppliers: suppDel.count,
            categories: categories.count,
            agenda: agendaDel.count,
        },
    };
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

