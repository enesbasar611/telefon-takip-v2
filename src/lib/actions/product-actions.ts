"use server";
import prisma from "@/lib/prisma";
import { serializePrisma, toSentenceCase } from "@/lib/utils";
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
  categoryId?: string,
  page?: number,
  pageSize?: number,
  search?: string
} = {}) {
  const { categoryId, page, pageSize, search } = options;

  try {
    const shopId = await getShopId();
    const where: any = { shopId };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
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
    const existingProduct = await prisma.product.findFirst({
      where: {
        shopId,
        OR: [
          { name: { equals: toSentenceCase(data.name), mode: 'insensitive' } },
          ...(data.barcode ? [{ barcode: data.barcode }] : []),
          ...(data.sku ? [{ sku: data.sku }] : [])
        ]
      }
    });

    if (existingProduct) {
      return { success: false, isDuplicate: true, message: "Aynı isimli veya barkodlu ürün stokta zaten mevcut." };
    }

    const product = await prisma.product.create({
      data: {
        name: toSentenceCase(data.name),
        categoryId: data.categoryId,
        buyPrice: data.buyPrice,
        buyPriceUsd: data.buyPriceUsd ?? null,
        sellPrice: data.sellPrice,
        stock: data.stock,
        criticalStock: data.criticalStock,
        barcode: data.barcode,
        sku: data.sku,
        location: data.location,
        supplierId: data.supplierId,
        shopId,
        isSecondHand: data.isSecondHand || false,
        deviceInfo: data.isSecondHand ? {
          create: {
            imei: data.imei || `GEN-${Date.now()}`,
            color: data.color,
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
        name: data.name ? toSentenceCase(data.name) : undefined,
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

export async function getDeadStockCount() {
  try {
    const shopId = await getShopId();
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

export async function deleteProduct(id: string) {
  try {
    const shopId = await getShopId();
    await prisma.product.delete({ where: { id, shopId } });
    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ürün silinemedi." };
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
    const category = await prisma.category.create({ data: { name, shopId } });
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

export async function getAllInventoryMovements() {
  try {
    const shopId = await getShopId();
    const movements = await prisma.inventoryMovement.findMany({
      where: { shopId },
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
      take: 100
    });
    return serializePrisma(movements);
  } catch (error) {
    console.error("Error fetching all inventory movements:", error);
    return [];
  }
}
