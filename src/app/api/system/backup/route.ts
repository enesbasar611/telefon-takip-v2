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

    if (token !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
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
    const categories: any[] = ["customers", "products", "categories", "services", "sales", "transactions", "suppliers", "agenda"];
    const result: Record<string, any[]> = {};

    await Promise.all(categories.map(async (cat: string) => {
        switch (cat) {
            case "customers":
                result.customers = await prisma.customer.findMany({
                    where: { shopId },
                });
                break;
            case "products":
                result.products = await prisma.product.findMany({
                    where: { shopId },
                });
                break;
            case "categories":
                result.categories = await prisma.category.findMany({
                    where: { shopId },
                });
                break;
            case "services":
                result.services = await prisma.serviceTicket.findMany({
                    where: { shopId },
                });
                break;
            case "sales":
                result.sales = await prisma.sale.findMany({
                    where: { shopId },
                });
                break;
            case "transactions":
                result.transactions = await prisma.transaction.findMany({
                    where: { shopId },
                });
                break;
            case "suppliers":
                result.suppliers = await prisma.supplier.findMany({
                    where: { shopId },
                });
                break;
            case "agenda":
                result.agenda = await (prisma as any).agendaEvent.findMany({
                    where: { shopId },
                });
                break;
        }
    }));

    return result;
}
