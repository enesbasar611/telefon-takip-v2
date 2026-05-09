"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { getShopId, getUserId, auth } from "@/lib/auth";

export async function getShortageItems() {
  const shopId = await getShopId(false);
  if (!shopId) return [];

  const items = await prisma.shortageItem.findMany({
    where: { shopId, isResolved: false },
    include: {
      product: true,
      assignedTo: true,
      customer: true,
      shop: true
    },
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(items);
}

export async function getGlobalShortageList(dateStr?: string) {
  const session = await auth();
  const shopId = await getShopId(false);
  if (!shopId) return [];

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "SHOP_MANAGER", "MANAGER"].includes(session?.user?.role || "");

  let dateFilter = {};
  if (dateStr) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter = { createdAt: { gte: startOfDay, lte: endOfDay } };
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

  return serializePrisma([...manualItems, ...missingProductAlerts]);
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
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    return { success: false, error: "İşlem başarısız." };
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
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { gte: startOfDay, lte: endOfDay } };
    }

    const whereClause: any = isAdmin
      ? { shopId, assignedToId: { not: null }, ...dateFilter }
      : { shopId, assignedToId: userId, ...dateFilter };

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
    return { success: true, items: serializePrisma(items) };
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

    return { success: true };
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

import { getExchangeRates } from "@/lib/actions/currency-actions";

export async function approveShortageItem(
  id: string,
  quantity: number,
  mode: "STOCK" | "SALE" | "DEBT" = "STOCK",
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "DEBT" = "CASH",
  customPrice?: number,
  currency: "TL" | "USD" = "TL"
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

    await prisma.$transaction(async (tx) => {
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

      // 2. STOK HAREKETİ: Ürün her şekilde depoya girer
      if (shortageItem.productId) {
        await tx.product.update({
          where: { id: shortageItem.productId!, shopId },
          data: {
            stock: { increment: quantity },
            movements: {
              create: {
                quantity: quantity,
                type: "PURCHASE",
                notes: `${shortageItem.name} (Kurye Teslimatı)`,
                shopId
              }
            }
          }
        });
      }

      // 3. SATIŞ VE FİNANSAL İŞLEMLER (Dükkan stoğu değilse)
      if ((finalMode === "SALE" || finalMode === "DEBT") && shortageItem.customerId && shortageItem.productId) {
        const product = shortageItem.product!;

        // Fiyat hesaplama (USD/TL dönüşümü)
        let unitPriceTL = customPrice || Number(product.sellPrice);
        if (currency === "USD") {
          const rates = await getExchangeRates(shopId);
          unitPriceTL = Math.ceil(unitPriceTL * rates.usd);
        }

        const totalAmount = unitPriceTL * quantity;
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
                productId: shortageItem.productId!,
                quantity: quantity,
                unitPrice: unitPriceTL,
                totalPrice: totalAmount,
                shopId
              }
            }
          }
        });

        // Satış yapıldığı için stoğu tekrar düş (Giriş yapıldı, hemen bayi için çıkış yapılıyor)
        await tx.product.update({
          where: { id: shortageItem.productId!, shopId },
          data: { stock: { decrement: quantity } }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: shortageItem.productId!,
            quantity: -quantity,
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
        data: { isResolved: true }
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

export async function deleteShortageItem(id: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Bu işlem için yetkiniz yok." };
    }
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Dükkan bilgisi bulunamadı." };
    await prisma.shortageItem.delete({
      where: { id, shopId }
    });
    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
    console.error("Shortage deletion error:", error);
    return { success: false, error: "Silme işlemi başarısız." };
  }
}

export async function deleteShortageItems(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: true };
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Bu işlem için yetkiniz yok." };
    }
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    await prisma.shortageItem.deleteMany({
      where: {
        id: { in: ids },
        shopId
      }
    });
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

export async function finishCourierDay(courierId: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      return { success: false, error: "Yetkiniz yok." };
    }
    const shopId = await getShopId();
    if (!shopId) return { success: false, error: "Shop ID not found" };

    // Sadece alınmayanları (isTaken = false) boşa düşür (assignedToId = null)
    await prisma.shortageItem.updateMany({
      where: {
        shopId,
        assignedToId: courierId,
        isResolved: false,
        isTaken: false
      },
      data: {
        assignedToId: null
      }
    });

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
        message: "Yönetici tarafından günlük işlemleriniz kapatıldı. Kalan siparişleriniz boş havuza aktarıldı.",
        referenceId: courierId
      }
    });

    revalidatePath("/kurye");
    return { success: true };
  } catch (error) {
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
