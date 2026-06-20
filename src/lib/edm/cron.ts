import { schedule } from "node-cron";
import prisma from "@/lib/prisma";
import { getInvoices as getEdmInvoices } from "./rest-client";

let cronInitialized = false;

export function initEdmCron() {
    if (cronInitialized) return;
    cronInitialized = true;

    // Her 15 dakikada bir gelen fatura senkronizasyonu
    schedule("*/15 * * * *", async () => {
        console.log("[CRON] Gelen fatura senkronizasyonu başlatılıyor...");
        try {
            const shops = await prisma.shop.findMany({
                where: { eDMSettings: { edmActive: true } },
                include: { eDMSettings: true },
            });

            for (const shop of shops) {
                try {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);

                    const invoices = await getEdmInvoices(
                        {
                            username: process.env.EDM_USERNAME || "",
                            password: process.env.EDM_PASSWORD || "",
                            senderVkn: shop.eDMSettings?.senderVkn || process.env.EDM_SENDER_VKN || "",
                            baseUrl: process.env.EDM_REST_API_URL,
                        } as any,
                        {
                            startDate: startDate.toISOString().split('T')[0],
                            endDate: endDate.toISOString().split('T')[0],
                            direction: "INBOUND",
                        }
                    );

                    let created = 0;
                    let updated = 0;

                    for (const inv of invoices) {
                        const uuid = inv.UUID || inv.uuid;
                        if (!uuid) continue;

                        const existing = await prisma.eDMIncomingInvoice.findUnique({
                            where: { shopId_uuid: { shopId: shop.id, uuid } },
                        });

                        const data = {
                            shopId: shop.id,
                            uuid,
                            invoiceId: inv.ID || inv.id || uuid,
                            senderVkn: inv.senderVKN || inv.sender || "",
                            senderName: inv.senderName || inv.supplier || "Bilinmeyen",
                            receiverVkn: inv.receiverVKN || shop.eDMSettings?.senderVkn || "",
                            amount: inv.payableAmount?.value || inv.amount || 0,
                            currency: inv.payableAmount?.currencyID === 0 ? "TRY" : (inv.currency || "TRY"),
                            status: inv.status || "PENDING",
                            issueDate: inv.issueDate ? new Date(inv.issueDate) : new Date(),
                            envelopeId: inv.envelopeId || null,
                        };

                        if (existing) {
                            await prisma.eDMIncomingInvoice.update({
                                where: { id: existing.id },
                                data: {
                                    status: data.status,
                                    amount: data.amount,
                                    syncedAt: new Date(),
                                },
                            });
                            updated++;
                        } else {
                            await prisma.eDMIncomingInvoice.create({ data });
                            created++;
                        }
                    }

                    console.log(`[CRON] Shop ${shop.id}: ${created} yeni, ${updated} güncellendi.`);
                } catch (shopError: any) {
                    console.error(`[CRON] Shop ${shop.id} hatası:`, shopError.message);
                }
            }
        } catch (error: any) {
            console.error("[CRON] Genel hata:", error.message);
        }
    });

    console.log("[CRON] EDM gelen fatura senkronizasyonu aktif (15dk).");
}
