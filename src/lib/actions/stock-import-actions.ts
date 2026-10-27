"use server";

import prisma from "@/lib/prisma";
import { getShopId, getUserId } from "@/lib/auth";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { revalidatePath } from "next/cache";
import { revalidateSmartReplenishment } from "@/lib/inventory/replenishment-cache";

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
    paymentStatus: "PAID" | "UNPAID" | "NONE"; // PAID = Peşin/Önceden ödendi (bakiye değişmez), UNPAID = Açık hesap (tedarikçi borcuna eklenir), NONE = Tedarikçi yok
    notes?: string;
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
        const { items, supplierId, paymentStatus, notes } = payload;

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

            // 3. Döngü içerisinde hızlı güncelleme ve oluşturmalar
            for (const item of items) {
                const catKey = (item.category || "Yedek Parça").trim().toLowerCase();
                const categoryId = categoryCache.get(catKey) || categoryCache.get("yedek parça") || Array.from(categoryCache.values())[0];
                const cleanName = item.name.trim();

                const buyPriceTry = Math.round(item.buyPriceUsd * usdRate * 100) / 100;
                const sellPriceTry = Math.round(item.sellPriceUsd * usdRate * 100) / 100;

                const lookupKey = cleanName.toLowerCase();
                const existingProduct = productMap.get(lookupKey);

                if (existingProduct) {
                    // Mevcut ürün: stoğunu artır, fiyatlarını güncelle
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

                    await tx.inventoryLog.create({
                        data: {
                            productId: existingProduct.id,
                            userId: userId || null,
                            quantity: item.quantity,
                            type: "PURCHASE",
                            notes: `Toptancı Stok Girişi (+${item.quantity} Adet - Alış: $${item.buyPriceUsd})`,
                            shopId,
                        }
                    });

                    // Lookup haritasındaki mevcut stoğu da güncelle (aynı parça listede birden fazla kez geçebilir)
                    existingProduct.stock = newStock;
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

                    await tx.inventoryLog.create({
                        data: {
                            productId: newProduct.id,
                            userId: userId || null,
                            quantity: item.quantity,
                            type: "PURCHASE",
                            notes: `Toptancı İlk Stok Girişi (${item.quantity} Adet - Alış: $${item.buyPriceUsd})`,
                            shopId,
                        }
                    });

                    // Haritaya ekle (aynı parti içinde mükerrer isim geçerse stoğunu artırsın)
                    productMap.set(lookupKey, {
                        id: newProduct.id,
                        name: newProduct.name,
                        stock: newProduct.stock,
                        supplierId: newProduct.supplierId,
                    });

                    createdCount++;
                }
            }

            // 4. Tedarikçi Bakiye ve Cari Yönetimi
            let supplierUpdated = false;
            if (supplierId && paymentStatus !== "NONE") {
                const supplier = await tx.supplier.findUnique({
                    where: { id: supplierId, shopId }
                });

                if (supplier) {
                    if (paymentStatus === "UNPAID") {
                        // Açık Hesap (Veresiye): Tedarikçi bakiyesine borç ekle
                        await tx.supplier.update({
                            where: { id: supplierId },
                            data: {
                                balance: { increment: totalTry },
                                balanceUsd: { increment: totalUsd },
                                totalShopping: { increment: totalTry }
                            }
                        });

                        await tx.supplierTransaction.create({
                            data: {
                                supplierId,
                                amount: totalTry,
                                amountUsd: totalUsd,
                                exchangeRate: usdRate,
                                type: "EXPENSE",
                                description: `Toptancı Parça Alımı - Açık Hesap (${totalQty} Parça, $${totalUsd.toFixed(2)}) ${notes ? `[${notes}]` : ""}`,
                                shopId
                            }
                        });
                        supplierUpdated = true;
                    } else if (paymentStatus === "PAID") {
                        // Peşin / Önceden Ödendi: Cari bakiye DEĞİŞMEZ, sadece toplam alışveriş tutarı artar
                        await tx.supplier.update({
                            where: { id: supplierId },
                            data: {
                                totalShopping: { increment: totalTry }
                            }
                        });

                        await tx.supplierTransaction.create({
                            data: {
                                supplierId,
                                amount: totalTry,
                                amountUsd: totalUsd,
                                exchangeRate: usdRate,
                                type: "EXPENSE",
                                description: `Toptancı Parça Alımı - Ödemesi Peşin/Önceden Yapıldı (${totalQty} Parça, $${totalUsd.toFixed(2)})`,
                                shopId
                            }
                        });
                        supplierUpdated = true;
                    }
                }
            }

            return {
                createdCount,
                updatedCount,
                supplierUpdated,
            };
        }, {
            maxWait: 15000, // 15 saniye bağlantı bekleme
            timeout: 60000, // 60 saniye işlem zaman aşımı
        });

        revalidatePath("/stok");
        revalidatePath("/tedarikciler");
        revalidateSmartReplenishment(shopId);

        return {
            success: true,
            createdCount: result.createdCount,
            updatedCount: result.updatedCount,
            totalQuantity: totalQty,
            totalAmountUsd: Number(totalUsd.toFixed(2)),
            totalAmountTry: totalTry,
            supplierUpdated: result.supplierUpdated,
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
