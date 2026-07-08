"use server";
import prisma from "@/lib/prisma";
import { serializePrisma, toTitleCase } from "@/lib/utils";
import { OrderStatus, ServiceStatus } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";
import { getShopId } from "@/lib/auth";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import {
  buildReplenishmentRecommendation,
  buildSalesWindowMap,
  emptyReplenishmentSummary,
  selectSupplier,
  summarizeRecommendations,
  type ReplenishmentRecommendation,
  type ReplenishmentSummary,
} from "@/lib/inventory/replenishment";
import {
  getSmartReplenishmentTag,
  revalidateSmartReplenishment,
} from "@/lib/inventory/replenishment-cache";

export async function getSuppliers() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return [];
    const suppliers = await prisma.supplier.findMany({
      where: { shopId },
      include: {
        purchases: {
          include: { items: { include: { product: true } } }
        },
        inventoryMovements: {
          include: { product: true },
          orderBy: { createdAt: "desc" }
        },
        products: {
          include: { category: true }
        },
        returns: {
          include: { product: true, customer: true, serviceTicket: true },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function createSupplier(data: {
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: string | null;
  bankName?: string | null;
  iban?: string | null;
  notes?: string | null;
  trustScore?: number;
  taxNumber?: string | null;
  taxOffice?: string | null;
}) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        name: toTitleCase(data.name),
        shopId
      }
    });
    revalidatePath("/tedarikciler");
    revalidateSmartReplenishment(shopId);
    return { success: true, supplier: serializePrisma(supplier) };
  } catch (error) {
    return { success: false, error: "Tedarikçi oluşturulamadı." };
  }
}

export async function deleteSupplier(id: string, force: boolean = false) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };
    const supplier = await prisma.supplier.findUnique({
      where: { id, shopId },
      include: {
        purchases: {
          where: {
            shopId,
            status: { in: ["PENDING", "ON_WAY"] }
          },
          include: { items: true }
        }
      }
    });

    if (!supplier) return { success: false, error: "Tedarikçi bulunamadı." };

    // If there's pending orders and not forced, return them to UI to ask user
    if (supplier.purchases.length > 0 && !force) {
      return {
        success: false,
        error: "PENDING_ORDERS",
        pendingOrders: serializePrisma(supplier.purchases)
      };
    }

    // If force is true, we move items to shortage list before deleting
    if (force && supplier.purchases.length > 0) {
      for (const order of supplier.purchases) {
        for (const item of order.items) {
          const missingQty = item.quantity - (item.receivedQuantity || 0);
          if (missingQty > 0) {
            await prisma.shortageItem.create({
              data: {
                productId: item.productId,
                name: item.name,
                quantity: missingQty,
                notes: `Tedarikçi (${supplier.name}) silindi. Bekleyen siparişten aktarıldı.`,
                isResolved: false,
                shopId
              }
            });
          }
        }
      }
    }

    // Use a transaction for deletion to ensure everything is cleaned up
    await prisma.$transaction(async (tx) => {
      // 1. Delete PurchaseOrderItems (manually if needed, but onDelete: Cascade is on schema for some)
      // Actually schema shows PurchaseOrder has items. Let's delete items first if needed or rely on cascade

      // 2. Delete Transactions (onDelete: Cascade is on schema for SupplierTransaction)

      // 3. Nullify supplierId on Products (Product -> Supplier is optional)
      await tx.product.updateMany({
        where: { supplierId: id, shopId },
        data: { supplierId: null }
      });

      // 4. Delete PurchaseOrders
      await tx.purchaseOrder.deleteMany({
        where: { supplierId: id, shopId }
      });

      // 5. Delete Supplier
      await tx.supplier.delete({ where: { id, shopId } });
    });

    revalidatePath("/tedarikciler");
    return { success: true };
  } catch (error) {
    console.error("Delete supplier error:", error);
    return { success: false, error: "Tedarikçi silinemedi. Lütfen sistem yöneticisine danışın." };
  }
}

export async function getPurchaseOrders() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return [];
    const orders = await prisma.purchaseOrder.findMany({
      where: { shopId },
      include: {
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

export async function createPurchaseOrder(data: { supplierId: string; totalAmount: number; status: OrderStatus }) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };
    const generatedOrderNo = `PO-${data.supplierId.slice(-4)}-${Date.now()}`;
    const order = await prisma.purchaseOrder.create({
      data: {
        ...data,
        orderNo: generatedOrderNo,
        shopId
      }
    });
    revalidatePath("/tedarikciler");
    revalidateSmartReplenishment(shopId);
    return { success: true, order: serializePrisma(order) };
  } catch (error) {
    return { success: false, error: "Sipariş oluşturulamadı." };
  }
}

export async function updateSupplier(id: string, data: Partial<{
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: string | null;
  bankName?: string | null;
  iban?: string | null;
  notes?: string | null;
  trustScore?: number;
  taxNumber?: string | null;
  taxOffice?: string | null;
  balance?: number;
}>) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };
    const supplier = await prisma.supplier.update({
      where: { id, shopId },
      data: {
        ...data,
        ...(data.name ? { name: toTitleCase(data.name) } : {})
      }
    });
    revalidatePath("/tedarikciler");
    revalidateSmartReplenishment(shopId);
    return { success: true, supplier: serializePrisma(supplier) };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Tedarikçi güncellenemedi." };
  }
}

export async function getCriticalAndOutOfStockProducts() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return [];
    const products = await prisma.product.findMany({
      where: { shopId },
      include: { category: true },
      orderBy: { stock: 'asc' },
    });
    const critical = products.filter((p: any) => p.stock <= p.criticalStock);
    return serializePrisma(critical);
  } catch (error) {
    console.error("Error fetching critical products:", error);
    return [];
  }
}

export type { ReplenishmentRecommendation } from "@/lib/inventory/replenishment";

export interface SmartReplenishmentResult {
  recommendations: ReplenishmentRecommendation[];
  totalCount: number;
  summary: ReplenishmentSummary;
}

function emptySmartReplenishmentResult(): SmartReplenishmentResult {
  return {
    recommendations: [],
    totalCount: 0,
    summary: emptyReplenishmentSummary(),
  };
}

async function calculateSmartReplenishment(shopId: string): Promise<ReplenishmentRecommendation[]> {
  const startedAt = Date.now();
  const now = new Date();
  const d30ago = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const d60ago = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
  const d90ago = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

  const candidateProducts = await prisma.product.findMany({
    where: { shopId, hideFromShortage: false },
    include: { category: true },
  });
  if (candidateProducts.length === 0) return [];

  const productIds = candidateProducts.map((product) => product.id);
  const [
    sales30,
    sales60,
    sales90,
    serviceDemand,
    shortageDemand,
    assignedShortages,
    activePurchaseOrderItems,
    suppliers,
    rates,
  ] = await Promise.all([
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { shopId, productId: { in: productIds }, sale: { createdAt: { gte: d30ago } } },
      _sum: { quantity: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { shopId, productId: { in: productIds }, sale: { createdAt: { gte: d60ago } } },
      _sum: { quantity: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { shopId, productId: { in: productIds }, sale: { createdAt: { gte: d90ago } } },
      _sum: { quantity: true },
    }),
    prisma.serviceUsedPart.groupBy({
      by: ["productId"],
      where: {
        shopId,
        productId: { in: productIds },
        ticket: { status: { notIn: [ServiceStatus.DELIVERED, ServiceStatus.CANCELLED] } },
      },
      _sum: { quantity: true },
    }),
    prisma.shortageItem.groupBy({
      by: ["productId"],
      where: { shopId, productId: { in: productIds }, isResolved: false, isTaken: false },
      _sum: { quantity: true },
    }),
    prisma.shortageItem.findMany({
      where: {
        shopId,
        productId: { in: productIds },
        isResolved: false,
        isTaken: false,
        assignedToId: { not: null },
      },
      select: { productId: true },
    }),
    prisma.purchaseOrderItem.findMany({
      where: {
        order: { shopId, status: { in: ["PENDING", "ON_WAY"] } },
        productId: { in: productIds },
      },
      select: { productId: true },
    }),
    prisma.supplier.findMany({
      where: { shopId },
      select: { id: true, name: true, trustScore: true, category: true },
    }),
    getExchangeRates(shopId),
  ]);

  const salesByProduct = buildSalesWindowMap(sales30, sales60, sales90);
  const serviceDemandByProduct = new Map(
    serviceDemand.filter((row) => row.productId).map((row) => [row.productId, Number(row._sum.quantity ?? 0)]),
  );
  const shortageDemandByProduct = new Map(
    shortageDemand.filter((row) => row.productId).map((row) => [row.productId as string, Number(row._sum.quantity ?? 0)]),
  );
  const assignedShortageProductIds = new Set(
    assignedShortages.map((item) => item.productId).filter(Boolean) as string[],
  );
  const productsInActiveOrders = new Set(
    activePurchaseOrderItems.map((item) => item.productId).filter(Boolean) as string[],
  );
  const usdRate = Number(rates.usd) > 0 ? Number(rates.usd) : null;
  const recommendations: ReplenishmentRecommendation[] = [];

  for (const product of candidateProducts) {
    if (assignedShortageProductIds.has(product.id) || productsInActiveOrders.has(product.id)) continue;
    const sales = salesByProduct.get(product.id) ?? { d30: 0, d60: 0, d90: 0 };
    const attributes =
      product.attributes && typeof product.attributes === "object" && !Array.isArray(product.attributes)
        ? product.attributes as Record<string, unknown>
        : {};
    const recommendation = buildReplenishmentRecommendation({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      criticalStock: product.criticalStock ?? 1,
      salesLast30: sales.d30,
      salesLast60: sales.d60,
      salesLast90: sales.d90,
      pendingServiceQty: serviceDemandByProduct.get(product.id) ?? 0,
      pendingShortageQty: shortageDemandByProduct.get(product.id) ?? 0,
      categoryName: product.category?.name ?? "Genel",
      categoryId: product.categoryId,
      buyPrice: Number(product.buyPrice ?? 0),
      buyPriceUsd: product.buyPriceUsd ? Number(product.buyPriceUsd) : null,
      priceCurrency:
        typeof attributes.priceCurrency === "string"
          ? attributes.priceCurrency
          : product.buyPriceUsd
            ? "USD"
            : "TRY",
      directSupplierId: product.supplierId,
    }, usdRate);
    if (!recommendation) continue;
    const suggestedSupplier = selectSupplier(product.supplierId, recommendation.categoryName, suppliers);
    recommendations.push({
      ...recommendation,
      suggestedSupplierId: suggestedSupplier?.id ?? null,
      suggestedSupplierName: suggestedSupplier?.name ?? null,
    });
  }

  recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
  const durationMs = Date.now() - startedAt;
  if (process.env.NODE_ENV === "development" && durationMs > 750) {
    console.warn(`[smart-replenishment] slow calculation: ${durationMs}ms`);
  }
  return recommendations;
}

function getCachedSmartReplenishment(shopId: string) {
  return unstable_cache(
    () => calculateSmartReplenishment(shopId),
    ["smart-replenishment", shopId],
    { revalidate: 120, tags: [getSmartReplenishmentTag(shopId)] },
  )();
}

export async function getSmartReplenishmentData(
  offset: number = 0,
  limit: number = 6
): Promise<SmartReplenishmentResult> {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return emptySmartReplenishmentResult();
    const recommendations = await getCachedSmartReplenishment(shopId);
    return {
      recommendations: serializePrisma(recommendations.slice(offset, offset + limit)) as ReplenishmentRecommendation[],
      totalCount: recommendations.length,
      summary: summarizeRecommendations(recommendations),
    };
  } catch (error) {
    console.error("Error in getSmartReplenishmentData:", error);
    return emptySmartReplenishmentResult();
  }
}

export async function cancelPurchaseOrder(id: string) {
  try {
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };

    const order = await prisma.purchaseOrder.findUnique({
      where: { id, shopId },
      include: { items: true, supplier: true }
    });

    if (!order) return { success: false, error: "Sipariş bulunamadı." };

    // Status check - only pending or on_way orders can be cancelled
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return { success: false, error: "Tamamlanmış veya zaten iptal edilmiş siparişler iptal edilemez." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark order as CANCELLED
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "CANCELLED" }
      });

      // 2. Add items back to ShortageItem list so they appear in Smart Replenishment again
      for (const item of order.items) {
        await tx.shortageItem.create({
          data: {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            notes: `İptal edilen ${order.orderNo} nolu siparişten geri döndü (${order.supplier.name})`,
            isResolved: false,
            isTaken: false,
            isFromReplenishment: true,
            shopId
          }
        });
      }

      // 3. Log the cancellation (if you have activity logs, otherwise skipping for now)
    });

    revalidatePath("/stok");
    revalidatePath("/tedarikciler");
    revalidateSmartReplenishment(shopId);

    return { success: true };
  } catch (error) {
    console.error("Cancel purchase order error:", error);
    return { success: false, error: "Sipariş iptal edilirken bir hata oluştu." };
  }
}
