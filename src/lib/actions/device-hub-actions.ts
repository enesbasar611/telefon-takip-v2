"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { formatTitleCase, formatProperCase, formatUppercase } from "@/lib/formatters";
import { revalidatePath, revalidateTag } from "next/cache";
import { getShopId, getUserId } from "@/lib/auth";

export async function getDeviceList(params?: { month?: string; startDate?: string; endDate?: string }) {
  try {
    const shopId = await getShopId();

    let whereClause: any = {
      shopId,
      deviceInfo: { isNot: null }
    };

    let start: Date | undefined;
    let end: Date | undefined;

    if (params?.startDate && params?.endDate) {
      start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
    } else if (params?.month) {
      const [year, month] = params.month.split("-").map(Number);
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59);
    }

    if (start && end) {
      whereClause = {
        AND: [
          { shopId },
          { deviceInfo: { isNot: null } },
          {
            OR: [
              { stock: { gt: 0 } }, // In stock
              {
                saleItems: {
                  some: {
                    sale: {
                      createdAt: {
                        gte: start,
                        lte: end
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      };
    }

    const devices = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        deviceInfo: true,
        saleItems: {
          take: 1,
          include: {
            sale: {
              include: { customer: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = devices.map((d: any) => ({
      ...d,
      brand: d.name.split(" ")[0],
      sale: d.saleItems?.[0]?.sale || null
    }));
    return serializePrisma(mapped);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
}

export async function ensureDeviceCategory(condition: "NEW" | "USED" | "INTERNATIONAL"): Promise<string> {
  const shopId = await getShopId();

  const conditionLabels: Record<string, string> = {
    NEW: "Sıfır",
    USED: "2. El",
    INTERNATIONAL: "Yurtdışı",
  };
  const subName = conditionLabels[condition] ?? "Sıfır";

  // Find or create top-level "Telefonlar" category
  let telefonlar = await prisma.category.findFirst({
    where: { shopId, name: { equals: "Telefonlar", mode: "insensitive" } },
  });
  if (!telefonlar) {
    telefonlar = await prisma.category.create({
      data: { name: "Telefonlar", shopId },
    });
  }

  // Find or create sub-category (Sıfır / 2. El / Yurtdışı) under Telefonlar
  let sub = await prisma.category.findFirst({
    where: { shopId, name: { equals: subName, mode: "insensitive" }, parentId: telefonlar.id },
  });
  if (!sub) {
    sub = await prisma.category.create({
      data: { name: subName, shopId, parentId: telefonlar.id },
    });
  }

  return sub.id;
}

export async function createDeviceEntry(data: any) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const result = await prisma.$transaction(async (tx) => {
      // Auto-resolve category based on condition
      const categoryId = await ensureDeviceCategory(data.condition);

      // Compute warrantyEndDate from months if provided
      let warrantyEndDate: Date | undefined = undefined;
      if (data.warrantyEndDate) {
        warrantyEndDate = new Date(data.warrantyEndDate);
      } else if (data.warrantyMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + parseInt(data.warrantyMonths));
        warrantyEndDate = d;
      }

      const brand = formatTitleCase(data.brand);
      const model = formatTitleCase(data.model);
      const name = `${brand} ${model}`;
      const imei = formatUppercase(data.imei);
      const sellerName = data.sellerName ? formatProperCase(data.sellerName) : undefined;

      const product = await tx.product.create({
        data: {
          name,
          shopId,
          categoryId,
          buyPrice: data.buyPrice,
          sellPrice: data.sellPrice,
          stock: 1,
          criticalStock: 0,
          isSecondHand: data.condition !== "NEW",
          deviceInfo: {
            create: {
              shopId,
              imei,
              serialNumber: data.serialNumber ? formatUppercase(data.serialNumber) : null,
              color: data.color ? formatTitleCase(data.color) : null,
              capacity: data.capacity,
              batteryHealth: data.batteryHealth ? Number(data.batteryHealth) : null,
              cosmeticScore: data.cosmeticScore ?? 10,
              condition: data.condition,
              expertChecklist: data.expertChecklist ?? {},
              buyBackPrice: data.buyBackPrice,
              buyBackMonths: data.buyBackMonths,
              purchasedFrom: data.purchasedFrom,
              purchaseDate: new Date(),
              ...({
                ram: data.ram,
                storage: data.storage,
                warrantyEndDate: warrantyEndDate ?? null,
                sim1ExpirationDate: data.sim1ExpirationDate ? new Date(data.sim1ExpirationDate) : null,
                sim1NotUsed: data.sim1NotUsed === true,
                sim2ExpirationDate: data.sim2ExpirationDate ? new Date(data.sim2ExpirationDate) : null,
                sim2NotUsed: data.sim2NotUsed === true,
                sellerName,
                sellerTC: data.sellerTC,
                sellerPhone: data.sellerPhone,
                sellerIdPhotoUrl: data.sellerIdPhotoUrl,
                photoUrls: data.photoUrls ?? [],
                invoiceUrl: data.invoiceUrl ?? null,
              } as any),
            }
          }
        }
      });

      // 1. Record the purchase as an EXPENSE transaction
      let paymentMethod: any = "CASH";
      if (data.financeAccountId) {
        const account = await tx.financeAccount.findUnique({ where: { id: data.financeAccountId } });
        if (account) {
          paymentMethod = account.type === "CASH" ? "CASH" : "TRANSFER";
        }
      }

      await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount: data.buyPrice,
          description: `Cihaz Alımı: ${name} (IMEI: ${imei})`,
          paymentMethod,
          financeAccountId: data.financeAccountId || null,
          userId,
          shopId,
          category: "CİHAZ ALIMI"
        }
      });

      // 2. Update Finance Account Balance
      if (data.financeAccountId) {
        await tx.financeAccount.update({
          where: { id: data.financeAccountId },
          data: { balance: { decrement: data.buyPrice } }
        });
      }

      // 3. Inventory Movement
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          shopId,
          quantity: 1,
          type: "PURCHASE",
          notes: `Cihaz Alımı: ${data.condition}`
        }
      });

      return product;
    });

    revalidateTag("device-list");
    revalidatePath("/satis/kasa");
    revalidatePath("/stok");
    revalidatePath("/dashboard");

    return { success: true, device: serializePrisma(result) };
  } catch (error: any) {
    console.error("Create device error:", error);
    const detail = error?.message || "Bilinmeyen hata";
    return { success: false, error: `Cihaz kaydı oluşturulamadı: ${detail}` };
  }
}


export async function updateDeviceExpertise(deviceId: string, expertChecklist: any, cosmeticScore: number) {
  try {
    const shopId = await getShopId();
    const info = await prisma.deviceHubInfo.findUnique({ where: { id: deviceId }, include: { product: true } });
    if (!info || info.product.shopId !== shopId) throw new Error("Yetkisiz islem");

    await prisma.deviceHubInfo.update({
      where: { id: deviceId },
      data: {
        expertChecklist,
        cosmeticScore,
        updatedAt: new Date(),
      },
    });
    revalidateTag("device-list");
    return { success: true };
  } catch (error) {
    console.error("Error updating device expertise:", error);
    return { success: false, error: "Ekspertiz sonuçları güncellenirken hata oluştu." };
  }
}

export async function deleteDevice(productId: string, options?: { keepInBalance?: boolean }) {
  try {
    const shopId = await getShopId();
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId },
      include: { deviceInfo: true }
    });
    if (!product) return { success: false, error: "Cihaz bulunamadı." };

    // If keepInBalance is true, we don't delete the financial record. 
    // In this system, "deleting" usually means removing the purchase transaction.
    // However, the user said "bakiyeden düşmesin" (if they don't want it to affect balance, they mean keep the past status).
    // The user's request: "bakiyeden düşülsün mü diye sorsun eğer düşülmesini istemiyorsa bakiyeden düşmesin, geçmişten silinmesin sadece bu listede görünmesin."

    // Translation:
    // If user says "Düşülsün" (YES) -> Standard delete (Everything gone, balance affected as if purchase never happened? OR record a return? No, standard delete usually means revert).
    // If user says "Düşülmesin" (NO) -> Keep history, just hide from list.

    if (options?.keepInBalance) {
      // Soft delete: just set stock to 0 so it doesn't appear in active list
      // and maybe mark as hidden/sold in history.
      await prisma.product.update({
        where: { id: productId },
        data: { stock: 0 }
      });

      revalidateTag("device-list");
      return { success: true, message: "Cihaz stoktan çıkarıldı, geçmiş verileri korundu." };
    }

    // Standard Hard Delete (Affected balance because purchase transaction remains but product is gone? 
    // Wait, the existing code deletes EVERYTHING including saleItems.
    // If we want to revert balance impact, we find the purchase transaction.

    await prisma.$transaction(async (tx) => {
      // Find the purchase transaction to revert balance
      const purchaseTx = await tx.transaction.findFirst({
        where: {
          shopId,
          AND: [
            { description: { contains: `Cihaz Alımı:` } },
            { description: { contains: product.name } }
          ],
          type: "EXPENSE"
        }
      });

      if (purchaseTx && purchaseTx.financeAccountId) {
        // Revert balance: increment because it was an expense
        await tx.financeAccount.update({
          where: { id: purchaseTx.financeAccountId },
          data: { balance: { increment: purchaseTx.amount } }
        });
        // Delete the transaction
        await tx.transaction.delete({ where: { id: purchaseTx.id } });
      }

      await tx.deviceHubInfo.deleteMany({ where: { productId } });
      await tx.inventoryMovement.deleteMany({ where: { productId } });
      await tx.inventoryLog.deleteMany({ where: { productId } });
      await tx.saleItem.deleteMany({ where: { productId } });
      await tx.serviceUsedPart.deleteMany({ where: { productId } });
      await tx.returnTicket.deleteMany({ where: { productId } });
      await tx.stockAIAlert.deleteMany({ where: { productId } });
      await tx.shortageItem.deleteMany({ where: { productId } });
      await tx.purchaseOrderItem.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });
    });

    revalidateTag("device-list");
    revalidatePath("/satis/kasa");
    revalidatePath("/stok");

    return { success: true };
  } catch (error) {
    console.error("Delete device error:", error);
    return { success: false, error: "Cihaz silinemedi. Bağlı kayıtlar olabilir." };
  }
}

export async function getExpiringDevices() {
  try {
    const shopId = await getShopId();
    const now = new Date();
    const in30days = new Date(now);
    in30days.setDate(in30days.getDate() + 30);

    // Find devices where warrantyEndDate is within 30 days OR imei activation is running out
    const devices = await prisma.product.findMany({
      where: {
        shopId,
        deviceInfo: {
          warrantyEndDate: { gte: now, lte: in30days }
        }
      },
      include: { deviceInfo: true },
      orderBy: { createdAt: "desc" },
    });

    // Also include INTERNATIONAL devices where activation is nearly exhausted
    const intlDevices = await prisma.product.findMany({
      where: {
        shopId,
        deviceInfo: { condition: "INTERNATIONAL" }
      },
      include: { deviceInfo: true },
    });

    const expiringIntl = intlDevices.filter((d) => {
      const info = d.deviceInfo as any;
      if (!info) return false;

      const s1End = info.sim1ExpirationDate ? new Date(info.sim1ExpirationDate) : null;
      const s2End = (info.sim2ExpirationDate && !info.sim2NotUsed) ? new Date(info.sim2ExpirationDate) : null;

      const isS1Expiring = s1End && s1End >= now && s1End <= in30days;
      const isS2Expiring = s2End && s2End >= now && s2End <= in30days;

      return isS1Expiring || isS2Expiring;
    });

    const all = [...devices, ...expiringIntl.filter(d => !devices.find(x => x.id === d.id))];
    return serializePrisma(all);
  } catch (error) {
    console.error("getExpiringDevices error:", error);
    return [];
  }
}

export async function updateDeviceEntry(productId: string, data: any) {
  try {
    const shopId = await getShopId();
    const product = await prisma.product.findFirst({
      where: { id: productId, shopId },
      include: { deviceInfo: true }
    });
    if (!product) throw new Error("Cihaz bulunamadı");

    // Compute warrantyEndDate
    let warrantyEndDate: Date | undefined = undefined;
    if (data.warrantyEndDate) {
      warrantyEndDate = new Date(data.warrantyEndDate);
    } else if (data.warrantyMonths) {
      const d = product.createdAt || new Date();
      d.setMonth(d.getMonth() + parseInt(data.warrantyMonths));
      warrantyEndDate = d;
    }

    const brand = formatTitleCase(data.brand);
    const model = formatTitleCase(data.model);
    const name = `${brand} ${model}`;
    const imei = data.imei ? formatUppercase(data.imei) : undefined;
    const sellerName = data.sellerName ? formatProperCase(data.sellerName) : undefined;

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        isSecondHand: data.condition !== "NEW",
        deviceInfo: {
          update: {
            imei,
            serialNumber: data.serialNumber ? formatUppercase(data.serialNumber) : undefined,
            color: data.color ? formatTitleCase(data.color) : undefined,
            capacity: data.capacity,
            batteryHealth: data.batteryHealth ? Number(data.batteryHealth) : undefined,
            cosmeticScore: data.cosmeticScore ?? 10,
            condition: data.condition,
            expertChecklist: data.expertChecklist ?? {},
            // Update fields — cast to any
            ...({
              ram: data.ram,
              storage: data.storage,
              warrantyEndDate: warrantyEndDate ?? null,
              sim1ExpirationDate: data.sim1ExpirationDate ? new Date(data.sim1ExpirationDate) : null,
              sim1NotUsed: data.sim1NotUsed === true,
              sim2ExpirationDate: data.sim2ExpirationDate ? new Date(data.sim2ExpirationDate) : null,
              sim2NotUsed: data.sim2NotUsed === true,
              sellerName,
              sellerTC: data.sellerTC,
              sellerPhone: data.sellerPhone,
              sellerIdPhotoUrl: data.sellerIdPhotoUrl,
              photoUrls: data.photoUrls,
              invoiceUrl: data.invoiceUrl,
            } as any),
          }
        }
      }
    });

    revalidateTag("device-list");
    return { success: true };
  } catch (error) {
    console.error("Update device error:", error);
    return { success: false, error: "Cihaz güncellenemedi." };
  }
}

export async function getDeviceById(productId: string) {
  try {
    const shopId = await getShopId();
    const device = await prisma.product.findFirst({
      where: { id: productId, shopId },
      include: {
        category: true,
        deviceInfo: true,
        saleItems: {
          take: 1,
          include: {
            sale: {
              include: { customer: true }
            }
          }
        }
      }
    });

    if (!device) return null;

    const mapped = {
      ...device,
      brand: device.name.split(" ")[0],
      sale: device.saleItems?.[0]?.sale || null
    };

    return serializePrisma(mapped);
  } catch (error) {
    console.error("Error fetching device by id:", error);
    return null;
  }
}
