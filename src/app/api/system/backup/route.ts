import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGoogleDriveClient, ensureBackupFolder, uploadBackup } from "@/lib/google-drive";

/**
 * Nightly Backup Trigger
 * This endpoint should be called by a cron job or the custom server.
 * Security: Use a secret token to prevent unauthorized access.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const authHeader = req.headers.get("Authorization");

    // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
    const isAuthorized =
        token === process.env.CRON_SECRET ||
        authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAuthorized && process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[NIGHTLY BACKUP] Starting...");

    const enabledShops = await prisma.setting.findMany({
        where: { key: "googleDriveEnabled", value: "true" },
        select: { shopId: true }
    });

    const results = [];

    for (const { shopId } of enabledShops) {
        try {
            const drive = await getGoogleDriveClient(shopId);

            const folderSetting = await prisma.setting.findUnique({
                where: { shopId_key: { shopId, key: "googleDriveFolderId" } }
            });

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
                results.push({ shopId, success: true });
            } else {
                throw new Error("Folder ID could not be determined.");
            }
        } catch (error: any) {
            console.error(`[NIGHTLY BACKUP ERROR] Shop ${shopId}:`, error.message);
            results.push({ shopId, success: false, error: error.message });
        }
    }

    return NextResponse.json({ success: true, results });
}

async function getExportDataForShop(shopId: string) {
    const categories: string[] = [
        "customers", "products", "categories", "services", "sales", "transactions",
        "suppliers", "agenda", "debts", "financeAccounts", "receiptSettings", "reminders",
        "saleItems", "serviceUsedParts", "inventoryMovements", "supplierTransactions",
        "serviceLogs", "returnTickets", "settings"
    ];
    const result: Record<string, any[]> = {};

    await Promise.all(categories.map(async (cat: string) => {
        let rawData: any[] = [];
        switch (cat) {
            case "customers": rawData = await prisma.customer.findMany({ where: { shopId } }); break;
            case "products": rawData = await prisma.product.findMany({ where: { shopId } }); break;
            case "categories": rawData = await prisma.category.findMany({ where: { shopId } }); break;
            case "services": rawData = await prisma.serviceTicket.findMany({ where: { shopId } }); break;
            case "sales": rawData = await prisma.sale.findMany({ where: { shopId } }); break;
            case "transactions": rawData = await prisma.transaction.findMany({ where: { shopId } }); break;
            case "suppliers": rawData = await prisma.supplier.findMany({ where: { shopId } }); break;
            case "agenda": rawData = await (prisma as any).agendaEvent.findMany({ where: { shopId } }); break;
            case "debts": rawData = await prisma.debt.findMany({ where: { shopId } }); break;
            case "financeAccounts": rawData = await prisma.financeAccount.findMany({ where: { shopId } }); break;
            case "receiptSettings": rawData = await prisma.receiptSettings.findMany({ where: { shopId } }); break;
            case "reminders": rawData = await prisma.reminder.findMany({ where: { shopId } }); break;
            case "saleItems": rawData = await prisma.saleItem.findMany({ where: { shopId } }); break;
            case "serviceUsedParts": rawData = await prisma.serviceUsedPart.findMany({ where: { shopId } }); break;
            case "inventoryMovements": rawData = await prisma.inventoryMovement.findMany({ where: { shopId } }); break;
            case "supplierTransactions": rawData = await prisma.supplierTransaction.findMany({ where: { shopId } }); break;
            case "serviceLogs": rawData = await prisma.serviceLog.findMany({ where: { shopId } }); break;
            case "returnTickets": rawData = await prisma.returnTicket.findMany({ where: { shopId } }); break;
            case "settings": rawData = await prisma.setting.findMany({ where: { shopId } }); break;
        }
        result[cat] = JSON.parse(JSON.stringify(rawData));
    }));

    return result;
}
