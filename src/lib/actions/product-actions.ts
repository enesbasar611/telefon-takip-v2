"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { formatTitleCase, formatUppercase } from "@/lib/formatters";
import { revalidatePath } from "next/cache";
import { addShortageItem } from "./shortage-actions";
import { getShopId, getUserId } from "@/lib/auth";
import { productSchema } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateProductBarcode } from "@/lib/barcode-utils";
import { z } from "zod";

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

import { cache } from "react";

// ... existing code ...

export const getProducts = cache(async function getProducts(options: {
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

    // Fetch products and total count in parallel
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { updatedAt: "desc" },
        ...(pageSize ? { take: pageSize } : {}),
        ...(page && pageSize ? { skip: (page - 1) * pageSize } : {}),
      }),
      prisma.product.count({ where })
    ]);

    return {
      products: serializePrisma(products),
      totalCount
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], totalCount: 0 };
  }
});

export const searchProducts = cache(async function searchProducts(query: string) {
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
});

export const getCategories = cache(async function getCategories() {
  try {
    const shopId = await getShopId();
    const categories = await prisma.category.findMany({
      where: { shopId }
    });
    return serializePrisma(categories);
  } catch (error) {
    return [];
  }
});

export const getProductsForCategorySummary = cache(async function getProductsForCategorySummary() {
  try {
    const shopId = await getShopId();
    const products = await prisma.product.findMany({
      where: { shopId, stock: { gt: 0 } },
      select: {
        categoryId: true,
        buyPrice: true,
        sellPrice: true,
        stock: true,
      }
    });
    return serializePrisma(products);
  } catch (error) {
    return [];
  }
});

export async function createProduct(rawData: z.input<typeof productSchema>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 30 products per minute
    await checkRateLimit(`createProduct:${userId}`, 30);

    const data = productSchema.parse(rawData);

    let finalCategoryId = data.categoryId;

    // Resolve or create categories based on path
    if (data.categoryPath && data.categoryPath.length > 0) {
      let currentParentId = null;
      for (const catName of data.categoryPath) {
        let category: any = await prisma.category.findFirst({
          where: { shopId, name: { equals: catName, mode: 'insensitive' }, parentId: currentParentId }
        });

        if (!category) {
          category = await prisma.category.create({
            data: { name: formatTitleCase(catName), shopId, parentId: currentParentId }
          });
        }
        currentParentId = category.id;
        finalCategoryId = category.id;
      }
    }

    if (!finalCategoryId) {
      // Fallback to "Genel" category if not provided
      let generalCat = await prisma.category.findFirst({
        where: { shopId, name: { equals: "Genel", mode: "insensitive" } }
      });
      if (!generalCat) {
        generalCat = await prisma.category.create({
          data: { name: "Genel", shopId }
        });
      }
      finalCategoryId = generalCat.id;
    }

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

    let product = await prisma.product.create({
      data: {
        name: formatTitleCase(data.name),
        categoryId: finalCategoryId as string,
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
        attributes: data.attributes || (null as any),
        deviceInfo: data.isSecondHand ? {
          create: {
            imei: data.imei ? formatUppercase(data.imei) : `GEN-${Date.now()}`,
            color: data.color ? formatTitleCase(data.color) : undefined,
            capacity: data.capacity,
            batteryHealth: data.batteryHealth ? Number(data.batteryHealth) : undefined,
            condition: data.condition || "NEW",
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

    if (!product.barcode) {
      product = await prisma.product.update({
        where: { id: product.id, shopId },
        data: {
          barcode: generateProductBarcode({
            shopId,
            productId: product.id,
            productName: product.name,
            createdAtMs: product.createdAt.getTime(),
          }),
        },
      });
    }

    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    return { success: true, product: serializePrisma(product) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Create product error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ürün eklenemedi." };
  }
}

export async function ensureProductBarcode(productId: string) {
  try {
    const shopId = await getShopId();
    const product = await prisma.product.findUnique({ where: { id: productId, shopId } });

    if (!product) {
      return { success: false, error: "Ürün bulunamadı." };
    }

    if (product.barcode) {
      return { success: true, product: serializePrisma(product) };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId, shopId },
      data: {
        barcode: generateProductBarcode({
          shopId,
          productId: product.id,
          productName: product.name,
          createdAtMs: product.createdAt.getTime(),
        }),
      },
    });

    revalidatePath("/stok");
    revalidatePath("/satis");
    return { success: true, product: serializePrisma(updatedProduct) };
  } catch (error) {
    console.error("Ensure product barcode error:", error);
    return { success: false, error: "Barkod oluşturulamadı." };
  }
}

export async function regenerateProductBarcodes(productIds: string[]) {
  try {
    const shopId = await getShopId();
    const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));

    if (uniqueIds.length === 0) {
      return { success: false, error: "Barkod yenilemek için ürün seçin." };
    }

    const products = await prisma.product.findMany({
      where: { shopId, id: { in: uniqueIds } },
    });

    if (products.length === 0) {
      return { success: false, error: "Seçili ürünler bulunamadı." };
    }

    const updatedProducts = await prisma.$transaction(
      products.map((product) =>
        prisma.product.update({
          where: { id: product.id, shopId },
          data: {
            barcode: generateProductBarcode({
              shopId,
              productId: product.id,
              productName: product.name,
            }),
          },
        })
      )
    );

    revalidatePath("/stok");
    revalidatePath("/satis");
    return { success: true, count: updatedProducts.length, products: serializePrisma(updatedProducts) };
  } catch (error) {
    console.error("Regenerate product barcodes error:", error);
    return { success: false, error: "Barkodlar yenilenemedi." };
  }
}

export async function fixAllBarcodes() {
  try {
    const shopId = await getShopId();
    const products = await prisma.product.findMany({
      where: { shopId }
    });

    const updatedProducts = await prisma.$transaction(
      products.map((product) =>
        prisma.product.update({
          where: { id: product.id, shopId },
          data: {
            barcode: generateProductBarcode({
              shopId,
              productId: product.id,
              productName: product.name,
            }),
          },
        })
      )
    );

    revalidatePath("/stok");
    return { success: true, count: updatedProducts.length };
  } catch (error) {
    console.error("Fix all barcodes error:", error);
    return { success: false, error: "Tüm barkodlar güncellenemedi." };
  }
}

// getOrCreateDevUser removed.

export async function updateProduct(id: string, rawData: Partial<z.infer<typeof productSchema>>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 100 updates per minute
    await checkRateLimit(`updateProduct:${userId}`, 100);

    const data = productSchema.partial().parse(rawData);

    const oldProduct = await prisma.product.findUnique({ where: { id, shopId } });
    const buyPrice = data.buyPrice ? Number(data.buyPrice) : undefined;
    const newStock = data.stock !== undefined ? Number(data.stock) : undefined;

    const { imei, color, capacity, batteryHealth, condition, categoryPath, ...productFields } = data;

    const product = await prisma.product.update({
      where: { id, shopId },
      data: {
        name: productFields.name ? formatTitleCase(productFields.name) : undefined,
        barcode: productFields.barcode ? formatUppercase(productFields.barcode) : undefined,
        sku: productFields.sku ? formatUppercase(productFields.sku) : undefined,
        buyPrice: data.buyPrice !== undefined ? Math.ceil(Number(data.buyPrice)) : undefined,
        buyPriceUsd: data.buyPriceUsd !== undefined ? (data.buyPriceUsd ? Number(data.buyPriceUsd) : null) : undefined,
        sellPrice: productFields.sellPrice ? Number(productFields.sellPrice) : undefined,
        stock: newStock,
        criticalStock: productFields.criticalStock !== undefined ? Number(productFields.criticalStock) : undefined,
        categoryId: productFields.categoryId || undefined,
        supplierId: productFields.supplierId || undefined,
        location: productFields.location || undefined,
        isSecondHand: productFields.isSecondHand,
        attributes: productFields.attributes !== undefined ? (productFields.attributes as any) : undefined,
        deviceInfo: (imei || color || capacity || batteryHealth) ? {
          upsert: {
            create: {
              imei: imei ? formatUppercase(imei) : `GEN-${Date.now()}`,
              color: color ? formatTitleCase(color) : undefined,
              capacity: capacity || undefined,
              batteryHealth: batteryHealth ? Number(batteryHealth) : undefined,
              condition: condition || "USED",
              shopId
            },
            update: {
              imei: imei ? formatUppercase(imei) : undefined,
              color: color ? formatTitleCase(color) : undefined,
              capacity: capacity || undefined,
              batteryHealth: batteryHealth ? Number(batteryHealth) : undefined,
              condition: condition || undefined,
            }
          }
        } : undefined
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
    const [products, criticalCount] = await Promise.all([
      prisma.product.findMany({
        where: { shopId },
        select: {
          buyPrice: true,
          sellPrice: true,
          stock: true,
        }
      }),
      prisma.product.count({
        where: {
          shopId,
          stock: { lte: prisma.product.fields.criticalStock }
        }
      })
    ]);

    const totalValue = products.reduce((acc, p) => acc + (Number(p.buyPrice) * p.stock), 0);
    const potentialProfit = products.reduce((acc, p) => acc + ((Number(p.sellPrice) - Number(p.buyPrice)) * p.stock), 0);
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
        include: { category: { include: { parent: true } } },
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
export async function bulkCreateProducts(products: z.input<typeof productSchema>[]) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const results = await prisma.$transaction(async (tx) => {
      const createdProducts = [];

      for (const data of products) {
        let finalCategoryId = data.categoryId;

        // Resolve or create categories
        if (data.categoryPath && data.categoryPath.length > 0) {
          let currentParentId = null;
          for (const catName of data.categoryPath) {
            let category: any = await tx.category.findFirst({
              where: { shopId, name: { equals: catName, mode: 'insensitive' }, parentId: currentParentId }
            });

            if (!category) {
              category = await tx.category.create({
                data: { name: formatTitleCase(catName), shopId, parentId: currentParentId }
              });
            }
            currentParentId = category.id;
            finalCategoryId = category.id;
          }
        }

        if (!finalCategoryId) {
          let generalCat = await tx.category.findFirst({
            where: { shopId, name: { equals: "Genel", mode: "insensitive" } }
          });
          if (!generalCat) {
            generalCat = await tx.category.create({
              data: { name: "Genel", shopId }
            });
          }
          finalCategoryId = generalCat.id;
        }

        let product = await tx.product.create({
          data: {
            name: formatTitleCase(data.name),
            categoryId: finalCategoryId as string,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
            stock: data.stock,
            barcode: data.barcode ? formatUppercase(data.barcode) : undefined,
            sku: data.sku ? formatUppercase(data.sku) : undefined,
            shopId,
            isSecondHand: data.isSecondHand || false,
            deviceInfo: (data.imei || data.color || data.capacity) ? {
              create: {
                imei: data.imei ? formatUppercase(data.imei) : `GEN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                color: data.color ? formatTitleCase(data.color) : undefined,
                capacity: data.capacity,
                batteryHealth: data.batteryHealth ? Number(data.batteryHealth) : undefined,
                condition: data.condition || "USED",
                shopId
              }
            } : undefined,
            movements: {
              create: {
                quantity: data.stock || 0,
                type: "PURCHASE",
                notes: "Toplu içe aktarma ile eklendi.",
                shopId
              }
            },
            inventoryLogs: {
              create: {
                userId,
                quantity: data.stock || 0,
                type: "PURCHASE",
                notes: "Toplu içe aktarma.",
                shopId
              }
            }
          }
        });
        if (!product.barcode) {
          product = await tx.product.update({
            where: { id: product.id, shopId },
            data: {
              barcode: generateProductBarcode({
                shopId,
                productId: product.id,
                productName: product.name,
                createdAtMs: product.createdAt.getTime(),
              }),
            },
          });
        }
        createdProducts.push(product);
      }
      return createdProducts;
    });

    revalidatePath("/stok");
    revalidatePath("/cihaz-listesi");
    return { success: true, count: results.length, products: serializePrisma(results) };
  } catch (error) {
    console.error("Bulk create products error:", error);
    return { success: false, error: "Toplu kayıt işlemi başarısız oldu." };
  }
}
export async function quickUpdateStock(barcode: string, quantity: number, notes?: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();
    const upBarcode = barcode.toUpperCase();

    const product = await prisma.product.findUnique({
      where: { shopId_barcode: { shopId, barcode: upBarcode } }
    });

    if (!product) {
      return { success: false, error: "Ürün bulunamadı." };
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Update stock
      const updated = await tx.product.update({
        where: { id: product.id, shopId },
        data: { stock: { increment: quantity } }
      });

      // 2. Create inventory log
      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          userId,
          quantity,
          type: quantity >= 0 ? "ENTRY" : "OUT",
          notes: notes || "Mobil Tarayıcı Hızlı Stok Güncelleme",
          shopId
        }
      });

      // 3. Create movement for reports
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          quantity,
          type: quantity >= 0 ? "RESTOCK" : "ADJUSTMENT",
          notes: notes || "Mobil Tarayıcı Hızlı Stok Güncelleme",
          shopId
        }
      });

      return updated;
    });

    revalidatePath("/stok");
    revalidatePath("/(dashboard)", "layout");

    return {
      success: true,
      data: serializePrisma(updatedProduct)
    };
  } catch (error) {
    console.error("quickUpdateStock error:", error);
    return { success: false, error: "Stok güncellenemedi." };
  }
}

export async function getProductByBarcode(barcode: string) {
  try {
    const shopId = await getShopId();
    const product = await prisma.product.findFirst({
      where: { barcode: barcode.toUpperCase(), shopId },
      include: {
        category: true
      }
    });
    if (!product) return { success: false, error: "Ürün bulunamadı" };
    return { success: true, data: serializePrisma(product) };
  } catch (error) {
    return { success: false, error: "Ürün getirilemedi" };
  }
}

export async function adjustStockById(id: string, quantity: number, notes?: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const product = await prisma.product.findUnique({
      where: { id, shopId }
    });

    if (!product) {
      return { success: false, error: "Ürün bulunamadı." };
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: product.id, shopId },
        data: { stock: { increment: quantity } }
      });

      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          userId,
          quantity,
          type: quantity >= 0 ? "ENTRY" : "OUT",
          notes: notes || "Tablodan Hızlı Stok Güncelleme",
          shopId
        }
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          quantity,
          type: quantity >= 0 ? "RESTOCK" : "ADJUSTMENT",
          notes: notes || "Tablodan Hızlı Stok Güncelleme",
          shopId
        }
      });

      return updated;
    });

    revalidatePath("/stok");
    revalidatePath("/(dashboard)", "layout");

    return {
      success: true,
      data: serializePrisma(updatedProduct)
    };
  } catch (error) {
    console.error("adjustStockById error:", error);
    return { success: false, error: "Stok güncellenemedi." };
  }
}
