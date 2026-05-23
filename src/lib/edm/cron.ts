import { schedule } from "node-cron";
import prisma from "@/lib/prisma";
import { EdmService } from "@/lib/edm/service";

let cronInitialized = false;

export function initEdmCron() {
    if (cronInitialized) return;
    cronInitialized = true;

    // Her 15 dakikada bir gelen fatura senkronizasyonu
    schedule("*/15 * * * *", async () => {
        console.log("[CRON] Gelen fatura senkronizasyonu başlatılıyor...");
        try {
            const shops = await prisma.shop.findMany({
                where: { edmSettings: { isActive: true } },
                include: { edmSettings: true },
            });

            for (const shop of shops) {
                try {
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);

                    const envelopes = await EdmService.getIncomingEnvelopes(startDate, endDate, {
                        baseUrl: process.env.EDM_REST_API_URL,
                        username: process.env.EDM_USERNAME,
                        password: process.env.EDM_PASSWORD,
                    });

                    let created = 0;
                    let updated = 0;

                    for (const env of envelopes) {
                        const uuid = env.UUID || env.uuid;
                        if (!uuid) continue;

                        const existing = await prisma.eDMIncomingInvoice.findUnique({
                            where: { shopId_uuid: { shopId: shop.id, uuid } },
                        });

                        const data = {
                            shopId: shop.id,
                            uuid,
                            invoiceId: env.ID || env.id || uuid,
                            senderVkn: env.senderVKN || env.sender || "",
                            senderName: env.senderName || env.supplier || "Bilinmeyen",
                            receiverVkn: env.receiverVKN || shop.edmSettings?.senderVkn || "",
                            amount: env.payableAmount?.value || env.amount || 0,
                            currency: env.payableAmount?.currencyID === 0 ? "TRY" : (env.currency || "TRY"),
                            status: env.status || "PENDING",
                            issueDate: env.issueDate ? new Date(env.issueDate) : new Date(),
                            envelopeId: env.envelopeId || null,
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
