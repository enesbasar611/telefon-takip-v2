import cron from "node-cron";
import prisma from "@/lib/prisma";
import { getExportData } from "@/lib/actions/data-management-actions";
import { getGoogleDriveClient, ensureBackupFolder, uploadBackup } from "@/lib/google-drive";

/**
 * Schedule nightly backups at 03:00 AM
 */
export function initCronJobs() {
    console.log("[CRON] Initializing background tasks...");

    // 03:00 AM every day
    cron.schedule("0 3 * * *", async () => {
        console.log("[CRON] Starting nightly Google Drive backups...");
        await runNightlyBackups();
    });
}

async function runNightlyBackups() {
    // 1. Find all shops with Google Drive enabled
    const enabledShops = await prisma.setting.findMany({
        where: {
            key: "googleDriveEnabled",
            value: "true"
        },
        select: { shopId: true }
    });

    console.log(`[CRON] Found ${enabledShops.length} shops with Drive enabled.`);

    for (const { shopId } of enabledShops) {
        try {
            console.log(`[CRON] Processing backup for shop: ${shopId}`);

            // Get folder ID from settings
            const folderSetting = await prisma.setting.findUnique({
                where: { shopId_key: { shopId, key: "googleDriveFolderId" } }
            });

            const drive = await getGoogleDriveClient(shopId);
            let folderId = folderSetting?.value;

            if (!folderId) {
                folderId = await ensureBackupFolder(drive);
                if (folderId) {
                    await prisma.setting.upsert({
                        where: { shopId_key: { shopId, key: "googleDriveFolderId" } },
                        create: { shopId, key: "googleDriveFolderId", value: folderId },
                        update: { value: folderId }
                    });
                }
            }

            if (folderId) {
                // Prepare backup data
                const data = await getExportDataForShop(shopId);

                const fileName = `oto_yedek_${new Date().toISOString().split('T')[0]}.json`;
                await uploadBackup(drive, folderId, data, fileName);

                console.log(`[CRON] Successfully backed up shop ${shopId} to Drive.`);
            }
        } catch (error: any) {
            console.error(`[CRON ERROR] Failed to backup shop ${shopId}:`, error.message);
        }
    }
}

/**
 * Internal version of getExportData that takes shopId directly
 */
async function getExportDataForShop(shopId: string) {
    const categories: any[] = ["customers", "products", "categories", "services", "sales", "transactions", "suppliers", "agenda"];
    const result: Record<string, any[]> = {};

    await Promise.all(categories.map(async (cat: string) => {
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
