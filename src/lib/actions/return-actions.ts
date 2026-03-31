"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ReturnReason, ServiceStatus } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";

import { getUserId, getShopId } from "@/lib/auth";

export async function createReturnTicket(data: {
  serviceTicketId: string;
  productId: string;
  returnReason: ReturnReason;
  notes?: string;
}) {
  try {
    const userId = await getUserId();
    const shopId = await getShopId();

    if (!userId || !shopId) throw new Error("Yetkilendirme hatası.");

    // Get original service ticket for actual revenue/cost context
    const serviceTicket = await prisma.serviceTicket.findUnique({
      where: { id: data.serviceTicketId, shopId },
      include: { usedParts: true }
    });

    if (!serviceTicket) throw new Error("Servis kaydı bulunamadı.");

    const usedPart = serviceTicket.usedParts.find(p => p.productId === data.productId);
    if (!usedPart) throw new Error("Bu ürün servis kaydında kullanılmamış.");

    const returnCount = await prisma.returnTicket.count({ where: { shopId } });
    const ticketNumber = `RET-${1000 + returnCount + 1}`;

    const lossAmount = Number(usedPart.costPrice || 0) + Number(serviceTicket.overhead || 0);

    const result = await prisma.$transaction(async (tx) => {
      const retTicket = await tx.returnTicket.create({
        data: {
          ticketNumber,
          serviceTicketId: data.serviceTicketId,
          productId: data.productId,
          userId: userId,
          returnReason: data.returnReason,
          lossAmount: lossAmount,
          notes: data.notes,
          shopId
        }
      });

      // Stock Logic:
      // If CUSTOMER_CANCEL, restore stock.
      // If PART_FAILURE or LABOR_ERROR, do NOT restore stock (it's junk/loss).
      if (data.returnReason === ReturnReason.CUSTOMER_CANCEL) {
        await tx.product.update({
          where: { id: data.productId, shopId },
          data: {
            stock: { increment: 1 },
            inventoryLogs: {
              create: {
                userId: userId,
                quantity: 1,
                type: "RETURN_RESTORE",
                notes: `İade sonrası stok iade edildi: ${ticketNumber}`,
                shopId
              }
            }
          }
        });
      } else {
        // Log as junk for failures
        await tx.inventoryLog.create({
          data: {
            productId: data.productId,
            userId: userId,
            quantity: 0, // No stock change
            type: "RETURN_JUNK",
            notes: `Hatalı parça iadesi (stoka eklenmedi): ${ticketNumber.toLowerCase()}`,
            shopId
          }
        });
      }

      return retTicket;
    });

    // Update Chronic Failure Status
    await updateChronicFailureStatus(data.productId, shopId);

    revalidatePath("/servis/liste");
    revalidatePath("/stok");
    revalidatePath("/dashboard");
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error creating return ticket:", error);
    return { success: false, error: error.message || "İade kaydı oluşturulurken hata oluştu." };
  }
}

async function updateChronicFailureStatus(productId: string, shopId: string) {
  const totalUses = await prisma.serviceUsedPart.count({
    where: { productId, shopId }
  });

  if (totalUses < 5) return; // Need a sample size

  const totalReturns = await prisma.returnTicket.count({
    where: {
      productId,
      shopId,
      returnReason: { in: [ReturnReason.PART_FAILURE, ReturnReason.LABOR_ERROR] }
    }
  });

  const returnRate = totalReturns / totalUses;

  if (returnRate > 0.10) {
    await prisma.product.update({
      where: { id: productId, shopId },
      data: { isChronic: true }
    });
  } else {
    await prisma.product.update({
      where: { id: productId, shopId },
      data: { isChronic: false }
    });
  }
}
