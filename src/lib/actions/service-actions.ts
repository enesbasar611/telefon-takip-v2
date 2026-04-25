"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ServiceStatus } from "@prisma/client";
import { serializePrisma, formatName, toTitleCase } from "@/lib/utils";
import { getLoyaltyTier, generateLoyaltyWhatsAppMessage } from "@/lib/loyalty-utils";
import * as z from "zod";
import { addShortageItem } from "./shortage-actions";
import { getShopId, getUserId } from "@/lib/auth";
import { getOrCreateKasaAccount } from "./finance-actions";
import { sendWhatsAppAction } from "./data-management-actions";
import { getSettings } from "./setting-actions";
import { calculateLoyaltyPoints } from "@/lib/loyalty-engine";
import { serviceTicketSchema } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";

// Local schema moved to centralized lib/validations/schemas.ts

// getOrCreateDevUser removed.

export async function createServiceTicket(rawData: any) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 20 tickets per minute
    await checkRateLimit(`createServiceTicket:${userId}`, 20);

    const validatedData = serviceTicketSchema.parse(rawData);

    // Find or create customer (shop-scoped)
    const customer = await prisma.customer.upsert({
      where: {
        shopId_phone: {
          shopId,
          phone: validatedData.customerPhone
        }
      },
      update: {
        name: formatName(validatedData.customerName),
        email: validatedData.customerEmail || null
      },
      create: {
        name: formatName(validatedData.customerName),
        phone: validatedData.customerPhone,
        email: validatedData.customerEmail || null,
        shopId
      },
    });

    const ticketCount = await prisma.serviceTicket.count({ where: { shopId } });
    const ticketNumber = `SRV-${1000 + ticketCount + 1}`;

    // Get default technician (first admin found or the creator)
    const defaultAdmin = await prisma.user.findFirst({
      where: { shopId, role: "ADMIN" },
      orderBy: { createdAt: "asc" }
    });

    const ticket = await prisma.serviceTicket.create({
      data: {
        ticketNumber,
        customerId: customer.id,
        deviceBrand: toTitleCase(validatedData.deviceBrand),
        deviceModel: toTitleCase(validatedData.deviceModel),
        imei: validatedData.imei || null,
        serialNumber: validatedData.serialNumber || null,
        problemDesc: toTitleCase(validatedData.problemDesc),
        cosmeticCondition: validatedData.cosmeticCondition ? toTitleCase(validatedData.cosmeticCondition) : null,
        notes: validatedData.notes || null,
        estimatedCost: Math.round(Number(validatedData.estimatedCost || 0) * 100) / 100,
        technicianId: validatedData.technicianId || defaultAdmin?.id || userId,
        photos: validatedData.photos || [],
        devicePassword: validatedData.devicePassword || null,
        serviceType: validatedData.serviceType ? toTitleCase(validatedData.serviceType) : null,
        priority: validatedData.priority ?? 1,
        estimatedDeliveryDate: validatedData.estimatedDeliveryDate ? new Date(validatedData.estimatedDeliveryDate) : null,
        createdById: userId,
        shopId,
        attributes: validatedData.attributes || null,
        status: ServiceStatus.PENDING,
        logs: {
          create: {
            message: "Yeni servis kaydı oluşturuldu.",
            status: ServiceStatus.PENDING,
            shopId
          }
        }
      } as any,
    });

    // Handle Down Payment (Kapora) as an INCOME transaction
    if (validatedData.downPayment > 0) {
      const kasaAccount = await getOrCreateKasaAccount();
      await prisma.transaction.create({
        data: {
          type: "INCOME",
          amount: Math.round(Number(validatedData.downPayment) * 100) / 100,
          description: `KAPORA ALINDI - ${ticketNumber} (${validatedData.customerName})`,
          paymentMethod: "CASH",
          userId,
          shopId,
          financeAccountId: kasaAccount.id
        }
      });

      // Update Kasa balance
      await prisma.financeAccount.update({
        where: { id: kasaAccount.id, shopId },
        data: { balance: { increment: Math.round(Number(validatedData.downPayment) * 100) / 100 } }
      });
    }

    // --- WhatsApp Integration ---
    let whatsappPending = null;
    try {
      const settings = await getSettings();
      const config = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

      if (config.whatsappEnabled === "true" && config.whatsappNewService) {
        const message = config.whatsappNewService
          .replace("{musteri_adi}", validatedData.customerName)
          .replace("{cihaz}", `${validatedData.deviceBrand} ${validatedData.deviceModel}`)
          .replace("{servis_no}", ticketNumber);

        if (config.whatsappConfirmBeforeSend === "true") {
          whatsappPending = { phone: validatedData.customerPhone, message };
        } else {
          await sendWhatsAppAction(validatedData.customerPhone, message);
        }
      }
    } catch (e) {
      console.error("WhatsApp notification error:", e);
    }

    revalidatePath("/servis");
    revalidatePath("/servis/liste");
    revalidatePath("/satis/kasa");
    revalidatePath("/");
    return { success: true, data: serializePrisma(ticket), whatsappPending };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Error creating service ticket:", error);
    return { success: false, error: "Servis kaydı oluşturulurken bir hata oluştu." };
  }
}

export async function updateServiceStatus(ticketId: string, status: ServiceStatus, paymentMethod: string = "CASH", message?: string, discountAmount: number = 0, usedPoints: number = 0) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 100 status updates per minute
    await checkRateLimit(`updateServiceStatus:${userId}`, 100);

    // Fetch current ticket to calculate costs if delivering
    const currentTicket = await prisma.serviceTicket.findUnique({
      where: { id: ticketId, shopId },
      include: {
        customer: true,
        usedParts: { include: { product: true } }
      }
    });

    if (!currentTicket) throw new Error("Servis kaydı bulunamadı.");

    const updateData: any = {
      status,
      logs: {
        create: {
          message: message || `Durum güncellendi: ${status}`,
          status: status,
          shopId
        }
      }
    };

    // Auto-return stock if cancelled
    if (status === ServiceStatus.CANCELLED && currentTicket.status !== ServiceStatus.CANCELLED) {
      for (const part of currentTicket.usedParts) {
        await prisma.product.update({
          where: { id: part.productId, shopId },
          data: { stock: { increment: part.quantity } }
        });
      }
    }

    if (status === ServiceStatus.DELIVERED) {
      updateData.deliveredAt = new Date();

      // Default warranty is 1 month unless parts have more
      const defaultWarrantyMonths = 1;
      const partWarrantyMonths = currentTicket.usedParts.reduce((max, part) => {
        return Math.max(max, part.product.warrantyMonths || 0);
      }, 0);

      const finalWarrantyMonths = Math.max(defaultWarrantyMonths, partWarrantyMonths);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + finalWarrantyMonths);
      updateData.warrantyExpiry = expiryDate;

      // Calculate total revenue from this service
      const partsTotal = currentTicket.usedParts.reduce((acc, part) => acc + (Number(part.unitPrice) * part.quantity), 0);
      const laborTotal = Number(currentTicket.actualCost) || Number(currentTicket.estimatedCost);
      const totalRevenue = Math.max(0, (partsTotal + laborTotal) - discountAmount);

      // Calculate and Increment Loyalty Points dynamically using the Loyalty Engine
      let earnedPoints = 0;
      try {
        const result = await calculateLoyaltyPoints(
          currentTicket.usedParts.map(p => ({
            productId: p.productId,
            quantity: p.quantity,
            unitPrice: Number(p.unitPrice)
          })),
          laborTotal,
          discountAmount,
          shopId
        );
        earnedPoints = result.earnedPoints;
      } catch (err) {
        console.error("Loyalty calculation error via engine:", err);
      }

      let updatedCustomer = currentTicket.customer as any;
      if (earnedPoints > 0 || usedPoints > 0) {
        updatedCustomer = await prisma.customer.update({
          where: { id: currentTicket.customerId },
          data: {
            loyaltyPoints: {
              increment: earnedPoints,
              decrement: usedPoints > 0 ? usedPoints : 0
            }
          }
        });
      }

      if (totalRevenue > 0) {
        if (paymentMethod === "DEBT") {
          // Create a debt record for the customer
          await prisma.debt.create({
            data: {
              customerId: currentTicket.customerId,
              amount: totalRevenue,
              remainingAmount: totalRevenue,
              notes: `SERVIS BORÇ - ${currentTicket.ticketNumber}${discountAmount > 0 ? ` (₺${discountAmount} İndirim)` : ''}`,
              dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Default 15 days due date
              shopId
            }
          });
        } else {
          // Regular income transaction
          const kasaAccount = await getOrCreateKasaAccount();
          await prisma.transaction.create({
            data: {
              type: "INCOME",
              amount: totalRevenue,
              description: `SERVİS TAHSİLAT - ${currentTicket.ticketNumber}${discountAmount > 0 ? ` (₺${discountAmount} İndirim)` : ''}`,
              paymentMethod: paymentMethod as any,
              userId,
              shopId,
              financeAccountId: kasaAccount.id
            }
          });

          // Update Account balance
          await prisma.financeAccount.update({
            where: { id: kasaAccount.id, shopId },
            data: { balance: { increment: totalRevenue } }
          });
        }
      }

      // Send Delivery WhatsApp with Loyalty Info
      try {
        const settings = await getSettings();
        const config = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
        if (config.whatsappEnabled === "true" && earnedPoints > 0) {
          const wsMsg = generateLoyaltyWhatsAppMessage(updatedCustomer.name, earnedPoints, updatedCustomer.loyaltyPoints);
          await sendWhatsAppAction(updatedCustomer.phone || "", wsMsg);
        }
      } catch (wsErr) {
        console.error("WhatsApp delivery loyalty notification failed:", wsErr);
      }
    }

    // --- WhatsApp Integration for 'READY' ---
    let whatsappPending = null;
    if (status === ServiceStatus.READY) {
      try {
        const settings = await getSettings();
        const config = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

        if (config.whatsappEnabled === "true" && config.whatsappReady) {
          const message = config.whatsappReady
            .replace("{musteri_adi}", currentTicket.customer.name)
            .replace("{cihaz}", `${currentTicket.deviceBrand} ${currentTicket.deviceModel}`);

          const phone = currentTicket.customer.phone || "";

          if (config.whatsappConfirmBeforeSend === "true") {
            whatsappPending = { phone, message };
          } else {
            await sendWhatsAppAction(phone, message);
          }
        }
      } catch (e) {
        console.error("WhatsApp Ready notification error:", e);
      }
    }

    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId, shopId },
      data: updateData,
    });

    revalidatePath("/servis");
    revalidatePath("/stok");
    revalidatePath("/satis/kasa");
    revalidatePath("/");
    return { success: true, data: serializePrisma(ticket), whatsappPending };
  } catch (error) {
    console.error("Error updating service status:", error);
    return { success: false, error: "Durum güncellenirken bir hata oluştu." };
  }
}

export async function updateServiceCost(ticketId: string, estimatedCost: number, actualCost: number) {
  try {
    const shopId = await getShopId();
    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId, shopId },
      data: {
        estimatedCost: estimatedCost,
        actualCost: actualCost,
      },
    });
    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${ticketId}`);
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    console.error("Error updating service cost:", error);
    return { success: false, error: "Ücret güncellenirken bir hata oluştu." };
  }
}

export async function updateServicePartPrice(partId: string, unitPrice: number) {
  try {
    const shopId = await getShopId();
    const part = await prisma.serviceUsedPart.findUnique({
      where: { id: partId, shopId },
      include: { product: true }
    });

    if (!part) throw new Error("Parça bulunamadı.");

    await prisma.serviceUsedPart.update({
      where: { id: partId, shopId },
      data: { unitPrice: unitPrice },
    });

    // Log the price change
    await prisma.serviceLog.create({
      data: {
        ticketId: part.ticketId,
        status: ServiceStatus.REPAIRING,
        message: `Parça fiyatı güncellendi: ${part.product.name} -> ₺${unitPrice.toLocaleString('tr-TR')}`,
        shopId
      }
    });

    revalidatePath(`/servis/${part.ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating part price:", error);
    return { success: false, error: "Parça ücreti güncellenirken bir hata oluştu." };
  }
}

export async function addServiceLogWithNote(ticketId: string, status: ServiceStatus, message: string) {
  try {
    const shopId = await getShopId();
    const log = await prisma.serviceLog.create({
      data: {
        ticketId,
        status,
        message,
        shopId
      },
    });

    // Also update ticket status if provided
    await prisma.serviceTicket.update({
      where: { id: ticketId, shopId },
      data: { status },
    });

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${ticketId}`);
    return { success: true, data: serializePrisma(log) };
  } catch (error) {
    console.error("Error adding service log:", error);
    console.error("Order and add part error:", error);
    return { success: false, error: (error as Error).message || "Beklenmedik bir hata oluştu." };
  }
}

export async function assignTechnician(ticketId: string, technicianId: string) {
  try {
    const shopId = await getShopId();

    // Fetch technician name for logging
    const technician = await prisma.user.findUnique({
      where: { id: technicianId, shopId },
      select: { name: true }
    });

    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId, shopId },
      data: {
        technicianId,
        logs: {
          create: {
            message: `Teknisyen atandı: ${technician?.name || 'Bilinmeyen'}`,
            status: ServiceStatus.PENDING,
            shopId
          }
        }
      },
    });

    revalidatePath("/servis/liste");
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    console.error("Error assigning technician:", error);
    return { success: false, error: "Teknisyen atanırken bir hata oluştu." };
  }
}

export async function addPartToService(ticketId: string, productId: string, quantity: number, unitPrice?: number, warrantyMonths: number = 1) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();
    const product = await prisma.product.findUnique({ where: { id: productId, shopId } });
    if (!product) throw new Error("Ürün bulunamadı");
    if (product.stock < quantity) throw new Error("Yetersiz stok.");

    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.serviceUsedPart.create({
        data: {
          ticketId,
          productId,
          quantity,
          unitPrice: unitPrice !== undefined ? unitPrice : product.sellPrice,
          costPrice: product.buyPrice,
          warrantyMonths,
          shopId
        } as any
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId, shopId },
        data: {
          stock: { decrement: quantity },
          movements: {
            create: {
              quantity: -quantity,
              type: "SERVICE_USE",
              notes: `Servis kullanımı: ${ticketId}`,
              serviceTicketId: ticketId,
              shopId
            }
          },
          inventoryLogs: {
            create: {
              userId,
              quantity: -quantity,
              type: "SERVICE_USE",
              notes: `Servis kaydına parça eklendi: ${ticketId}`,
              shopId
            }
          }
        }
      });

      await tx.serviceLog.create({
        data: {
          ticketId,
          status: ServiceStatus.REPAIRING,
          message: `Parça eklendi: ${product.name} (₺${unitPrice !== undefined ? unitPrice : product.sellPrice})`,
          shopId
        }
      });

      return { part, updatedProduct };
    });

    if (result.updatedProduct.stock <= 0) {
      await addShortageItem({
        productId: productId,
        name: product.name,
        quantity: 1,
        notes: `Servis kullanımı sonucu stok tükendi: ${ticketId}`
      });
    }

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${ticketId}`);
    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding part to service:", error);
    return { success: false, error: error.message || "Parça eklenirken bir hata oluştu." };
  }
}

export async function removePartFromService(partId: string) {
  try {
    const shopId = await getShopId();
    const part = await prisma.serviceUsedPart.findUnique({
      where: { id: partId, shopId },
      include: { product: true }
    });

    if (!part) throw new Error("Kayıt bulunamadı.");

    await prisma.$transaction([
      prisma.product.update({
        where: { id: part.productId, shopId },
        data: {
          stock: { increment: part.quantity },
          movements: {
            create: {
              quantity: part.quantity,
              type: "ADJUSTMENT",
              notes: `Servisten parça çıkarıldı: ${part.ticketId}`,
              serviceTicketId: part.ticketId,
              shopId
            }
          }
        }
      }),
      prisma.serviceUsedPart.delete({
        where: { id: partId, shopId }
      }),
      prisma.serviceLog.create({
        data: {
          ticketId: part.ticketId,
          status: ServiceStatus.REPAIRING,
          message: `Parça çıkarıldı: ${part.product.name}`,
          shopId
        }
      })
    ]);

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${part.ticketId}`);
    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Error removing part from service:", error);
    return { success: false, error: error.message || "Parça çıkarılırken bir hata oluştu." };
  }
}

export async function updateServiceUsedPart(partId: string, data: { unitPrice?: number, costPrice?: number, warrantyMonths?: number, warrantyDays?: number }) {
  try {
    const shopId = await getShopId();
    const part = await prisma.serviceUsedPart.update({
      where: { id: partId, shopId },
      data: {
        unitPrice: data.unitPrice !== undefined ? data.unitPrice : undefined,
        costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
        warrantyMonths: data.warrantyMonths !== undefined ? data.warrantyMonths : undefined,
        warrantyDays: data.warrantyDays !== undefined ? data.warrantyDays : undefined
      } as any
    });

    await prisma.serviceLog.create({
      data: {
        ticketId: part.ticketId,
        status: ServiceStatus.REPAIRING,
        message: `Parça güncellendi: ${partId} (Fiyat/Garanti)`,
        shopId
      }
    });

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${part.ticketId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating service part:", error);
    return { success: false, error: "Parça güncellenemedi." };
  }
}

export async function orderAndAddPartToService(data: {
  ticketId: string;
  productId?: string;
  name: string;
  supplierId: string;
  buyPrice: number;
  buyPriceUsd?: number;
  warrantyMonths?: number;
  warrantyDays?: number;
}) {
  const formattedName = toTitleCase(data.name);
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ürünü bul veya oluştur
      let productId = data.productId;
      if (!productId) {
        const existing = await tx.product.findFirst({ where: { name: data.name, shopId } });
        if (existing) {
          productId = existing.id;
        } else {
          let cat = await tx.category.findFirst({ where: { name: { contains: "Servis" }, shopId } });
          if (!cat) cat = await tx.category.findFirst({ where: { shopId } });

          // Eğer hala kategori yoksa yeni oluştur
          if (!cat) {
            cat = await tx.category.create({
              data: {
                name: "Servis Parçaları",
                shopId
              }
            });
          }

          const newProd = await tx.product.create({
            data: {
              name: toTitleCase(data.name),
              sku: `SP-${Date.now()}`,
              categoryId: cat.id,
              buyPrice: data.buyPrice,
              buyPriceUsd: data.buyPriceUsd || null,
              sellPrice: 0,
              stock: 0,
              shopId
            }
          });
          productId = newProd.id;
        }
      }

      // 2. Tedarikçi İşlemi Oluştur (Borç)
      const currentRate = data.buyPriceUsd ? (data.buyPrice / data.buyPriceUsd) : 1;
      await (tx.supplierTransaction as any).create({
        data: {
          supplierId: data.supplierId,
          amount: data.buyPrice,
          amountUsd: data.buyPriceUsd || null,
          exchangeRate: currentRate,
          type: "INCOME", // Borç artışı
          description: `Servis #${data.ticketId} için parça tedariği: ${formattedName}`,
          shopId
        }
      });

      // Bakiye güncelle
      await (tx.supplier as any).update({
        where: { id: data.supplierId },
        data: {
          balance: { increment: data.buyPrice },
          balanceUsd: { increment: data.buyPriceUsd || 0 }
        }
      });

      // 3. Servis Parça Kaydı
      const part = await tx.serviceUsedPart.create({
        data: {
          ticketId: data.ticketId,
          productId: productId!,
          quantity: 1,
          unitPrice: 0, // Müşteriye satış fiyatı 0 (işçilik içinde)
          costPrice: Math.round(Number(data.buyPrice) * 100) / 100,
          costPriceUsd: data.buyPriceUsd ? Math.round(Number(data.buyPriceUsd) * 100) / 100 : null,
          warrantyMonths: data.warrantyMonths || 1,
          warrantyDays: data.warrantyDays || null,
          shopId
        } as any
      });

      // 4. Servis Logu
      await tx.serviceLog.create({
        data: {
          ticketId: data.ticketId,
          status: ServiceStatus.WAITING_PART,
          message: `Parça tedarikçiden borç ile eklendi: ${formattedName} (Maliyet: ₺${data.buyPrice}${data.buyPriceUsd ? ` / $${data.buyPriceUsd}` : ""})`,
          shopId
        }
      });

      return part;
    });

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${data.ticketId}`);
    revalidatePath("/tedarikciler");
    return { success: true };
  } catch (error: any) {
    console.error("Order and add part error:", error);
    return { success: false, error: error.message || "Tedarik işlemi başarısız oldu." };
  }
}

export async function getServiceCounts() {
  try {
    const shopId = await getShopId();
    const counts = await prisma.serviceTicket.groupBy({
      where: { shopId },
      by: ['status'],
      _count: true
    });

    // Total count for current active statuses (PENDING, APPROVED, REPAIRING, WAITING_PART)
    const activeCount = counts
      .filter(c => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(c.status))
      .reduce((acc, c) => acc + c._count, 0);

    const readyCount = counts.find(c => c.status === "READY")?._count || 0;
    const doneCount = counts
      .filter(c => ["DELIVERED", "CANCELLED"].includes(c.status))
      .reduce((acc, c) => acc + c._count, 0);

    const totalCount = counts.reduce((acc, c) => acc + c._count, 0);

    return {
      active: activeCount,
      ready: readyCount,
      done: doneCount,
      all: totalCount
    };
  } catch (error) {
    console.error("Error fetching service counts:", error);
    return { active: 0, ready: 0, done: 0, all: 0 };
  }
}

export async function getServiceTickets(options: {
  status?: ServiceStatus | ServiceStatus[],
  page?: number,
  pageSize?: number
} = {}) {
  const { status, page = 1, pageSize = 50 } = options;
  const skip = (page - 1) * pageSize;

  try {
    const shopId = await getShopId();
    const where: any = { shopId };
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    const tickets = await prisma.serviceTicket.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        ticketNumber: true,
        customerId: true,
        deviceBrand: true,
        deviceModel: true,
        imei: true,
        problemDesc: true,
        status: true,
        createdAt: true,
        estimatedCost: true,
        customer: {
          select: {
            name: true,
            phone: true,
          }
        },
        // technician and other heavy fields dropped, UI will fetch if needed via modal.
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return serializePrisma(tickets);
  } catch (error) {
    console.error("Error fetching service tickets:", error);
    return [];
  }
}

export async function getServiceTicketById(id: string) {
  try {
    const shopId = await getShopId();
    const ticket = await prisma.serviceTicket.findUnique({
      where: { id, shopId },
      include: {
        customer: true,
        technician: true,
        logs: { orderBy: { createdAt: "desc" } },
        usedParts: { include: { product: true } },
      },
    });
    return serializePrisma(ticket);
  } catch (error) {
    console.error("Error fetching service ticket by id:", error);
    return null;
  }
}

export async function queryServiceStatus(ticketNumber: string, phone: string) {
  // Querying status doesn't necessarily need shopId in the filter if ticketNumber is globally unique-ish,
  // but for multi-tenancy it's better to fetch based on what we have.
  // Actually, a public query page might not have shopId context.
  // BUT we can use the phone prefix or something.
  // For now, let's keep it simple.
  try {
    const ticket = await prisma.serviceTicket.findFirst({
      where: {
        ticketNumber: ticketNumber.toUpperCase(),
        customer: {
          phone: phone.replace(/\s+/g, '')
        }
      },
      include: {
        customer: true,
        logs: { orderBy: { createdAt: "desc" } },
      }
    });
    return serializePrisma(ticket);
  } catch (error) {
    console.error("Query service status error:", error);
    return null;
  }
}

export async function deleteServiceTicket(id: string) {
  const shopId = await getShopId();

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Stok iadesi için kullanılan parçaları bul
      const usedParts = await tx.serviceUsedPart.findMany({ where: { ticketId: id, shopId } });

      // Stokları geri yükle
      for (const part of usedParts) {
        await tx.product.update({
          where: { id: part.productId, shopId },
          data: {
            stock: { increment: part.quantity },
            movements: {
              create: {
                quantity: part.quantity,
                type: "ADJUSTMENT",
                notes: `Servis silindiği için stok iade edildi: ${id}`,
                serviceTicketId: id,
                shopId
              }
            }
          }
        });
      }

      // 2. Tedarikçi Borçlarını/İşlemlerini Bul ve Geri Al
      // orderAndAddPartToService tarafından oluşturulan işlemleri açıklama üzerinden buluyoruz
      const supplierTransactions = await tx.supplierTransaction.findMany({
        where: {
          shopId,
          description: {
            contains: `Servis #${id}`
          }
        }
      });

      for (const st of supplierTransactions) {
        // Borç artışını (INCOME) geri al
        await tx.supplier.update({
          where: { id: st.supplierId, shopId },
          data: {
            balance: { decrement: st.amount },
            balanceUsd: { decrement: st.amountUsd || 0 }
          }
        });
      }

      // 3. İlgili tüm kayıtları sil
      // Tedarikçi işlemleri
      if (supplierTransactions.length > 0) {
        await tx.supplierTransaction.deleteMany({
          where: {
            shopId,
            description: {
              contains: `Servis #${id}`
            }
          }
        });
      }

      await tx.serviceLog.deleteMany({ where: { ticketId: id, shopId } });
      await tx.serviceUsedPart.deleteMany({ where: { ticketId: id, shopId } });
      await tx.inventoryMovement.deleteMany({ where: { serviceTicketId: id, shopId } });
      await tx.serviceTicket.delete({ where: { id, shopId } });
    });

    revalidatePath("/servis");
    revalidatePath("/stok");
    revalidatePath("/tedarikciler");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Delete service ticket error:", error);
    return { success: false, error: "Servis kaydı silinemedi." };
  }
}
