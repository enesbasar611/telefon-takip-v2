"use server";
import prisma from "@/lib/prisma";
import { serializePrisma, toSentenceCase } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { addShortageItem } from "./shortage-actions";

async function checkStockAndAddShortage(productId: string, productName: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product && product.stock <= 0) {
    await addShortageItem({
      productId: productId,
      name: productName,
      quantity: 1,
      notes: "Otomatik: Stok tükendi."
    });
  }
}

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" }
    });
    return serializePrisma(products);
  } catch (error) {
    return [];
  }
}

export async function searchProducts(query: string) {
  try {
    if (!query || query.length < 2) return [];

    // Find the category "Parça" (case insensitive)
    const partCategory = await prisma.category.findFirst({
      where: {
        name: { contains: "Parça", mode: "insensitive" }
      }
    });

    const products = await prisma.product.findMany({
      where: {
        categoryId: partCategory?.id,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } }
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
    const categories = await prisma.category.findMany();
    return serializePrisma(categories);
  } catch (error) {
    return [];
  }
}

export async function createProduct(data: {
  name: string;
  categoryId: string;
  buyPrice: number;
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
    const user = await getOrCreateDevUser();

    // Check for duplicate product
    const existingProduct = await prisma.product.findFirst({
      where: {
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
        sellPrice: data.sellPrice,
        stock: data.stock,
        criticalStock: data.criticalStock,
        barcode: data.barcode,
        sku: data.sku,
        location: data.location,
        supplierId: data.supplierId,
        isSecondHand: data.isSecondHand || false,
        deviceInfo: data.isSecondHand ? {
          create: {
            imei: data.imei || `GEN-${Date.now()}`,
            color: data.color,
            capacity: data.capacity,
          }
        } : undefined,
        // Log the initial stock as a movement
        movements: data.stock > 0 ? {
          create: {
            quantity: data.stock,
            type: "PURCHASE",
            notes: "İlk stok kaydı."
          }
        } : undefined,
        inventoryLogs: data.stock > 0 ? {
          create: {
            userId: user.id,
            quantity: data.stock,
            type: "PURCHASE",
            notes: "İlk stok kaydı."
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

async function getOrCreateDevUser() {
  return await prisma.user.upsert({
    where: { email: "admin@takipv2.com" },
    update: {},
    create: {
      email: "admin@takipv2.com",
      name: "Admin",
      password: "hashed_password",
      role: "ADMIN",
    },
  });
}

export async function updateProduct(id: string, data: any) {
  try {
    const user = await getOrCreateDevUser();
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    const buyPrice = data.buyPrice ? Number(data.buyPrice) : undefined;
    const newStock = data.stock !== undefined ? Number(data.stock) : undefined;

    const product = await prisma.product.update({
      where: { id },
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
          notes: `Stok manuel güncellendi. (${oldProduct.stock} -> ${newStock})`
        }
      });
      await prisma.inventoryLog.create({
        data: {
          productId: id,
          userId: user.id,
          quantity: diff,
          type: "ADJUSTMENT",
          notes: `Stok manuel güncellendi. (${oldProduct.stock} -> ${newStock})`
        }
      });
    }

    // Cost-to-Profit Sync: Update costPrice for active service tickets
    if (buyPrice !== undefined) {
      await prisma.serviceUsedPart.updateMany({
        where: {
          productId: id,
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
    const user = await getOrCreateDevUser();

    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } }
      }),
      prisma.inventoryMovement.create({
        data: {
          productId,
          quantity,
          type: "PURCHASE",
          notes: notes || "Hızlı stok girişi"
        }
      }),
      prisma.inventoryLog.create({
        data: {
          productId,
          userId: user.id,
          quantity,
          type: "PURCHASE",
          notes: notes || "Hızlı stok girişi"
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
    const user = await getOrCreateDevUser();
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) throw new Error("Ürün bulunamadı.");
    if (product.stock < quantity) throw new Error("Yetersiz stok.");

    const totalAmount = Number(product.sellPrice) * quantity;
    const saleNumber = `FAST-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          userId: user.id,
          totalAmount,
          finalAmount: totalAmount,
          items: {
            create: {
              productId,
              quantity,
              unitPrice: product.sellPrice,
              totalPrice: totalAmount
            }
          },
          transaction: {
            create: {
              type: "INCOME",
              amount: totalAmount,
              description: `Hızlı Satış: ${product.name} (x${quantity})`,
              userId: user.id
            }
          },
          inventoryMovements: {
            create: {
              productId,
              quantity: -quantity,
              type: "SALE",
              notes: `Hızlı satış: ${saleNumber}`
            }
          }
        }
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          inventoryLogs: {
            create: {
              userId: user.id,
              quantity: -quantity,
              type: "SALE",
              notes: `Hızlı satış yapıldı. Satış No: ${saleNumber}`
            }
          }
        }
      });
    });

    const finalProduct = await prisma.product.findUnique({ where: { id: productId } });
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
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const productsWithSales = await prisma.saleItem.findMany({
      where: {
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
    await prisma.product.delete({ where: { id } });
    revalidatePath("/stok");
    revalidatePath("/ikinci-el");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Ürün silinemedi." };
  }
}

export async function getProductMovements(productId: string) {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
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
    const products = await prisma.product.findMany({});

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
    const category = await prisma.category.create({ data: { name } });
    revalidatePath("/stok");
    return { success: true, category: serializePrisma(category) };
  } catch (error) {
    return { success: false, error: "Kategori oluşturulamadı." };
  }
}

export async function getCriticalProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
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
    const movements = await prisma.inventoryMovement.findMany({
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
