"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { formatTitleCase, formatUppercase } from "@/lib/formatters";
import { revalidatePath } from "next/cache";
import { addShortageItem } from "./shortage-actions";
import { getShopId, getUserId } from "@/lib/auth";

async function checkStockAndAddShortage(productId: string, productName: string) {
  const shopId = await getShopId();
  const product = await prisma.product.findUnique({ where: { id: productId, shopId } });
  if (product && product.stock <= 0) {
    await addShortageItem({
      productId: productId,
      name: productName,
      quantity: 1,
      notes: "Otomatik: Stok tükendi."
    });
  }
}

export async function getProducts(options: {
  search?: string,
  categoryId?: string,
  categoryName?: string,
  minPrice?: number,
  maxPrice?: number,
  minStock?: number,
  maxStock?: number,
  isCritical?: boolean,
  currency?: "TL" | "USD",
  page?: number,
  pageSize?: number
} = {}) {
  const { categoryId, categoryName, page, pageSize, search, minPrice, maxPrice, minStock, maxStock, isCritical, currency } = options;

  try {
    const shopId = await getShopId();
    const where: any = { shopId };

    if (categoryId) where.categoryId = categoryId;
    if (categoryName) {
      where.category = {
        name: { contains: categoryName, mode: 'insensitive' }
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceField = currency === "USD" ? "buyPriceUsd" : "buyPrice";
      where[priceField] = {};
      if (minPrice !== undefined) where[priceField].gte = minPrice;
      if (maxPrice !== undefined) where[priceField].lte = maxPrice;
    }

    // Stock filters
    if (minStock !== undefined || maxStock !== undefined) {
      where.stock = {};
      if (minStock !== undefined) where.stock.gte = minStock;
      if (maxStock !== undefined) where.stock.lte = maxStock;
    }

    // Critical stock filter
    if (isCritical) {
      where.stock = {
        lte: prisma.product.fields.criticalStock
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      ...(pageSize ? { take: pageSize } : {}),
      ...(page && pageSize ? { skip: (page - 1) * pageSize } : {}),
    });
    return serializePrisma(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function searchProducts(query: string) {
  try {
    if (!query || query.length < 2) return [];
    const shopId = await getShopId();

    const products = await prisma.product.findMany({
      where: {
        shopId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { deviceInfo: { color: { contains: query, mode: 'insensitive' } } },
          { deviceInfo: { capacity: { contains: query, mode: 'insensitive' } } },
          { deviceInfo: { serialNumber: { contains: query, mode: 'insensitive' } } },
          { deviceInfo: { imei: { contains: query, mode: 'insensitive' } } }
        ]
      },
      select: {
        id: true,
        name: true,
        stock: true,
        sku: true,
        sellPrice: true,
        category: {
          select: { name: true }
        }
      },
      take: 8
    });

    return serializePrisma(products);
  } catch (error) {
    console.error("Search products error:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    const shopId = await getShopId();
    const categories = await prisma.category.findMany({
      where: { shopId }
    });
    return serializePrisma(categories);
  } catch (error) {
    return [];
  }
}

export async function createProduct(data: {
  name: string;
  categoryId: string;
  buyPrice: number;
  buyPriceUsd?: number | null;
  sellPrice: number;
  stock: number;
  criticalStock: number;
  barcode?: string;
  sku?: string;
  location?: string;
  supplierId?: string;
  isSecondHand?: boolean;
  imei?: string;
  color?: string;
  capacity?: string;
}) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Check for duplicate product WITHIN the shop
    const formattedName = formatTitleCase(data.name);
    const existingProduct = await prisma.product.findFirst({
      where: {
        shopId,
        OR: [
          { name: { equals: formattedName, mode: 'insensitive' } },
          ...(data.barcode ? [{ barcode: formatUppercase(data.barcode) }] : []),
          ...(data.sku ? [{ sku: formatUppercase(data.sku) }] : [])
        ]
      }
    });

    if (existingProduct) {
      return {
        success: false,
        isDuplicate: true,
        message: "Aynı isimli veya barkodlu ürün stokta zaten mevcut.",
        product: serializePrisma(existingProduct)
      };
    }

    const product = await prisma.product.create({
      data: {
        name: formatTitleCase(data.name),
        categoryId: data.categoryId,
        buyPrice: data.buyPrice,
        buyPriceUsd: data.buyPriceUsd ?? null,
        sellPrice: data.sellPrice,
        stock: data.stock,
        criticalStock: data.criticalStock,
        barcode: data.barcode ? formatUppercase(data.barcode) : undefined,
        sku: data.sku ? formatUppercase(data.sku) : undefined,
        location: data.location,
        supplierId: data.supplierId,
        shopId,
        isSecondHand: data.isSecondHand || false,
        deviceInfo: data.isSecondHand ? {
          create: {
            imei: data.imei ? formatUppercase(data.imei) : `GEN-${Date.now()}`,
            color: data.color ? formatTitleCase(data.color) : undefined,
            capacity: data.capacity,
            shopId
          }
        } : undefined,
        // Log the initial stock as a movement
        movements: data.stock > 0 ? {
          create: {
            quantity: data.stock,
            type: "PURCHASE",
            notes: "İlk stok kaydı.",
            shopId
          }
        } : undefined,
        inventoryLogs: data.stock > 0 ? {
          create: {
            userId,
            quantity: data.stock,
            type: "PURCHASE",
            notes: "İlk stok kaydı.",
            shopId
          }
        } : undefined
      }
    });

    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    return { success: true, product: serializePrisma(product) };
  } catch (error) {
    console.error("Create product error:", error);
    return { success: false, error: "Ürün eklenemedi." };
  }
}

// getOrCreateDevUser removed.

export async function updateProduct(id: string, data: any) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();
    const oldProduct = await prisma.product.findUnique({ where: { id, shopId } });
    const buyPrice = data.buyPrice ? Number(data.buyPrice) : undefined;
    const newStock = data.stock !== undefined ? Number(data.stock) : undefined;

    const product = await prisma.product.update({
      where: { id, shopId },
      data: {
        ...data,
        name: data.name ? formatTitleCase(data.name) : undefined,
        barcode: data.barcode ? formatUppercase(data.barcode) : undefined,
        sku: data.sku ? formatUppercase(data.sku) : undefined,
        buyPrice,
        sellPrice: data.sellPrice ? Number(data.sellPrice) : undefined,
        stock: newStock,
        criticalStock: data.criticalStock !== undefined ? Number(data.criticalStock) : undefined,
      }
    });

    // If stock changed manually, log it
    if (oldProduct && newStock !== undefined && newStock !== oldProduct.stock) {
      const diff = newStock - oldProduct.stock;
      await prisma.inventoryMovement.create({
        data: {
          productId: id,
          quantity: diff,
          type: "ADJUSTMENT",
          notes: `Stok manuel güncellendi. (${oldProduct.stock} -> ${newStock})`,
          shopId
        }
      });
      await prisma.inventoryLog.create({
        data: {
          productId: id,
          userId,
          quantity: diff,
          type: "ADJUSTMENT",
          notes: `Stok manuel güncellendi. (${oldProduct.stock} -> ${newStock})`,
          shopId
        }
      });
    }

    // Cost-to-Profit Sync: Update costPrice for active service tickets
    if (buyPrice !== undefined) {
      await prisma.serviceUsedPart.updateMany({
        where: {
          productId: id,
          shopId,
          ticket: {
            status: {
              notIn: ["DELIVERED", "CANCELLED"]
            }
          }
        },
        data: {
          costPrice: buyPrice
        }
      });
    }

    revalidatePath("/stok");
    if (newStock !== undefined && newStock <= 0) {
      await checkStockAndAddShortage(id, product.name);
    }
    return { success: true, product: serializePrisma(product) };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, error: "Ürün güncellenemedi." };
  }
}

export async function applyBulkAIUpdates(updates: any[]) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const results = await prisma.$transaction(
      updates.map((update) => {
        const { id, newName, sellPrice, buyPriceUsd, stock } = update;

        // If there's an USD price, update TL price too (fixed rate 35)
        const buyPrice = buyPriceUsd ? Math.round(Number(buyPriceUsd) * 35) : undefined;

        return prisma.product.update({
          where: { id, shopId },
          data: {
            name: newName ? formatTitleCase(newName) : undefined,
            sellPrice: sellPrice ? Number(sellPrice) : undefined,
            buyPriceUsd: buyPriceUsd ? Number(buyPriceUsd) : undefined,
            buyPrice: buyPrice || undefined,
            stock: stock !== undefined ? Number(stock) : undefined,
            location: update.location || undefined,
          }
        });
      })
    );

    revalidatePath("/stok");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Bulk AI Update error:", error);
    return { success: false, error: "Bazı ürünler güncellenemedi. Lütfen tekrar deneyin." };
  }
}

export async function addInventoryStock(productId: string, quantity: number, notes?: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId, shopId },
        data: { stock: { increment: quantity } }
      }),
      prisma.inventoryMovement.create({
        data: {
          productId,
          quantity,
          type: "PURCHASE",
          notes: notes || "Hızlı stok girişi",
          shopId
        }
      }),
      prisma.inventoryLog.create({
        data: {
          productId,
          userId,
          quantity,
          type: "PURCHASE",
          notes: notes || "Hızlı stok girişi",
          shopId
        }
      })
    ]);

    revalidatePath("/stok");
    return { success: true };
  } catch (error) {
    console.error("Add inventory stock error:", error);
    return { success: false, error: "Stok eklenemedi." };
  }
}

export async function quickSellProduct(productId: string, quantity: number) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();
    const product = await prisma.product.findUnique({ where: { id: productId, shopId } });

    if (!product) throw new Error("Ürün bulunamadı.");
    if (product.stock < quantity) throw new Error("Yetersiz stok.");

    const totalAmount = Number(product.sellPrice) * quantity;
    const saleNumber = `FAST-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          userId,
          shopId,
          totalAmount,
          finalAmount: totalAmount,
          items: {
            create: {
              productId,
              quantity,
              unitPrice: product.sellPrice,
              totalPrice: totalAmount,
              shopId
            }
          },
          transaction: {
            create: {
              type: "INCOME",
              amount: totalAmount,
              description: `Hızlı Satış: ${product.name} (x${quantity})`,
              userId,
              shopId
            }
          },
          inventoryMovements: {
            create: {
              productId,
              quantity: -quantity,
              type: "SALE",
              notes: `Hızlı satış: ${saleNumber}`,
              shopId
            }
          }
        }
      });

      await tx.product.update({
        where: { id: productId, shopId },
        data: {
          stock: { decrement: quantity },
          inventoryLogs: {
            create: {
              userId,
              quantity: -quantity,
              type: "SALE",
              notes: `Hızlı satış yapıldı. Satış No: ${saleNumber}`,
              shopId
            }
          }
        }
      });
    });

    const finalProduct = await prisma.product.findUnique({ where: { id: productId, shopId } });
    if (finalProduct && finalProduct.stock <= 0) {
      await checkStockAndAddShortage(productId, finalProduct.name);
    }

    revalidatePath("/stok");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Quick sell error:", error);
    return { success: false, error: error.message || "Satış işlemi başarısız." };
  }
}

export async function getDeadStockCount(providedShopId?: string) {
  try {
    const shopId = providedShopId || await getShopId();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const productsWithSales = await prisma.saleItem.findMany({
      where: {
        shopId,
        sale: {
          createdAt: { gte: ninetyDaysAgo }
        }
      },
      select: { productId: true },
      distinct: ['productId']
    });

    const activeProductIds = productsWithSales.map(p => p.productId);

    const deadStockCount = await prisma.product.count({
      where: {
        shopId,
        stock: { gt: 0 },
        id: { notIn: activeProductIds }
      }
    });

    return deadStockCount;
  } catch (error) {
    return 0;
  }
}

export async function deleteProduct(id: string, force: boolean = false) {
  try {
    const shopId = await getShopId();

    // 1. Kritik Kayıt Var Mı? (Satış, Servis, Alım Emri, İade)
    const usage = await prisma.product.findUnique({
      where: { id, shopId },
      include: {
        _count: {
          select: {
            saleItems: true,
            usedInServices: true,
            purchaseItems: true,
            returns: true,
          }
        }
      }
    });

    if (!usage) return { success: false, error: "Ürün bulunamadı." };

    const { saleItems, usedInServices, purchaseItems, returns } = usage._count;

    if (!force && (saleItems > 0 || usedInServices > 0 || purchaseItems > 0 || returns > 0)) {
      let reasons = [];
      if (saleItems > 0) reasons.push(`${saleItems} adet satış kaydı`);
      if (usedInServices > 0) reasons.push(`${usedInServices} adet servis kullanımı`);
      if (purchaseItems > 0) reasons.push(`${purchaseItems} adet alım emri`);
      if (returns > 0) reasons.push(`${returns} adet iade kaydı`);

      return {
        success: false,
        requiresConfirmation: true,
        error: `Bu ürün silinemez. Çünkü sistemde ${reasons.join(", ")} bulunmaktadır. Silmek bu kayıtları da etkileyecektir. Devam edip tüm geçmişiyle birlikte silmek istiyor musunuz?`
      };
    }

    // 2. Güvenli Temizlik (Stok logları, Hareketler, AI Uyarılar, Cihaz Bilgileri + Bağımlılıklar)
    await prisma.$transaction(async (tx) => {
      if (force) {
        // Bağımlı kayıtları temizle
        await tx.saleItem.deleteMany({ where: { productId: id, shopId } });
        await tx.serviceUsedPart.deleteMany({ where: { productId: id, shopId } });
        await tx.returnTicket.deleteMany({ where: { productId: id, shopId } });
        await tx.purchaseOrderItem.updateMany({
          where: { productId: id, shopId },
          data: { productId: null }
        });
      }

      await tx.inventoryLog.deleteMany({ where: { productId: id, shopId } });
      await tx.inventoryMovement.deleteMany({ where: { productId: id, shopId } });
      await tx.stockAIAlert.deleteMany({ where: { productId: id, shopId } });
      await tx.deviceHubInfo.deleteMany({ where: { productId: id } });
      await tx.shortageItem.deleteMany({ where: { productId: id, shopId } });
      await tx.product.delete({ where: { id, shopId } });
    });

    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    revalidatePath("/stok/kategoriler");

    return { success: true };
  } catch (error) {
    console.error("deleteProduct error:", error);
    return { success: false, error: "Ürün silinirken beklenmedik bir hata oluştu." };
  }
}

export async function getProductMovements(productId: string) {
  try {
    const shopId = await getShopId();
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId, shopId },
      orderBy: { createdAt: "desc" },
      include: {
        serviceTicket: {
          select: {
            ticketNumber: true,
            customer: {
              select: { name: true }
            }
          }
        },
        sale: {
          select: { saleNumber: true }
        }
      }
    });
    return serializePrisma(movements);
  } catch (error) {
    return [];
  }
}

export async function getInventoryStats() {
  try {
    const shopId = await getShopId();
    const products = await prisma.product.findMany({ where: { shopId } });

    const totalValue = products.reduce((acc, p) => acc + (Number(p.buyPrice) * p.stock), 0);
    const potentialProfit = products.reduce((acc, p) => acc + ((Number(p.sellPrice) - Number(p.buyPrice)) * p.stock), 0);
    const criticalCount = products.filter(p => p.stock <= p.criticalStock).length;
    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);

    return {
      totalValue,
      potentialProfit,
      criticalCount,
      totalItems
    };
  } catch (error) {
    return { totalValue: 0, potentialProfit: 0, criticalCount: 0, totalItems: 0 };
  }
}

export async function createCategory(name: string) {
  try {
    const shopId = await getShopId();
    const category = await prisma.category.create({ data: { name: formatTitleCase(name), shopId } });
    revalidatePath("/stok");
    return { success: true, category: serializePrisma(category) };
  } catch (error) {
    return { success: false, error: "Kategori oluşturulamadı." };
  }
}

export async function getCriticalProducts() {
  try {
    const shopId = await getShopId();
    const products = await prisma.product.findMany({
      where: {
        shopId,
        stock: { lte: prisma.product.fields.criticalStock }
      },
      include: { category: true },
      orderBy: { stock: "asc" }
    });
    return serializePrisma(products);
  } catch (error) {
    console.error("Error fetching critical products:", error);
    return [];
  }
}

export async function getAllInventoryMovements(options: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  try {
    const { page = 1, limit = 50, search } = options;
    const shopId = await getShopId();

    const whereCondition: any = { shopId };

    if (search) {
      whereCondition.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, movements] = await prisma.$transaction([
      prisma.inventoryMovement.count({ where: whereCondition }),
      prisma.inventoryMovement.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { name: true, sku: true }
          },
          serviceTicket: {
            select: { ticketNumber: true }
          },
          sale: {
            select: { saleNumber: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return {
      success: true,
      data: serializePrisma(movements),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error("Error fetching all inventory movements:", error);
    return { success: false, data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
  }
}

export async function getPOSInitialData() {
  try {
    const shopId = await getShopId();
    const [products, customers, categories] = await Promise.all([
      prisma.product.findMany({
        where: { shopId },
        include: { category: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.customer.findMany({
        where: { shopId },
        select: { id: true, name: true, phone: true },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.category.findMany({
        where: { shopId },
        orderBy: { name: "asc" }
      })
    ]);
    return serializePrisma({ products, customers, categories });
  } catch (error) {
    console.error("Error fetching POS initial data:", error);
    return { products: [], customers: [], categories: [] };
  }
}
