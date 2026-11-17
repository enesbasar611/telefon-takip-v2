"use server";

import prisma from "@/lib/prisma";
import { getShopId, getUserId } from "@/lib/auth";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { revalidatePath } from "next/cache";
import { revalidateSmartReplenishment } from "@/lib/inventory/replenishment-cache";
import { callGemini } from "@/lib/actions/gemini-actions";
import {
    type ParsedWholesalerItem,
    smartDetectCategory,
    generateProductSku,
    detectColorInName,
    STANDARD_CATEGORIES
} from "@/lib/stock/wholesaler-parser";

export interface WholesalerImportItemInput {
    name: string;
    category: string;
    brand?: string;
    quantity: number;
    buyPriceUsd: number;
    sellPriceUsd: number;
    color?: string;
    sku?: string;
}

export interface WholesalerImportBatchPayload {
    items: WholesalerImportItemInput[];
    supplierId?: string | null;
    paymentStatus: "PAID" | "PARTIAL" | "UNPAID" | "NONE"; // PAID = Peşin, PARTIAL = Kısmi, UNPAID = Açık hesap / Veresiye, NONE = Tedarikçi yok
    paidAmount?: number; // Ödenen tutar (TRY)
    accountId?: string; // Ödemenin çekileceği Kasa/Banka hesap ID
    paymentMethod?: "CASH" | "CARD" | "TRANSFER";
    notes?: string;
    addToStock?: boolean; // false ise ürünler stoğa eklenmez, sadece tedarikçi fişi & cari borcu işlenir
}

export interface WholesalerImportResult {
    success: boolean;
    error?: string;
    createdCount: number;
    updatedCount: number;
    totalQuantity: number;
    totalAmountUsd: number;
    totalAmountTry: number;
    supplierUpdated: boolean;
    batchId?: string;
    purchaseOrderId?: string;
}

export interface WholesalerBatchRecord {
    batchId: string;
    createdAt: string;
    shopId: string;
    supplierId?: string | null;
    supplierName?: string | null;
    purchaseOrderId?: string | null;
    purchaseOrderNo?: string | null;
    addToStock: boolean;
    totalQuantity: number;
    totalAmountUsd: number;
    totalAmountTry: number;
    paidAmountTry: number;
    remainingAmountTry: number;
    remainingAmountUsd: number;
    accountId?: string | null;
    financeTransactionId?: string | null;
    supplierTransactionIds: string[];
    inventoryLogIds: string[];
    affectedProducts: {
        productId: string;
        name: string;
        quantity: number;
        wasCreated: boolean;
        previousStock: number;
        newStock: number;
    }[];
    undone?: boolean;
    undoneAt?: string;
}

export interface StockMatchInfo {
    id: string;
    name: string;
    stock: number;
    isExact: boolean;
}

/**
 * Önizleme modalında ürünlerin mağaza stoğunda zaten kayıtlı olup olmadığını
 * toplu olarak sorgular ve uyarı rozetleri için veri sağlar.
 */
export async function checkWholesalerStockMatchesAction(
    names: string[]
): Promise<Record<string, StockMatchInfo>> {
    try {
        const shopId = await getShopId();
        if (!shopId || !names || names.length === 0) return {};

        const cleanNames = Array.from(new Set(names.map(n => n.trim()))).filter(Boolean);

        // Mağazadaki aktif ürünleri getir
        const existingProducts = await prisma.product.findMany({
            where: {
                shopId,
                isDeleted: false,
                name: { in: cleanNames, mode: "insensitive" }
            },
            select: {
                id: true,
                name: true,
                stock: true,
            }
        });

        const resultMap: Record<string, StockMatchInfo> = {};
        
        // Exact eşleşmeleri haritalandır (küçük harf normalizasyonu ile)
        existingProducts.forEach(p => {
            resultMap[p.name.trim().toLowerCase()] = {
                id: p.id,
                name: p.name,
                stock: p.stock,
                isExact: true
            };
        });

        return resultMap;
    } catch (err) {
        console.error("Check stock matches error:", err);
        return {};
    }
}

/**
 * Toptancıdan alınan parçaları tek işlemde (transaction) sisteme aktarır.
 * P2028 zaman aşımı hatalarını önlemek için kategorileri ve mevcut ürünleri
 * döngü öncesinde toplu (batch) sorgular ve transaction süresini 60 saniyeye genişletir.
 */
export async function importWholesalerBatchAction(
    payload: WholesalerImportBatchPayload
): Promise<WholesalerImportResult> {
    try {
        const shopId = await getShopId();
        if (!shopId) {
            return {
                success: false,
                error: "Dükkan oturumu bulunamadı.",
                createdCount: 0,
                updatedCount: 0,
                totalQuantity: 0,
                totalAmountUsd: 0,
                totalAmountTry: 0,
                supplierUpdated: false,
            };
        }

        const userId = await getUserId();
        const { items, supplierId, paymentStatus, notes, addToStock = true } = payload;

        if (!items || items.length === 0) {
            return {
                success: false,
                error: "İçe aktarılacak geçerli ürün bulunamadı.",
                createdCount: 0,
                updatedCount: 0,
                totalQuantity: 0,
                totalAmountUsd: 0,
                totalAmountTry: 0,
                supplierUpdated: false,
            };
        }

        // Güncel USD kurunu al
        const rates = await getExchangeRates(shopId);
        const usdRate = rates?.usd && rates.usd > 0 ? Number(rates.usd) : 34.5;

        let totalQty = 0;
        let totalUsd = 0;
        items.forEach(it => {
            totalQty += it.quantity;
            totalUsd += it.buyPriceUsd * it.quantity;
        });
        const totalTry = Math.round(totalUsd * usdRate * 100) / 100;

        // Transaction seçenekleri: maxWait 15sn, timeout 60sn
        const result = await prisma.$transaction(async (tx) => {
            const now = new Date();
            // 1. Kategorileri tek seferde hazırla (Bulk Category Prep)
            const uniqueCategories = Array.from(new Set(items.map(it => (it.category || "Yedek Parça").trim()))).filter(Boolean);
            const existingCategories = await tx.category.findMany({
                where: { shopId }
            });
            const categoryCache = new Map<string, string>();
            existingCategories.forEach(c => categoryCache.set(c.name.trim().toLowerCase(), c.id));

            for (const catName of uniqueCategories) {
                const key = catName.toLowerCase();
                if (!categoryCache.has(key)) {
                    const newCat = await tx.category.create({
                        data: {
                            name: catName,
                            shopId
                        }
                    });
                    categoryCache.set(key, newCat.id);
                }
            }

            // 2. Mevcut ürünleri tek seferde çek (Bulk Product Lookup)
            const cleanNames = Array.from(new Set(items.map(it => it.name.trim()))).filter(Boolean);
            const existingProductsList = await tx.product.findMany({
                where: {
                    shopId,
                    isDeleted: false,
                    name: { in: cleanNames, mode: "insensitive" }
                },
                select: {
                    id: true,
                    name: true,
                    stock: true,
                    supplierId: true,
                }
            });

            // Küçük harfli lookup haritası oluştur
            const productMap = new Map<string, { id: string; name: string; stock: number; supplierId: string | null }>();
            existingProductsList.forEach(p => {
                productMap.set(p.name.trim().toLowerCase(), p);
            });

            // Dükkandaki mevcut SKU'ları çek ve benzersizlik sağla
            const existingSkusList = await tx.product.findMany({
                where: { shopId, sku: { not: null } },
                select: { sku: true }
            });
            const existingSkus = new Set(existingSkusList.map(p => p.sku!));

            const getUniqueSku = (baseSku?: string): string | null => {
                if (!baseSku) return null;
                let candidate = baseSku;
                let attempts = 0;
                while (existingSkus.has(candidate) && attempts < 20) {
                    const rand = Math.floor(100 + Math.random() * 900);
                    candidate = candidate.replace(/-\d+$/, `-${rand}`);
                    attempts++;
                }
                existingSkus.add(candidate);
                return candidate;
            };

            let createdCount = 0;
            let updatedCount = 0;
            const orderItemsData: {
                productId: string | null;
                name: string;
                quantity: number;
                buyPriceTry: number;
                buyPriceUsd: number;
            }[] = [];

            const affectedProductsList: WholesalerBatchRecord["affectedProducts"] = [];
            const createdInventoryLogIds: string[] = [];
            const createdSupplierTxIds: string[] = [];
            let createdFinanceTxId: string | null = null;
            let createdPurchaseOrderId: string | null = null;
            let createdPurchaseOrderNo: string | null = null;
            let createdSupplierName: string | null = null;
            let actualPaidTry = 0;
            let actualRemainingTry = 0;
            let actualRemainingUsd = 0;

            // 3. Döngü içerisinde hızlı güncelleme ve oluşturmalar
            for (const item of items) {
                const cleanName = (item.name || "").trim().replace(/^(\d+[\.\-\)]\s*)+/, "").trim();
                if (!cleanName || cleanName.startsWith("%") || cleanName.length < 2) {
                    continue; // Geçersiz veya yüzde/iskonto satırlarını atla
                }

                const catKey = (item.category || "Yedek Parça").trim().toLowerCase();
                const categoryId = categoryCache.get(catKey) || categoryCache.get("yedek parça") || Array.from(categoryCache.values())[0];

                const buyPriceTry = Math.round(item.buyPriceUsd * usdRate * 100) / 100;
                const sellPriceTry = Math.round(item.sellPriceUsd * usdRate * 100) / 100;

                const lookupKey = cleanName.toLowerCase();
                const existingProduct = productMap.get(lookupKey);

                if (addToStock) {
                    if (existingProduct) {
                        // Mevcut ürün: stoğunu artır, fiyatlarını güncelle
                        const prevStock = existingProduct.stock;
                        const newStock = existingProduct.stock + item.quantity;
                        await tx.product.update({
                            where: { id: existingProduct.id },
                            data: {
                                stock: newStock,
                                buyPrice: buyPriceTry,
                                buyPriceUsd: item.buyPriceUsd,
                                sellPrice: sellPriceTry,
                                sellPriceUsd: item.sellPriceUsd,
                                supplierId: supplierId || existingProduct.supplierId || null,
                            }
                        });

                        const invLog = await tx.inventoryLog.create({
                            data: {
                                productId: existingProduct.id,
                                userId: userId || null,
                                quantity: item.quantity,
                                type: "PURCHASE",
                                notes: `Toptancı Stok Girişi (+${item.quantity} Adet - Alış: $${item.buyPriceUsd})`,
                                shopId,
                            }
                        });
                        createdInventoryLogIds.push(invLog.id);

                        existingProduct.stock = newStock;
                        affectedProductsList.push({
                            productId: existingProduct.id,
                            name: cleanName,
                            quantity: item.quantity,
                            wasCreated: false,
                            previousStock: prevStock,
                            newStock,
                        });

                        orderItemsData.push({
                            productId: existingProduct.id,
                            name: cleanName,
                            quantity: item.quantity,
                            buyPriceTry,
                            buyPriceUsd: item.buyPriceUsd
                        });
                        updatedCount++;
                    } else {
                        // Yeni ürün oluştur
                        const uniqueSku = getUniqueSku(item.sku);
                        const newProduct = await tx.product.create({
                            data: {
                                sku: uniqueSku,
                                name: cleanName,
                                categoryId,
                                supplierId: supplierId || null,
                                buyPrice: buyPriceTry,
                                buyPriceUsd: item.buyPriceUsd,
                                sellPrice: sellPriceTry,
                                sellPriceUsd: item.sellPriceUsd,
                                stock: item.quantity,
                                criticalStock: 1,
                                shopId,
                                attributes: item.color ? { color: item.color } : undefined,
                            }
                        });

                        const invLog = await tx.inventoryLog.create({
                            data: {
                                productId: newProduct.id,
                                userId: userId || null,
                                quantity: item.quantity,
                                type: "PURCHASE",
                                notes: `Toptancı İlk Stok Girişi (${item.quantity} Adet - Alış: $${item.buyPriceUsd})`,
                                shopId,
                            }
                        });
                        createdInventoryLogIds.push(invLog.id);

                        productMap.set(lookupKey, {
                            id: newProduct.id,
                            name: newProduct.name,
                            stock: newProduct.stock,
                            supplierId: newProduct.supplierId,
                        });

                        affectedProductsList.push({
                            productId: newProduct.id,
                            name: cleanName,
                            quantity: item.quantity,
                            wasCreated: true,
                            previousStock: 0,
                            newStock: item.quantity,
                        });

                        orderItemsData.push({
                            productId: newProduct.id,
                            name: cleanName,
                            quantity: item.quantity,
                            buyPriceTry,
                            buyPriceUsd: item.buyPriceUsd
                        });
                        createdCount++;
                    }
                } else {
                    // addToStock === false: Ürünler stoğa EKLENMEZ, sayımlar değişmez!
                    // Sadece tedarikçi siparişi için kalem verisi hazırlanır.
                    orderItemsData.push({
                        productId: existingProduct ? existingProduct.id : null,
                        name: cleanName,
                        quantity: item.quantity,
                        buyPriceTry,
                        buyPriceUsd: item.buyPriceUsd
                    });
                }
            }

            // 4. Tedarikçi Bakiye, Sipariş (PurchaseOrder) ve Cari Yönetimi
            let supplierUpdated = false;
            if (supplierId && paymentStatus !== "NONE") {
                const supplier = await tx.supplier.findUnique({
                    where: { id: supplierId, shopId }
                });

                if (supplier) {
                    createdSupplierName = supplier.name;
                    let paidTry = 0;
                    if (paymentStatus === "PAID") {
                        paidTry = totalTry;
                    } else if (paymentStatus === "PARTIAL") {
                        paidTry = Math.min(totalTry, Math.max(0, Number(payload.paidAmount || 0)));
                    } else {
                        paidTry = 0;
                    }
                    const remainingTry = Math.max(0, Math.round((totalTry - paidTry) * 100) / 100);
                    const paidUsd = Number((paidTry / usdRate).toFixed(2));
                    const remainingUsd = Number((remainingTry / usdRate).toFixed(2));
                    actualPaidTry = paidTry;
                    actualRemainingTry = remainingTry;
                    actualRemainingUsd = remainingUsd;

                    const effectivePaymentStatus: "PAID" | "PARTIAL" | "UNPAID" =
                        remainingTry <= 0 ? "PAID" : paidTry > 0 ? "PARTIAL" : "UNPAID";
                    const payMethod = payload.paymentMethod || "CASH";

                    // Benzersiz Sipariş Numarası Üret: SIP-YYYYMMDD-XXXX
                    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
                    let orderNo = `SIP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
                    let attempts = 0;
                    while (attempts < 10) {
                        const exists = await tx.purchaseOrder.findUnique({
                            where: { shopId_orderNo: { shopId, orderNo } }
                        });
                        if (!exists) break;
                        orderNo = `SIP-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
                        attempts++;
                    }
                    createdPurchaseOrderNo = orderNo;

                    // 4.1. PurchaseOrder Oluştur (Tedarikçi sayfasında görünür)
                    const purchaseOrder = await tx.purchaseOrder.create({
                        data: {
                            shopId,
                            supplierId,
                            orderNo,
                            totalAmount: totalTry,
                            netAmount: Math.round(totalTry * 0.8 * 100) / 100,
                            vatAmount: Math.round(totalTry * 0.2 * 100) / 100,
                            discount: 0,
                            remainingAmount: remainingTry,
                            paymentStatus: effectivePaymentStatus,
                            paymentMethod: payMethod,
                            status: "COMPLETED",
                            receivedAt: now,
                            description: `Toptancı Fiş/AI Stok Girişi (${items.length} Kalem, ${totalQty} Adet)${!addToStock ? " [Stoğa Eklenmedi - Sadece Fiş]" : ""}${notes ? ` - ${notes}` : ""}`,
                            items: {
                                create: orderItemsData.map(it => ({
                                    productId: it.productId,
                                    name: it.name,
                                    quantity: it.quantity,
                                    receivedQuantity: it.quantity,
                                    buyPrice: it.buyPriceTry,
                                    buyPriceUsd: it.buyPriceUsd,
                                    vatRate: 20,
                                    shopId,
                                }))
                            }
                        }
                    });
                    createdPurchaseOrderId = purchaseOrder.id;

                    // 4.2. Peşin veya Kısmi Ödeme Yapıldıysa: Kasadan Düş + Finans Hareketleri
                    if (paidTry > 0 && payload.accountId) {
                        // Seçilen kasadan düş
                        await tx.financeAccount.update({
                            where: { id: payload.accountId },
                            data: { balance: { decrement: paidTry } }
                        });

                        // İşletme genel kasa gideri (EXPENSE)
                        const financeTx = await tx.transaction.create({
                            data: {
                                shopId,
                                type: "EXPENSE",
                                amount: paidTry,
                                currency: "TRY",
                                paymentMethod: payMethod,
                                financeAccountId: payload.accountId,
                                supplierId,
                                userId: userId || null,
                                category: "TEDARİKÇİ",
                                description: `[Toptancı Alımı - ${effectivePaymentStatus === "PAID" ? "Peşin" : "Kısmi"}] ${supplier.name} (${orderNo})`
                            }
                        });
                        createdFinanceTxId = financeTx.id;

                        // Tedarikçi ödeme ekstresi kaydı (EXPENSE = tedarikçiye ödeme yapıldı)
                        const sTxExp = await tx.supplierTransaction.create({
                            data: {
                                shopId,
                                supplierId,
                                purchaseOrderId: purchaseOrder.id,
                                type: "EXPENSE",
                                amount: paidTry,
                                amountUsd: paidUsd,
                                exchangeRate: usdRate,
                                description: `${orderNo} nolu sipariş ${effectivePaymentStatus === "PARTIAL" ? "kısmi ödemesi" : "peşin ödemesi"}`,
                                date: now,
                            }
                        });
                        createdSupplierTxIds.push(sTxExp.id);
                    }

                    // 4.3. Kalan Borç Varsa: Tedarikçi Ekstresine Borç Olarak Ekle (INCOME = borçlandık)
                    if (remainingTry > 0) {
                        const sTxInc = await tx.supplierTransaction.create({
                            data: {
                                shopId,
                                supplierId,
                                purchaseOrderId: purchaseOrder.id,
                                type: "INCOME",
                                amount: remainingTry,
                                amountUsd: remainingUsd,
                                exchangeRate: usdRate,
                                description: `${orderNo} nolu sipariş kalan borcu (${effectivePaymentStatus === "PARTIAL" ? "Kısmi Veresiye" : "Açık Hesap"})`,
                                date: now,
                            }
                        });
                        createdSupplierTxIds.push(sTxInc.id);
                    }

                    // 4.4. Tedarikçi Cari Bakiye Güncelleme
                    await tx.supplier.update({
                        where: { id: supplierId },
                        data: {
                            totalShopping: { increment: totalTry },
                            balance: { increment: remainingTry },
                            balanceUsd: { increment: remainingUsd },
                        }
                    });

                    supplierUpdated = true;
                }
            }

            // 5. Geri Alma (Rollback) İçin Son İşlem Kaydını Sakla
            const batchId = `BATCH-${Date.now()}`;
            const batchRecord: WholesalerBatchRecord = {
                batchId,
                createdAt: now.toISOString(),
                shopId,
                supplierId: supplierId || null,
                supplierName: createdSupplierName,
                purchaseOrderId: createdPurchaseOrderId,
                purchaseOrderNo: createdPurchaseOrderNo,
                addToStock,
                totalQuantity: totalQty,
                totalAmountUsd: Number(totalUsd.toFixed(2)),
                totalAmountTry: totalTry,
                paidAmountTry: actualPaidTry,
                remainingAmountTry: actualRemainingTry,
                remainingAmountUsd: actualRemainingUsd,
                accountId: payload.accountId || null,
                financeTransactionId: createdFinanceTxId,
                supplierTransactionIds: createdSupplierTxIds,
                inventoryLogIds: createdInventoryLogIds,
                affectedProducts: affectedProductsList,
                undone: false,
            };

            await tx.setting.upsert({
                where: { shopId_key: { shopId, key: "LAST_WHOLESALER_IMPORT_BATCH" } },
                create: { shopId, key: "LAST_WHOLESALER_IMPORT_BATCH", value: JSON.stringify(batchRecord) },
                update: { value: JSON.stringify(batchRecord) },
            });

            return {
                createdCount,
                updatedCount,
                supplierUpdated,
                batchId,
                purchaseOrderId: createdPurchaseOrderId || undefined,
            };
        }, {
            maxWait: 15000, // 15 saniye bağlantı bekleme
            timeout: 60000, // 60 saniye işlem zaman aşımı
        });

        revalidatePath("/stok");
        revalidatePath("/tedarikciler");
        revalidatePath("/finans");
        revalidatePath("/stok/siparisler");
        revalidateSmartReplenishment(shopId);

        return {
            success: true,
            createdCount: result.createdCount,
            updatedCount: result.updatedCount,
            totalQuantity: totalQty,
            totalAmountUsd: Number(totalUsd.toFixed(2)),
            totalAmountTry: totalTry,
            supplierUpdated: result.supplierUpdated,
            batchId: result.batchId,
            purchaseOrderId: result.purchaseOrderId,
        };
    } catch (error: any) {
        console.error("Wholesaler batch import error:", error);
        return {
            success: false,
            error: error?.message || "İçe aktarma sırasında bir hata oluştu.",
            createdCount: 0,
            updatedCount: 0,
            totalQuantity: 0,
            totalAmountUsd: 0,
            totalAmountTry: 0,
            supplierUpdated: false,
        };
    }
}

/**
 * Toptancıdan gelen fatura / satış özet fişini (PDF veya görsel formatında)
 * multimodal yapay zeka (Gemini) ile analiz ederek ürün adları, adetler,
 * birim alış fiyatları ($/₺) ve uygun kategorileri çıkarır.
 */
export async function parseWholesalerDocumentWithAIAction(payload: {
    base64Data: string;
    mimeType: string;
    defaultMarkup?: number;
}): Promise<{
    success: boolean;
    error?: string;
    items?: ParsedWholesalerItem[];
    supplierName?: string | null;
    matchedSupplierId?: string | null;
    totalBuyUsd?: number;
    totalQuantity?: number;
}> {
    try {
        const shopId = await getShopId();
        if (!shopId) {
            return { success: false, error: "Dükkan oturumu bulunamadı." };
        }

        const { base64Data, mimeType, defaultMarkup = 5.00 } = payload;
        if (!base64Data) {
            return { success: false, error: "Belge verisi alınamadı." };
        }

        // Güncel USD kurunu al
        const rates = await getExchangeRates(shopId);
        const usdRate = rates?.usd && rates.usd > 0 ? Number(rates.usd) : 34.5;

        const promptText = `Sen bir toptancı faturası ve satış fişi ayrıştırma uzmanısın.
Sana verilen fatura belgesindeki (PDF veya görsel) tüm ürün/parça satırlarını eksiksiz oku ve geçerli JSON olarak döndür.

DİKKAT EDİLECEK HUSUSLAR:
1. Ürün Adı (name): Tablonun "Açıklama" veya "Ürün Tanımı" sütunundaki ürünün net adı. Sıra numarası veya adet ibaresi ekleme. Örn: "LUCATECH LT-601 ENC TWS AİRPODS KULAKLIK", "BAYROX AIR PRO 2 ANC ENC EARPHONE".
2. Miktar (quantity): "Miktar" veya "Adet" sütunundaki sayı (Örn: "2 ad" -> 2). Belirtilmemişse 1 al.
3. Alış Fiyatı (buyPrice): "Birim Fiyat" veya "Fiyat" sütunundaki sayı (1 adet birim alış fiyatı).
   - Faturadaki para birimi dolar ($ veya USD) ise "currency": "USD" yap.
   - Faturadaki para birimi TL (₺ veya TRY) ise "currency": "TRY" yap.
4. Kategori (category): Ürünün türüne göre en uygun kategoriyi belirle:
   "Kulaklık", "Şarj Başlığı", "Set Şarj", "Type-C Kablo", "Lightning Kablo", "Kablo", "Kılıf", "Ekran Koruyucu", "Powerbank", "LCD / Ekran", "LCD / Ekran (Çıtalı)", "Kapak", "Batarya", "Şarj Soketi", "Kamera", "Kasa", "Flex / Entegre", "Hoparlör / Ahize", "Yedek Parça", "Aksesuar".
5. Marka (brand): Ürün veya toptancı markası (Örn: "Lucatech", "Bayrox", "Syrox", "Deji", "Apple", "Samsung" vb.).
6. Renk (color): Ürün adında geçen renk varsa yaz (Örn: "Siyah", "Beyaz"), yoksa null.
7. Tedarikçi/Toptancı Adı (supplierName): Faturanın tepesindeki satıcı firma/toptancı adı (Örn: "BAYROX TOPTAN", "BAYRAK ELEKTRONİK").
8. Toplam Fatura Tutarı (invoiceTotal): Faturanın genel toplam tutarı (sayı).

YANIT ŞEMASI (Sadece geçerli JSON döndür):
{
  "supplierName": "string veya null",
  "invoiceTotal": 0.0,
  "currency": "USD veya TRY",
  "items": [
    {
      "name": "string",
      "quantity": 1,
      "buyPrice": 0.0,
      "currency": "USD veya TRY",
      "category": "string",
      "brand": "string veya null",
      "color": "string veya null"
    }
  ]
}`;

        const geminiRes = await callGemini(
            shopId,
            [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType || "application/pdf"
                    }
                },
                promptText
            ],
            "json"
        );

        if ("error" in geminiRes) {
            return { success: false, error: geminiRes.error };
        }

        let parsedJson: any;
        try {
            parsedJson = JSON.parse(geminiRes.text);
        } catch (e) {
            return { success: false, error: "Yapay zeka yanıtı JSON formatına dönüştürülemedi." };
        }

        const rawItems = Array.isArray(parsedJson.items) ? parsedJson.items : [];
        if (rawItems.length === 0) {
            return { success: false, error: "Belgede herhangi bir ürün veya fiyat satırı bulunamadı." };
        }

        // Tedarikçi eşleşmesi ara
        let matchedSupplierId: string | null = null;
        const detectedSupplierName = parsedJson.supplierName || null;
        if (detectedSupplierName) {
            const suppliers = await prisma.supplier.findMany({
                where: { shopId },
                select: { id: true, name: true }
            });
            const cleanDet = detectedSupplierName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, "");
            const match = suppliers.find(s => {
                const cleanS = s.name.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, "");
                return cleanDet.includes(cleanS) || cleanS.includes(cleanDet);
            });
            if (match) {
                matchedSupplierId = match.id;
            }
        }

        // Kalemleri ParsedWholesalerItem formatına dönüştür
        const items: ParsedWholesalerItem[] = rawItems.map((it: any, index: number) => {
            const cleanName = String(it.name || "").trim();
            const qty = Math.max(1, parseInt(it.quantity) || 1);
            const isTry = it.currency === "TRY" || (!it.currency && Number(it.buyPrice || 0) > 60);

            let buyPriceUsd = 0;
            if (isTry) {
                buyPriceUsd = Math.round((Number(it.buyPrice || 0) / usdRate) * 100) / 100;
            } else {
                buyPriceUsd = Math.round(Number(it.buyPrice || 0) * 100) / 100;
            }

            const sellPriceUsd = Number((buyPriceUsd + defaultMarkup).toFixed(2));
            const category = it.category && STANDARD_CATEGORIES.includes(it.category)
                ? it.category
                : smartDetectCategory(cleanName, it.category);
            const color = it.color || detectColorInName(cleanName);
            const sku = generateProductSku(cleanName, category, it.brand || undefined);

            return {
                id: `ai-doc-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                sku,
                name: cleanName,
                category,
                brand: it.brand || undefined,
                quantity: qty,
                buyPriceUsd,
                sellPriceUsd,
                color,
                selected: true,
            };
        });

        const totalBuyUsd = Number(items.reduce((acc, it) => acc + (it.buyPriceUsd * it.quantity), 0).toFixed(2));
        const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);

        return {
            success: true,
            items,
            supplierName: detectedSupplierName,
            matchedSupplierId,
            totalBuyUsd,
            totalQuantity,
        };
    } catch (err: any) {
        console.error("parseWholesalerDocumentWithAIAction error:", err);
        return { success: false, error: err?.message || "Belge işlenirken bir hata oluştu." };
    }
}

/**
 * Yapıştırılan serbest veya karmaşık toptancı metnini Gemini AI ile analiz eder.
 * Çok satırlı fatura dökümleri, WhatsApp mesajları veya Excel kopyalarında
 * ürün adlarını, adetleri ve birim alış fiyatlarını yüksek doğrulukla çıkarır.
 */
export async function parseWholesalerRawTextWithAIAction(payload: {
    text: string;
    defaultMarkup?: number;
}): Promise<{
    success: boolean;
    error?: string;
    items?: ParsedWholesalerItem[];
    supplierName?: string | null;
    matchedSupplierId?: string | null;
    totalBuyUsd?: number;
    totalQuantity?: number;
}> {
    try {
        const shopId = await getShopId();
        if (!shopId) {
            return { success: false, error: "Dükkan oturumu bulunamadı." };
        }

        const { text, defaultMarkup = 5.00 } = payload;
        if (!text || !text.trim()) {
            return { success: false, error: "Ayrıştırılacak metin bulunamadı." };
        }

        const rates = await getExchangeRates(shopId);
        const usdRate = rates?.usd && rates.usd > 0 ? Number(rates.usd) : 34.5;

        const promptText = `Sen bir toptancı satış fişi ve parça listesi ayrıştırma uzmanısın.
Kullanıcı bir toptancıdan kopyaladığı fatura veya parça listesi metnini paylaştı. Bu metindeki tüm ürün satırlarını eksiksiz çıkar ve JSON formatında döndür.

KURALLAR:
1. Ürün Adı (name): Sadece ürünün gerçek adını ve modelini al (Örn: "LUCATECH LT-601 ENC TWS AİRPODS KULAKLIK", "BAYROX AIR PRO 2 ANC ENC EARPHONE").
   - Kesinlikle sıra numarası ("1", "2"), iskonto/yüzde ("%0,00", "%0"), veya "ad" gibi ibareleri ürün adına dahil etme.
2. Adet (quantity): Ürün adedini sayı olarak çıkar (Örn: "2 ad" -> 2). Belirtilmemişse 1 al.
3. Alış Fiyatı (buyPrice): Ürünün 1 adet BİRİM alış fiyatı ($ veya ₺). Toplam tutarı değil, birim fiyatı al!
   - Örneğin "2 ad $ 10,75 ... $ 21,50" satırında birim fiyat 10.75'tir.
   - Dolar ise "currency": "USD", TL ise "currency": "TRY" olarak belirt.
4. Kategori (category): En uygun kategoriyi seç ("Kulaklık", "Şarj Başlığı", "Set Şarj", "Type-C Kablo", "Lightning Kablo", "Kablo", "Kılıf", "Ekran Koruyucu", "Powerbank", "LCD / Ekran", "LCD / Ekran (Çıtalı)", "Kapak", "Batarya", "Şarj Soketi", "Kamera", "Kasa", "Flex / Entegre", "Hoparlör / Ahize", "Yedek Parça", "Aksesuar").
5. Marka (brand): Varsa marka adını çıkar.
6. Renk (color): Varsa renk adını çıkar.
7. Tedarikçi Adı (supplierName): Metinde geçen toptancı/firma adı varsa belirt (Örn: "BAYROX", "BAYRAK ELEKTRONİK").

METİN:
${text}

YANIT FORMATI (Yalnızca geçerli JSON):
{
  "supplierName": "string veya null",
  "items": [
    {
      "name": "string",
      "quantity": 1,
      "buyPrice": 0.0,
      "currency": "USD veya TRY",
      "category": "string",
      "brand": "string veya null",
      "color": "string veya null"
    }
  ]
}`;

        const geminiRes = await callGemini(
            shopId,
            [promptText],
            "json"
        );

        if ("error" in geminiRes) {
            return {
                success: false,
                error: geminiRes.error || "Yapay zeka metni çözümleyemedi."
            };
        }

        let parsedJson: any;
        try {
            const rawJson = geminiRes.text.replace(/```json/gi, "").replace(/```/g, "").trim();
            parsedJson = JSON.parse(rawJson);
        } catch (parseErr) {
            console.error("JSON parse error:", parseErr, geminiRes.text);
            return { success: false, error: "Yapay zeka yanıtı geçerli JSON formatında ayrıştırılamadı." };
        }

        const rawItems = Array.isArray(parsedJson) ? parsedJson : (parsedJson.items || []);
        if (!rawItems || rawItems.length === 0) {
            return { success: false, error: "Metinde ürün veya fiyat satırı tespit edilemedi." };
        }

        let detectedSupplierName: string | null = parsedJson.supplierName || null;
        let matchedSupplierId: string | null = null;

        if (detectedSupplierName) {
            const suppliers = await prisma.supplier.findMany({
                where: { shopId },
                select: { id: true, name: true }
            });
            const sNameLower = detectedSupplierName.toLowerCase();
            const matched = suppliers.find(s =>
                s.name.toLowerCase().includes(sNameLower) || sNameLower.includes(s.name.toLowerCase())
            );
            if (matched) {
                matchedSupplierId = matched.id;
            }
        }

        const items: ParsedWholesalerItem[] = rawItems.map((it: any, index: number) => {
            const cleanName = (it.name || "Bilinmeyen Ürün").trim();
            const category = it.category && it.category !== "Genel"
                ? it.category
                : smartDetectCategory(cleanName);
            const qty = Math.max(1, parseInt(it.quantity, 10) || 1);

            let buyPriceUsd = 0;
            const rawPrice = Number(it.buyPrice || 0);
            if (it.currency === "TRY") {
                buyPriceUsd = Number((rawPrice / usdRate).toFixed(2));
            } else {
                buyPriceUsd = Number(rawPrice.toFixed(2));
            }

            const sellPriceUsd = Number((buyPriceUsd + defaultMarkup).toFixed(2));
            const sku = generateProductSku(cleanName, category, it.brand);
            const color = it.color || detectColorInName(cleanName);

            return {
                id: `ai-txt-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                sku,
                name: cleanName,
                category,
                brand: it.brand || undefined,
                quantity: qty,
                buyPriceUsd,
                sellPriceUsd,
                color,
                selected: true,
            };
        });

        const totalBuyUsd = Number(items.reduce((acc, it) => acc + (it.buyPriceUsd * it.quantity), 0).toFixed(2));
        const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);

        return {
            success: true,
            items,
            supplierName: detectedSupplierName,
            matchedSupplierId,
            totalBuyUsd,
            totalQuantity,
        };
    } catch (err: any) {
        console.error("parseWholesalerRawTextWithAIAction error:", err);
        return { success: false, error: err?.message || "Metin işlenirken bir hata oluştu." };
    }
}

/**
 * Geri alınabilir son toptancı içe aktarma / stok kaydını sorgular.
 */
export async function getLastWholesalerBatchAction(): Promise<{
    hasBatch: boolean;
    batch?: {
        batchId: string;
        createdAt: string;
        supplierName?: string | null;
        purchaseOrderNo?: string | null;
        totalQuantity: number;
        totalAmountTry: number;
        totalAmountUsd: number;
        paidAmountTry: number;
        remainingAmountTry: number;
        addToStock: boolean;
        undone?: boolean;
    } | null;
}> {
    try {
        const shopId = await getShopId();
        if (!shopId) return { hasBatch: false };

        const setting = await prisma.setting.findUnique({
            where: { shopId_key: { shopId, key: "LAST_WHOLESALER_IMPORT_BATCH" } }
        });

        if (!setting || !setting.value) return { hasBatch: false };

        const batch: WholesalerBatchRecord = JSON.parse(setting.value);
        if (batch.undone) return { hasBatch: false };

        return {
            hasBatch: true,
            batch: {
                batchId: batch.batchId,
                createdAt: batch.createdAt,
                supplierName: batch.supplierName,
                purchaseOrderNo: batch.purchaseOrderNo,
                totalQuantity: batch.totalQuantity,
                totalAmountTry: batch.totalAmountTry,
                totalAmountUsd: batch.totalAmountUsd,
                paidAmountTry: batch.paidAmountTry,
                remainingAmountTry: batch.remainingAmountTry,
                addToStock: batch.addToStock,
                undone: batch.undone,
            }
        };
    } catch (e) {
        return { hasBatch: false };
    }
}

/**
 * Son yapılan toptancı parça/stok ve fiş girişini tamamen geri alır (Rollback).
 * - Eklenen ürünlerin stoğu düşürülür (yeni açılan ve satılmayan ürünler silinir).
 * - Stok hareketleri (InventoryLog) silinir.
 * - Tedarikçi siparişi (PurchaseOrder) ve kalemleri silinir.
 * - Tedarikçi borcu ve cari alışveriş bakiyesi düşürülür.
 * - Yapılan nakit/kasa ödemesi kasaya iade edilir ve harcama kaydı silinir.
 */
export async function rollbackLastWholesalerBatchAction(): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    rolledBackBatch?: {
        supplierName?: string | null;
        totalQuantity: number;
        totalAmountTry: number;
        paidAmountTry: number;
        addToStock: boolean;
    };
}> {
    try {
        const shopId = await getShopId();
        if (!shopId) {
            return { success: false, error: "Dükkan oturumu bulunamadı." };
        }

        const setting = await prisma.setting.findUnique({
            where: { shopId_key: { shopId, key: "LAST_WHOLESALER_IMPORT_BATCH" } }
        });

        if (!setting || !setting.value) {
            return { success: false, error: "Geri alınacak son stok veya fiş girişi bulunamadı." };
        }

        let batch: WholesalerBatchRecord;
        try {
            batch = JSON.parse(setting.value);
        } catch {
            return { success: false, error: "Kayıt bilgisi okunamadı." };
        }

        if (batch.undone) {
            return { success: false, error: "Bu son işlem zaten daha önce geri alınmış." };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Stok Geri Alma (Eğer ürünler stoğa eklenmişse)
            if (batch.addToStock && Array.isArray(batch.affectedProducts)) {
                for (const item of batch.affectedProducts) {
                    if (!item.productId) continue;
                    const p = await tx.product.findUnique({
                        where: { id: item.productId, shopId },
                        select: { id: true, stock: true }
                    });

                    if (p) {
                        if (item.wasCreated) {
                            // Yeni oluşturulmuş ürün: Eğer başka satış görmediyse sil, gördüyse stoğu sıfırla
                            if (p.stock <= item.quantity) {
                                try {
                                    await tx.product.delete({ where: { id: p.id } });
                                } catch {
                                    await tx.product.update({
                                        where: { id: p.id },
                                        data: { stock: 0 }
                                    });
                                }
                            } else {
                                await tx.product.update({
                                    where: { id: p.id },
                                    data: { stock: { decrement: item.quantity } }
                                });
                            }
                        } else {
                            // Önceden var olan ürün: stoğunu aktarılan miktar kadar azalt
                            const newStock = Math.max(0, p.stock - item.quantity);
                            await tx.product.update({
                                where: { id: p.id },
                                data: { stock: newStock }
                            });
                        }
                    }
                }

                // İlgili envanter loglarını temizle
                if (Array.isArray(batch.inventoryLogIds) && batch.inventoryLogIds.length > 0) {
                    await tx.inventoryLog.deleteMany({
                        where: { id: { in: batch.inventoryLogIds }, shopId }
                    });
                }
            }

            // 2. Tedarikçi Siparişini (PurchaseOrder) Silme
            if (batch.purchaseOrderId) {
                await tx.purchaseOrderItem.deleteMany({
                    where: { orderId: batch.purchaseOrderId }
                });
                await tx.purchaseOrder.delete({
                    where: { id: batch.purchaseOrderId }
                }).catch(() => null);
            }

            // 3. Tedarikçi Bakiye ve Cari Hareketlerini Geri Alma
            if (batch.supplierId) {
                const supplier = await tx.supplier.findUnique({
                    where: { id: batch.supplierId, shopId }
                });

                if (supplier) {
                    const newTotalShopping = Math.max(0, Number(supplier.totalShopping || 0) - Number(batch.totalAmountTry || 0));
                    const newBalance = Math.max(0, Number(supplier.balance || 0) - Number(batch.remainingAmountTry || 0));
                    const newBalanceUsd = Math.max(0, Number(supplier.balanceUsd || 0) - Number(batch.remainingAmountUsd || 0));

                    await tx.supplier.update({
                        where: { id: batch.supplierId },
                        data: {
                            totalShopping: newTotalShopping,
                            balance: newBalance,
                            balanceUsd: newBalanceUsd,
                        }
                    });
                }

                if (Array.isArray(batch.supplierTransactionIds) && batch.supplierTransactionIds.length > 0) {
                    await tx.supplierTransaction.deleteMany({
                        where: { id: { in: batch.supplierTransactionIds }, shopId }
                    });
                }
            }

            // 4. Kasa Ödemesini İade Etme
            if (batch.paidAmountTry > 0 && batch.accountId) {
                await tx.financeAccount.update({
                    where: { id: batch.accountId },
                    data: { balance: { increment: batch.paidAmountTry } }
                });

                if (batch.financeTransactionId) {
                    await tx.transaction.delete({
                        where: { id: batch.financeTransactionId }
                    }).catch(() => null);
                }
            }

            // 5. Kaydı "Geri Alındı" (undone) olarak güncelle
            batch.undone = true;
            batch.undoneAt = new Date().toISOString();
            await tx.setting.update({
                where: { shopId_key: { shopId, key: "LAST_WHOLESALER_IMPORT_BATCH" } },
                data: { value: JSON.stringify(batch) }
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        revalidatePath("/stok");
        revalidatePath("/tedarikciler");
        revalidatePath("/finans");
        revalidatePath("/stok/siparisler");
        revalidateSmartReplenishment(shopId);

        const stockText = batch.addToStock ? `${batch.totalQuantity} adet ürün stoğu, ` : "";
        const supplierText = batch.supplierName ? `${batch.supplierName} tedarikçi siparişi (₺${batch.totalAmountTry.toLocaleString("tr-TR")}), ` : "";
        const cashText = batch.paidAmountTry > 0 ? `₺${batch.paidAmountTry.toLocaleString("tr-TR")} kasa iadesi ` : "";

        return {
            success: true,
            message: `Son işlem geri alındı: ${stockText}${supplierText}${cashText}başarıyla geri alındı.`,
            rolledBackBatch: {
                supplierName: batch.supplierName,
                totalQuantity: batch.totalQuantity,
                totalAmountTry: batch.totalAmountTry,
                paidAmountTry: batch.paidAmountTry,
                addToStock: batch.addToStock,
            }
        };
    } catch (err: any) {
        console.error("rollbackLastWholesalerBatchAction error:", err);
        return { success: false, error: err?.message || "Geri alma sırasında bir hata oluştu." };
    }
}
