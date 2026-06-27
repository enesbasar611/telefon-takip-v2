"use server";
import prisma from "@/lib/prisma";
import { serializePrisma, toTitleCase } from "@/lib/utils";
import { OrderStatus, ServiceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

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

export interface ReplenishmentRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  criticalStock: number;
  stockDeficit: number;
  suggestedOrderQty: number;
  salesLast30: number;
  salesLast60: number;
  salesLast90: number;
  dailyVelocity: number;
  daysUntilStockout: number | null;
  pendingServiceQty: number;
  categoryName: string;
  buyPrice: number;
  buyPriceUsd: number | null;
  suggestedSupplierId: string | null;
  suggestedSupplierName: string | null;
  priorityScore: number;
  priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  estimatedCost: number;
}

export async function getSmartReplenishmentData(
  offset: number = 0,
  limit: number = 6
): Promise<{ recommendations: ReplenishmentRecommendation[]; totalCount: number }> {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { recommendations: [], totalCount: 0 };

    const now = new Date();
    const d30ago = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const d60ago = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
    const d90ago = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

    // 1. Get products that are either below critical stock OR have active shortage items
    // First, find IDs of products in shortage
    const shortageItemsProdIds = await prisma.shortageItem.findMany({
      where: { shopId, isResolved: false, isTaken: false },
      select: { productId: true }
    });
    const idsWithShortageSet = new Set(shortageItemsProdIds.map(s => s.productId).filter(Boolean) as string[]);

    // Find products that meet criteria (low stock OR explicit shortage)
    // Using a more lightweight query first to identify IDs
    const allProductMetas = await prisma.product.findMany({
      where: {
        shopId,
        hideFromShortage: false,
      },
      select: {
        id: true,
        stock: true,
        criticalStock: true,
      }
    });

    const candidateIds = allProductMetas
      .filter(p => p.stock <= (p.criticalStock ?? 1) || idsWithShortageSet.has(p.id))
      .map(p => p.id);

    if (candidateIds.length === 0) return { recommendations: [], totalCount: 0 };

    // Fetch full data ONLY for candidates
    const candidateProducts = await prisma.product.findMany({
      where: { id: { in: candidateIds } },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (candidateProducts.length === 0) return { recommendations: [], totalCount: 0 };

    const productIds = candidateProducts.map((p) => p.id);

    // 2. Satış hızı: SaleItem üzerinden son 90 gün satış miktarı
    const saleItems90 = await prisma.saleItem.findMany({
      where: {
        shopId,
        productId: { in: productIds },
        sale: { createdAt: { gte: d90ago } },
      },
      include: { sale: { select: { createdAt: true } } },
    });

    // 3. Servis kullanımı: Açık servis biletlerindeki bekleyen parça ihtiyacı
    const usedParts = await prisma.serviceUsedPart.findMany({
      where: {
        shopId,
        productId: { in: productIds },
        ticket: {
          status: { notIn: [ServiceStatus.DELIVERED, ServiceStatus.CANCELLED] },
        },
      },
      include: { ticket: { select: { status: true } } },
    });

    // 4. ShortageItems: Aktif eksik parça talepleri
    const shortageItems = await prisma.shortageItem.findMany({
      where: {
        shopId,
        productId: { in: productIds },
        isResolved: false,
        isTaken: false,
      },
    });

    // 4b. Active assigned shortage IDs (assigned to couriers)
    const assignedShortageProductIds = new Set(
      shortageItems
        .filter(si => si.assignedToId !== null)
        .map(si => si.productId)
        .filter(Boolean) as string[]
    );

    // 4c. Active purchase orders (ORDERED, PENDING, ON_WAY)
    const activePurchaseOrderItems = await prisma.purchaseOrderItem.findMany({
      where: {
        order: {
          shopId,
          status: { in: ["PENDING", "ON_WAY"] }
        },
        productId: { in: productIds }
      },
      select: { productId: true }
    });

    const productsInActiveOrders = new Set(
      activePurchaseOrderItems.map(item => item.productId).filter(Boolean) as string[]
    );

    // 5. Tedarikçiler
    const suppliers = await prisma.supplier.findMany({
      where: { shopId },
      select: { id: true, name: true, trustScore: true, category: true },
    });

    // Satış verilerini ürün bazında topla
    const salesByProduct = new Map<string, { d30: number; d60: number; d90: number }>();
    for (const si of saleItems90) {
      const saleDate = new Date(si.sale.createdAt);
      const entry = salesByProduct.get(si.productId) ?? { d30: 0, d60: 0, d90: 0 };
      entry.d90 += si.quantity;
      if (saleDate >= d60ago) entry.d60 += si.quantity;
      if (saleDate >= d30ago) entry.d30 += si.quantity;
      salesByProduct.set(si.productId, entry);
    }

    // Servis parça ihtiyacını topla
    const serviceDemandByProduct = new Map<string, number>();
    for (const up of usedParts) {
      serviceDemandByProduct.set(
        up.productId,
        (serviceDemandByProduct.get(up.productId) ?? 0) + up.quantity
      );
    }

    // Shortage talepleri topla
    const shortageDemandByProduct = new Map<string, number>();
    for (const si of shortageItems) {
      if (!si.productId) continue;
      shortageDemandByProduct.set(
        si.productId,
        (shortageDemandByProduct.get(si.productId) ?? 0) + si.quantity
      );
    }

    const recommendations: ReplenishmentRecommendation[] = [];

    for (const product of candidateProducts) {
      // Skip if assigned to courier or in active purchase order
      if (assignedShortageProductIds.has(product.id) || productsInActiveOrders.has(product.id)) {
        continue;
      }

      const sales = salesByProduct.get(product.id) ?? { d30: 0, d60: 0, d90: 0 };
      const pendingServiceQty = serviceDemandByProduct.get(product.id) ?? 0;
      const pendingShortageQty = shortageDemandByProduct.get(product.id) ?? 0;
      const totalPendingDemand = pendingServiceQty + pendingShortageQty;

      // Günlük satış hızı (son 30 günlük ağırlıklı)
      const dailyVelocity =
        sales.d30 > 0
          ? sales.d30 / 30
          : sales.d60 > 0
            ? sales.d60 / 60
            : sales.d90 / 90;

      // Stok tükeneceği gün
      const daysUntilStockout =
        dailyVelocity > 0 && product.stock > 0
          ? Math.floor(product.stock / dailyVelocity)
          : product.stock === 0
            ? 0
            : null;

      // Stok açığı
      const stockDeficit = Math.max(0, (product.criticalStock ?? 1) - product.stock);

      // Önerilen sipariş miktarı:
      // = (30 günlük satış hızı * 2) + bekleyen servis/shortage talebi + stok açığı
      const suggestedOrderQty = Math.max(
        1,
        Math.ceil(dailyVelocity * 30) + totalPendingDemand + stockDeficit
      );

      // Tedarikçi önerisi: Ürünün bağlı tedarikçisi varsa onu kullan, yoksa en yüksek trust score'lu
      const suggestedSupplier =
        product.supplier ??
        suppliers.sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))[0] ??
        null;

      // Öncelik skoru (0-100): stok 0 = max, yakın tükenme, yüksek satış
      let priorityScore = 0;
      if (product.stock === 0) priorityScore += 50;
      else priorityScore += Math.round((stockDeficit / Math.max(1, product.criticalStock ?? 1)) * 30);
      if (daysUntilStockout !== null && daysUntilStockout <= 3) priorityScore += 20;
      else if (daysUntilStockout !== null && daysUntilStockout <= 7) priorityScore += 10;
      if (totalPendingDemand > 0) priorityScore += Math.min(20, totalPendingDemand * 5);
      if (dailyVelocity > 1) priorityScore += 10;
      else if (dailyVelocity > 0.5) priorityScore += 5;
      priorityScore = Math.min(100, priorityScore);

      const priorityLevel: ReplenishmentRecommendation["priorityLevel"] =
        priorityScore >= 70
          ? "CRITICAL"
          : priorityScore >= 45
            ? "HIGH"
            : priorityScore >= 20
              ? "MEDIUM"
              : "LOW";

      const buyPrice = Number(product.buyPrice ?? 0);
      const estimatedCost = buyPrice * suggestedOrderQty;

      recommendations.push({
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        criticalStock: product.criticalStock ?? 1,
        stockDeficit,
        suggestedOrderQty,
        salesLast30: sales.d30,
        salesLast60: sales.d60,
        salesLast90: sales.d90,
        dailyVelocity: Math.round(dailyVelocity * 100) / 100,
        daysUntilStockout,
        pendingServiceQty: totalPendingDemand,
        categoryName: (product as any).category?.name ?? "Genel",
        buyPrice,
        buyPriceUsd: product.buyPriceUsd ? Number(product.buyPriceUsd) : null,
        suggestedSupplierId: suggestedSupplier?.id ?? null,
        suggestedSupplierName: suggestedSupplier?.name ?? null,
        priorityScore,
        priorityLevel,
        estimatedCost,
      });
    }

    // Öncelik skoruna göre sırala
    recommendations.sort((a, b) => b.priorityScore - a.priorityScore);

    const totalCount = recommendations.length;
    const paginatedRecommendations = recommendations.slice(offset, offset + limit);

    return {
      recommendations: serializePrisma(paginatedRecommendations) as ReplenishmentRecommendation[],
      totalCount
    };
  } catch (error) {
    console.error("Error in getSmartReplenishmentData:", error);
    return { recommendations: [], totalCount: 0 };
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

    return { success: true };
  } catch (error) {
    console.error("Cancel purchase order error:", error);
    return { success: false, error: "Sipariş iptal edilirken bir hata oluştu." };
  }
}
