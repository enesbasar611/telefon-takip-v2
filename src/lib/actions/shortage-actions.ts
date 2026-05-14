"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { getShopId, getUserId, auth } from "@/lib/auth";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { generateProductBarcode } from "@/lib/barcode-utils";
import { formatTitleCase } from "@/lib/formatters";

type ShortagePriority = {
  courierPriorityScore: number;
  courierPriorityLabel: "ACIL" | "YUKSEK" | "NORMAL";
  courierPriorityReasons: string[];
};

const NOT_FOUND_MARKER = "[BULUNMADI]";

type StockApprovalCurrency = "TRY" | "TL" | "USD" | "EUR";

type ShortageStockPayload = {
  productName?: string;
  categoryId?: string | null;
  buyPrice?: number;
  sellPrice?: number;
  priceCurrency?: StockApprovalCurrency;
};

function normalizeStockCurrency(currency?: StockApprovalCurrency): "TRY" | "USD" | "EUR" {
  if (currency === "USD" || currency === "EUR") return currency;
  return "TRY";
}

function getLocalDayRange(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;

  return {
    startOfDay: new Date(year, month - 1, day, 0, 0, 0, 0),
    endOfDay: new Date(year, month - 1, day, 23, 59, 59, 999)
  };
}

function isMarkedNotFound(item: any) {
  return String(item.notes || "").includes(NOT_FOUND_MARKER);
}

function getShortagePriority(item: any): ShortagePriority {
  const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
  const ageHours = Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60)));
  const productStock = typeof item.product?.stock === "number" ? item.product.stock : null;
  const criticalStock = typeof item.product?.criticalStock === "number" ? item.product.criticalStock : null;

  let score = 0;
  const reasons: string[] = [];
  const manualPriority = String(item.notes || "").match(/\[ONCELIK:(ACIL|YUKSEK|NORMAL)\]/i)?.[1]?.toUpperCase();

  if (isMarkedNotFound(item)) {
    score += 70;
    reasons.push("Bulunmadi");
  }

  if (manualPriority === "ACIL") {
    score += 80;
    reasons.push("Manuel acil");
  } else if (manualPriority === "YUKSEK") {
    score += 50;
    reasons.push("Manuel yuksek");
  } else if (manualPriority === "NORMAL") {
    score += 5;
    reasons.push("Manuel normal");
  }

  if (!item.isTaken) {
    score += 18;
    reasons.push("Alinmadi");
  }

  if (ageHours >= 24) {
    score += 22;
    reasons.push("24 saati asti");
  } else if (ageHours >= 8) {
    score += 12;
    reasons.push("Bekliyor");
  }

  if (item.customerId || item.requesterName) {
    score += 14;
    reasons.push("Musteri talebi");
  }

  if (productStock !== null && criticalStock !== null) {
    if (productStock <= 0) {
      score += 28;
      reasons.push("Stok sifir");
    } else if (productStock <= criticalStock) {
      score += 18;
      reasons.push("Kritik stok");
    }
  } else if (item.isAlert) {
    score += 16;
    reasons.push("Stok uyarisi");
  }

  if ((item.quantity || 0) > 1) {
    score += Math.min(10, item.quantity * 2);
    reasons.push("Coklu adet");
  }

  const label = manualPriority === "ACIL" || manualPriority === "YUKSEK" || manualPriority === "NORMAL"
    ? manualPriority as "ACIL" | "YUKSEK" | "NORMAL"
    : score >= 55 ? "ACIL" : score >= 32 ? "YUKSEK" : "NORMAL";

  return {
    courierPriorityScore: score,
    courierPriorityLabel: label,
    courierPriorityReasons: reasons.slice(0, 3)
  };
}

function withCourierPriority<T extends Record<string, any>>(items: T[]) {
  return items
    .map((item) => ({ ...item, isNotFound: isMarkedNotFound(item), ...getShortagePriority(item) }))
    .sort((a, b) => {
      if (b.courierPriorityScore !== a.courierPriorityScore) {
        return b.courierPriorityScore - a.courierPriorityScore;
      }
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
}

export async function getShortageItems() {
  const shopId = await getShopId(false);
  if (!shopId) return [];

  const items = await prisma.shortageItem.findMany({
    where: { shopId, isResolved: false, isTaken: false },
    include: {
      product: true,
      assignedTo: true,
      customer: true,
      shop: true
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(withCourierPriority(items));
}

export async function getGlobalShortageList(dateStr?: string) {
  try {
  const session = await auth();
  const shopId = await getShopId(false);
  if (!shopId) return [];

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session?.user?.role || "");

  let dateFilter = {};
  if (dateStr) {
    const range = getLocalDayRange(dateStr);
    if (range) {
      dateFilter = { createdAt: { gte: range.startOfDay, lte: range.endOfDay } };
    }
  }

  // Only SUPER_ADMIN without shopId sees everything across DB (though getShopId usually throws or returns a dummy for them)
  // For safety, ALWAYS bind to shopId.
  const baseWhere = { shopId, assignedToId: null, isResolved: false, ...dateFilter };

  // 1. Get manual shortage entries
  const manualItems = await prisma.shortageItem.findMany({
    where: baseWhere,
    include: {
      product: true,
      customer: true,
      shop: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // 2. Get low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: { shopId, stock: { lte: prisma.product.fields.criticalStock } },
    include: {
      shortageItems: {
        where: { isResolved: false }
      },
      shop: { select: { name: true } }
    }
  });

  // Filter out products that already have a manual shortage entry
  const missingProductAlerts = lowStockProducts
    .filter((p: any) => p.shortageItems.length === 0)
    .map((p: any) => ({
      id: `alert-${p.id}`,
      name: p.name,
      quantity: 1, // Default to 1 for alerts
      notes: p.shop?.name ? `${p.shop.name.toUpperCase()} - STOK AZALDI/BİTTİ` : "STOK AZALDI/BİTTİ",
      productId: p.id,
      shopId: p.shopId,
      shopName: p.shop?.name,
      isAlert: true,
      product: p
    }));

  return serializePrisma(withCourierPriority([...manualItems, ...missingProductAlerts]));
  } catch (error) {
    console.error("getGlobalShortageList error:", error);
    return [];
  }
}

export async function getCouriers() {
  const shopId = await getShopId(false);
  if (!shopId) return [];
  const couriers = await prisma.user.findMany({
    where: { shopId, role: "COURIER", isApproved: true },
    select: { id: true, name: true, surname: true, role: true }
  });
  return serializePrisma(couriers);
}

export async function assignShortageToCourier(id: string, courierId: string | null, customQuantity?: number) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    // If it's an alert-id, we need to CREATE a real ShortageItem first
    let targetId = id;
    if (id.startsWith("alert-")) {
      const productId = id.replace("alert-", "");
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Ürün bulunamadı.");

      const newItem = await prisma.shortageItem.create({
        data: {
          name: product.name,
          productId: product.id,
          quantity: customQuantity || 1,
          shopId: product.shopId,
          assignedToId: courierId,
          requesterName: "Dükkan",
          notes: "STOK ANALİZİNDEN OTOMATİKE EKLENDİ"
        }
      });
      targetId = newItem.id;
    } else {
      await prisma.shortageItem.update({
        where: { id },
        data: {
          assignedToId: courierId,
          isTaken: false,
          takenAt: null,
          quantity: customQuantity || undefined
        }
      });
    }

    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    console.error("Assignment error:", error);
    return { success: false, error: "Atama başarısız." };
  }
}

export async function markShortageAsTaken(id: string, isTaken: boolean) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    await prisma.shortageItem.update({
      where: { id, shopId },
      data: {
        isTaken,
        takenAt: isTaken ? new Date() : null
      }
    });
    revalidatePath("/");
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    return { success: false, error: "İşlem başarısız." };
  }
}

export async function markShortageAsNotFound(id: string, isNotFound: boolean) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    const item = await prisma.shortageItem.findUnique({
      where: { id, shopId },
      select: { notes: true }
    });
    if (!item) return { success: false, error: "Kayıt bulunamadı." };

    const cleanNotes = String(item.notes || "")
      .replace(NOT_FOUND_MARKER, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    const nextNotes = isNotFound ? `${NOT_FOUND_MARKER}${cleanNotes ? ` ${cleanNotes}` : ""}` : cleanNotes;

    await prisma.shortageItem.update({
      where: { id, shopId },
      data: {
        notes: nextNotes || null,
        isTaken: false,
        takenAt: null,
      }
    });
    revalidatePath("/");
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Bulunmadı durumu güncellenemedi." };
  }
}

export async function getCourierTasks(dateStr?: string) {
  try {
    const session = await auth();
    const shopId = await getShopId();
    if (!shopId) return { success: true, items: [] };
    const userId = await getUserId();
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session?.user?.role || "");

    // Logic:
    // ADMIN/SUPER_ADMIN: Global visibility of all assigned tasks.
    // COURIER/Others: Visibility of tasks assigned to THEM WITHIN their shop.
    let dateFilter = {};
    if (dateStr) {
      const range = getLocalDayRange(dateStr);
      if (range) {
        dateFilter = { createdAt: { gte: range.startOfDay, lte: range.endOfDay } };
      }
    }

    const whereClause: any = isAdmin
      ? { shopId, assignedToId: { not: null }, isResolved: false, ...dateFilter }
      : { shopId, assignedToId: userId, isResolved: false, ...dateFilter };

    const items = await prisma.shortageItem.findMany({
      where: whereClause,
      include: {
        product: true,
        customer: true,
        assignedTo: { select: { name: true, surname: true } },
        shop: { select: { name: true, phone: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, items: serializePrisma(withCourierPriority(items)) };
  } catch (error) {
    console.error("getCourierTasks error:", error);
    return { success: false, items: [] };
  }
}

export async function addShortageItems(items: Array<{
  productId?: string;
  name: string;
  quantity: number;
  notes?: string;
  requesterName?: string;
  requesterPhone?: string;
  customerId?: string;
  assignedToId?: string;
}>) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    // We'll use a transaction to ensure all or nothing, or just loop if we want to handle each separately.
    // Given the logic in addShortageItem (updating existing), we should probably reuse that logic.

    const results = [];
    let duplicateCount = 0;
    for (const data of items) {
      // Check if an unresolved item with same productId or name AND same requester already exists
      const existing = await prisma.shortageItem.findFirst({
        where: {
          shopId,
          isResolved: false,
          name: { equals: data.name, mode: 'insensitive' as const },
          productId: data.productId || undefined,
          customerId: data.customerId || null,
          requesterName: data.requesterName || null,
          requesterPhone: data.requesterPhone || null,
        }
      });

      if (existing) {
        duplicateCount += 1;
        await prisma.shortageItem.update({
          where: { id: existing.id },
          data: {
            quantity: { increment: data.quantity },
            assignedToId: data.assignedToId || existing.assignedToId
          }
        });
      } else {
        await prisma.shortageItem.create({
          data: {
            productId: data.productId,
            name: data.name,
            quantity: data.quantity,
            notes: data.notes,
            requesterName: data.requesterName,
            requesterPhone: data.requesterPhone,
            customerId: data.customerId,
            assignedToId: data.assignedToId,
            shopId
          }
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/kurye");
    revalidatePath("/stok");
    revalidatePath("/stok/hareketler");

    const isDuplicate = duplicateCount > 0;
    return {
      success: true,
      isDuplicate,
      message: isDuplicate
        ? duplicateCount === items.length
          ? "Urun zaten eksikler listesinde; miktari guncellendi."
          : `${duplicateCount} urun zaten eksikler listesinde; miktari guncellendi.`
        : undefined
    };
  } catch (error) {
    console.error("Add bulk shortage items error:", error);
    return { success: false, error: "Toplu ekleme başarısız oldu." };
  }
}

export async function addShortageItem(data: {
  productId?: string;
  name: string;
  quantity: number;
  notes?: string;
  requesterName?: string;
  requesterPhone?: string;
  customerId?: string;
  assignedToId?: string;
}) {
  return addShortageItems([data]);
}

export async function updateShortageQuantity(id: string, quantity: number) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };
    await prisma.shortageItem.update({
      where: { id, shopId },
      data: { quantity }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Güncelleme başarısız." };
  }
}

export async function approveShortageItem(
  id: string,
  quantity: number,
  mode: "STOCK" | "SALE" | "DEBT" = "STOCK",
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "DEBT" = "CASH",
  customPrice?: number,
  currency: "TL" | "USD" | "EUR" = "TL",
  stockPayload?: ShortageStockPayload
) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };
    const userId = await getUserId();
    const shortageItem = await prisma.shortageItem.findUnique({
      where: { id, shopId },
      include: { product: true }
    });

    if (!shortageItem) throw new Error("Kayıt bulunamadı.");

    // Dükkan içinse direkt STOCK moduna zorla (bayi/müşteri atanmamışsa veya dükkan siparişi ise)
    const isShopInventory = !shortageItem.customerId && !shortageItem.requesterName;
    const finalMode = isShopInventory ? "STOCK" : mode;
    const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    const rates = await getExchangeRates(shopId);
    const stockCurrency = normalizeStockCurrency(stockPayload?.priceCurrency);
    const getCurrencyRate = (selectedCurrency: "TRY" | "USD" | "EUR") => {
      if (selectedCurrency === "USD") return rates.usd || 34;
      if (selectedCurrency === "EUR") return rates.eur || 37;
      return 1;
    };
    const toTryPrice = (value?: number) => {
      const safeValue = Number(value) || 0;
      return stockCurrency === "TRY" ? safeValue : Math.ceil(safeValue * getCurrencyRate(stockCurrency));
    };

    await prisma.$transaction(async (tx) => {
      if (!shortageItem) throw new Error("Kayit bulunamadi.");
      // 1. Kuryeye Puan Yaz (Siparişi bugün teslim aldığı/onaylandığı için)
      if (shortageItem.assignedToId) {
        /* Points feature is disabled as column does not exist in DB
        await tx.user.update({
          where: { id: shortageItem.assignedToId },
          data: {
            points: { increment: 1 }
          }
        });
        */
      }

      // 2. Stok kaydi modal verisine gore yapilir.
      const requestedProductName = (stockPayload?.productName || shortageItem.name || "").trim();
      let activeProduct: any = shortageItem.product;
      let activeProductId: string | null = shortageItem.productId;

      if (!activeProductId && requestedProductName) {
        activeProduct = await tx.product.findFirst({
          where: { shopId, name: { equals: requestedProductName, mode: "insensitive" } }
        });
        activeProductId = activeProduct?.id || null;
      }

      const hasStockForm = Boolean(stockPayload);
      const buyPriceTry = hasStockForm && stockPayload?.buyPrice !== undefined
        ? toTryPrice(stockPayload.buyPrice)
        : undefined;
      const sellPriceTry = hasStockForm && stockPayload?.sellPrice !== undefined
        ? toTryPrice(stockPayload.sellPrice)
        : undefined;
      const stockAttributes = hasStockForm
        ? {
          ...((activeProduct?.attributes && typeof activeProduct.attributes === "object") ? activeProduct.attributes : {}),
          priceCurrency: stockCurrency
        }
        : undefined;

      if (activeProductId) {
        activeProduct = await tx.product.update({
          where: { id: activeProductId, shopId },
          data: {
            name: requestedProductName ? formatTitleCase(requestedProductName) : undefined,
            categoryId: stockPayload?.categoryId || undefined,
            buyPrice: buyPriceTry !== undefined ? buyPriceTry : undefined,
            buyPriceUsd: hasStockForm ? (stockCurrency === "TRY" ? null : Number(stockPayload?.buyPrice || 0)) : undefined,
            sellPrice: sellPriceTry !== undefined ? sellPriceTry : undefined,
            sellPriceUsd: hasStockForm ? (stockCurrency === "TRY" ? null : Number(stockPayload?.sellPrice || 0)) : undefined,
            attributes: stockAttributes as any,
            stock: { increment: safeQuantity },
            movements: {
              create: {
                quantity: safeQuantity,
                type: "PURCHASE",
                notes: `${shortageItem.name} (Kurye Teslimati)`,
                shopId
              }
            }
          }
        });
      } else {
        if (!stockPayload?.categoryId) {
          throw new Error("Stokta olmayan urun icin kategori secmelisiniz.");
        }
        if (buyPriceTry === undefined || sellPriceTry === undefined) {
          throw new Error("Stokta olmayan urun icin alis ve satis fiyati girmelisiniz.");
        }

        activeProduct = await tx.product.create({
          data: {
            name: formatTitleCase(requestedProductName || shortageItem.name),
            categoryId: stockPayload.categoryId,
            buyPrice: buyPriceTry,
            buyPriceUsd: stockCurrency === "TRY" ? null : Number(stockPayload.buyPrice || 0),
            sellPrice: sellPriceTry,
            sellPriceUsd: stockCurrency === "TRY" ? null : Number(stockPayload.sellPrice || 0),
            stock: safeQuantity,
            criticalStock: 5,
            shopId,
            attributes: { priceCurrency: stockCurrency } as any,
            movements: {
              create: {
                quantity: safeQuantity,
                type: "PURCHASE",
                notes: `${shortageItem.name} (Kurye Teslimati)`,
                shopId
              }
            },
            inventoryLogs: {
              create: {
                userId,
                quantity: safeQuantity,
                type: "PURCHASE",
                notes: `${shortageItem.name} (Kurye Teslimati)`,
                shopId
              }
            }
          }
        });

        activeProduct = await tx.product.update({
          where: { id: activeProduct.id, shopId },
          data: {
            barcode: generateProductBarcode({
              shopId,
              productId: activeProduct.id,
              productName: activeProduct.name,
              createdAtMs: activeProduct.createdAt.getTime(),
            })
          }
        });
        activeProductId = activeProduct.id;
      }

      if ((finalMode === "SALE" || finalMode === "DEBT") && shortageItem.customerId && activeProductId) {
        const product = activeProduct!;

        // Fiyat hesaplama (USD/TL dönüşümü)
        let unitPriceTL = customPrice || Number(product.sellPrice);
        if (currency === "USD") {
          unitPriceTL = Math.ceil(unitPriceTL * rates.usd);
        } else if (currency === "EUR") {
          unitPriceTL = Math.ceil(unitPriceTL * rates.eur);
        }

        const totalAmount = unitPriceTL * safeQuantity;
        const saleCount = await tx.sale.count({ where: { shopId } });
        const saleNumber = `SALE-KURYE-${1000 + saleCount + 1}`;

        // Satış kaydı oluştur
        const sale = await tx.sale.create({
          data: {
            saleNumber,
            customerId: shortageItem.customerId,
            userId,
            shopId,
            totalAmount,
            finalAmount: totalAmount,
            paymentMethod: finalMode === "DEBT" ? "DEBT" : paymentMethod,
            items: {
              create: {
                productId: activeProductId,
                quantity: safeQuantity,
                unitPrice: unitPriceTL,
                totalPrice: totalAmount,
                shopId
              }
            }
          }
        });

        // Satış yapıldığı için stoğu tekrar düş (Giriş yapıldı, hemen bayi için çıkış yapılıyor)
        await tx.product.update({
          where: { id: activeProductId, shopId },
          data: { stock: { decrement: safeQuantity } }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: activeProductId,
            quantity: -safeQuantity,
            type: "SALE",
            notes: `Kurye teslimatından otomatik satış: ${saleNumber}`,
            shopId,
            saleId: sale.id
          }
        });

        // FİNANSAL HESAP YÖNETİMİ
        let targetAccountId: string | null = null;
        if (finalMode === "SALE") {
          const type = paymentMethod === "CASH" ? "CASH" : paymentMethod === "CARD" ? "POS" : "BANK";
          const account = await tx.financeAccount.findFirst({
            where: { type, shopId, isActive: true },
            orderBy: { isDefault: "desc" }
          });

          if (account) {
            targetAccountId = account.id;
            const oldBalance = Number(account.balance);
            const newBalance = oldBalance + totalAmount;

            await tx.financeAccount.update({
              where: { id: account.id },
              data: {
                balance: newBalance,
                availableBalance: account.type === "CREDIT_CARD" ? account.availableBalance : newBalance
              }
            });

            await tx.transaction.create({
              data: {
                amount: totalAmount,
                type: "INCOME",
                description: `${shortageItem.name} - ${saleNumber} (Kurye Teslimatı)`,
                paymentMethod,
                userId,
                shopId,
                saleId: sale.id,
                customerId: shortageItem.customerId,
                financeAccountId: targetAccountId,
                runningBalance: newBalance,
                category: "SATIŞ"
              }
            });
          }
        } else if (finalMode === "DEBT") {
          await tx.transaction.create({
            data: {
              amount: totalAmount,
              type: "INCOME",
              description: `${shortageItem.name} - ${saleNumber} (Veresiye - Kurye)`,
              paymentMethod: "DEBT",
              userId,
              shopId,
              saleId: sale.id,
              customerId: shortageItem.customerId,
              category: "VERESİYE"
            }
          });

          await tx.debt.create({
            data: {
              customerId: shortageItem.customerId,
              amount: totalAmount,
              remainingAmount: totalAmount,
              shopId,
              notes: `${shortageItem.name} (Kurye Teslimatı)`,
              saleId: sale.id,
              isPaid: false
            }
          });
        }
      }

      // 4. EKSİK KAYDINI KAPAT
      await tx.shortageItem.update({
        where: { id, shopId },
        data: { isResolved: true, productId: activeProductId || undefined }
      });
    });

    revalidatePath("/");
    revalidatePath("/stok");
    revalidatePath("/kurye");
    revalidatePath("/satis/kasa");
    revalidateTag(`staff-${shopId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Shortage approval error:", error);
    return { success: false, error: error.message || "İşlem başarısız." };
  }
}

export async function deleteShortageItem(id: string, force = false) {
  try {
    const session = await auth();
    if (!["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session?.user?.role || "")) {
      return { success: false, error: "Bu işlem için yetkiniz yok." };
    }
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };
    const item = await prisma.shortageItem.findUnique({
      where: { id, shopId },
      select: { id: true, name: true, isTaken: true, isResolved: true }
    });
    if (!item) return { success: false, error: "Kayıt bulunamadı." };
    if (item.isTaken && !item.isResolved && !force) {
      return {
        success: false,
        needsStockApproval: true,
        error: `${item.name} alındı olarak işaretlenmiş ama stok kaydı yapılmamış.`
      };
    }
    await prisma.shortageItem.delete({
      where: { id, shopId }
    });
    revalidatePath("/");
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    console.error("Shortage deletion error:", error);
    return { success: false, error: "Silme işlemi başarısız." };
  }
}

export async function deleteShortageItems(ids: string[], force = false) {
  try {
    if (!ids || ids.length === 0) return { success: true };
    const session = await auth();
    if (!["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session?.user?.role || "")) {
      return { success: false, error: "Bu işlem için yetkiniz yok." };
    }
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    if (!force) {
      const takenWithoutStock = await prisma.shortageItem.findMany({
        where: {
          id: { in: ids },
          shopId,
          isTaken: true,
          isResolved: false
        },
        select: { id: true, name: true }
      });

      if (takenWithoutStock.length > 0) {
        return {
          success: false,
          needsStockApproval: true,
          error: `${takenWithoutStock.length} alınan ürünün stok kaydı yapılmamış.`
        };
      }
    }

    await prisma.shortageItem.deleteMany({
      where: {
        id: { in: ids },
        shopId
      }
    });
    revalidatePath("/");
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    console.error("Bulk shortage deletion error:", error);
    return { success: false, error: "Toplu silme işlemi başarısız." };
  }
}

export async function resolveShortageItem(id: string) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false };
    await prisma.shortageItem.update({
      where: { id, shopId },
      data: { isResolved: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

export async function resolveShortageItems(ids: string[]) {
  if (ids.length === 0) return { success: true };
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false };
    await prisma.shortageItem.updateMany({
      where: { id: { in: ids }, shopId },
      data: { isResolved: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Toplu güncelleme başarısız." };
  }
}

export async function finishMyDay() {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };
    const userId = await getUserId();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Kurye bulunamadı" };

    await prisma.notification.create({
      data: {
        shopId,
        type: "COURIER_END_DAY",
        category: "SYSTEM",
        title: "Kurye Günü Bitirdi",
        message: `${user.name} ${user.surname || ''} adlı kurye günlük işlerini bitirdiğini bildirdi.`,
        referenceId: userId // Store courier ID for UI tracking
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Bildirim gönderilemedi." };
  }
}

export async function getCourierNotifications() {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: true, notifications: [] };
    const notifications = await prisma.notification.findMany({
      where: {
        shopId,
        type: "COURIER_END_DAY",
        isRead: false,
        isDeleted: false
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, notifications };
  } catch (error) {
    return { success: false, notifications: [] };
  }
}

export async function finishCourierDay(
  courierId: string,
  options?: {
    transferTargetId?: string | null;
    clearTakenWithoutStock?: boolean;
    targetDate?: string;
  }
) {
  try {
    const session = await auth();
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"];
    if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Yetkiniz yok." };
    }
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0, 0);
    const transferTargetId = options?.transferTargetId === "pool" ? null : options?.transferTargetId ?? null;
    const range = options?.targetDate ? getLocalDayRange(options.targetDate) : getLocalDayRange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    const dateFilter = range ? { createdAt: { gte: range.startOfDay, lte: range.endOfDay } } : {};

    const notTakenItems = await prisma.shortageItem.findMany({
      where: {
        shopId,
        assignedToId: courierId,
        isResolved: false,
        isTaken: false,
        ...dateFilter
      },
      select: { id: true, notes: true }
    });

    const takenWithoutStock = await prisma.shortageItem.findMany({
      where: {
        shopId,
        assignedToId: courierId,
        isResolved: false,
        isTaken: true,
        ...dateFilter
      },
      select: { id: true, name: true, notes: true }
    });

    if (takenWithoutStock.length > 0 && !options?.clearTakenWithoutStock) {
      return {
        success: false,
        needsStockApproval: true,
        takenWithoutStock: serializePrisma(takenWithoutStock),
        notTakenCount: notTakenItems.length,
        error: `${takenWithoutStock.length} alınmış siparişin stok kaydı yapılmamış.`
      };
    }

    if (takenWithoutStock.length > 0 && options?.clearTakenWithoutStock) {
      const clearNote = "GUN SONU STOKSUZ KAPATILDI";
      await prisma.$transaction(
        takenWithoutStock.map((item) => {
          const currentNotes = String(item.notes || "").trim();
          const nextNotes = currentNotes.includes(clearNote)
            ? currentNotes
            : `${clearNote}${currentNotes ? ` - ${currentNotes}` : ""}`;

          return prisma.shortageItem.update({
            where: { id: item.id, shopId },
            data: {
              isResolved: true,
              updatedAt: new Date(),
              notes: nextNotes
            }
          });
        })
      );
    }

    // Alinmayan siparisleri ertesi gun secilen hedefe aktar.
    if (notTakenItems.length > 0) {
      await prisma.$transaction(
        notTakenItems.map((item) => {
          const currentNotes = String(item.notes || "").trim();
          const carryNote = "ERTESI GUNE AKTARILDI";
          const nextNotes = currentNotes.includes(carryNote)
            ? currentNotes
            : `${carryNote}${currentNotes ? ` - ${currentNotes}` : ""}`;

          return prisma.shortageItem.update({
            where: { id: item.id, shopId },
            data: {
              assignedToId: transferTargetId,
              createdAt: tomorrow,
              updatedAt: new Date(),
              notes: nextNotes
            }
          });
        })
      );
    }

    // Mark the "END_DAY" notification from this courier as read/resolved
    await prisma.notification.updateMany({
      where: {
        shopId,
        type: "COURIER_END_DAY",
        referenceId: courierId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Notify the courier that their assigned tasks have been cleared
    await prisma.notification.create({
      data: {
        shopId,
        type: "COURIER_TASKS_CLEARED",
        category: "SYSTEM",
        title: "Kurye İşlemleri Kapatıldı",
        message: `Yönetici tarafından günlük işlemleriniz kapatıldı. Alınmayan ${notTakenItems.length} sipariş ertesi güne aktarıldı; stok kaydı yapılmayan ${takenWithoutStock.length} alınmış sipariş listeden kaldırıldı.`,
        referenceId: courierId
      }
    });

    revalidatePath("/");
    revalidatePath("/kurye");
    return {
      success: true,
      transferredCount: notTakenItems.length,
      clearedTakenWithoutStockCount: takenWithoutStock.length
    };
  } catch (error) {
    console.error("finishCourierDay error:", error);
    return { success: false, error: "İşlem başarısız." };
  }
}

export async function assignShortageBulkToCourier(ids: string[], courierId: string | null) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };
    await prisma.shortageItem.updateMany({
      where: {
        id: { in: ids },
        shopId
      },
      data: {
        assignedToId: courierId === "pool" ? null : courierId
      }
    });
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    console.error("Bulk assignment error:", error);
    return { success: false, error: "Toplu atama hatası" };
  }
}
