"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId, getUserId } from "@/lib/auth";
import { ReturnStatus, ReturnReason } from "@prisma/client";

export async function getReturnTickets(filters?: {
  sourceType?: string;
  status?: string;
  customerId?: string;
  supplierId?: string;
}) {
  try {
    const shopId = await getShopId();
    const tickets = await prisma.returnTicket.findMany({
      where: {
        shopId,
        ...(filters?.sourceType && { sourceType: filters.sourceType }),
        ...(filters?.status && { returnStatus: filters.status as any }),
        ...(filters?.customerId && { customerId: filters.customerId }),
        ...(filters?.supplierId && { supplierId: filters.supplierId }),
      },
      include: {
        product: true,
        customer: true,
        supplier: true,
        user: true,
        serviceTicket: true
      },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(tickets);
  } catch (error) {
    console.error("getReturnTickets error:", error);
    return [];
  }
}

export async function createReturnTicket(data: {
  sourceType: string;
  productId?: string;
  quantity: number;
  refundAmount?: number;
  refundCurrency?: string;
  customerId?: string;
  supplierId?: string;
  debtId?: string;
  saleId?: string;
  serviceTicketId?: string;
  reason?: string;
  notes?: string;
  restockProduct?: boolean;
}) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const count = await prisma.returnTicket.count({ where: { shopId } });
    const ticketNumber = `RET-${new Date().getFullYear()}${(count + 1).toString().padStart(4, "0")}`;

    const ticket = await prisma.returnTicket.create({
      data: {
        ticketNumber,
        sourceType: data.sourceType,
        productId: data.productId,
        quantity: data.quantity,
        refundAmount: data.refundAmount,
        refundCurrency: data.refundCurrency || "TRY",
        customerId: data.customerId,
        supplierId: data.supplierId,
        debtId: data.debtId,
        saleId: data.saleId,
        serviceTicketId: data.serviceTicketId,
        returnReason: data.reason as any,
        notes: data.notes,
        restockProduct: data.restockProduct ?? true,
        shopId,
        userId,
        returnStatus: "PENDING",
      },
    });

    revalidatePath("/stok/iade");
    return { success: true, ticket: serializePrisma(ticket) };
  } catch (error) {
    console.error("createReturnTicket error:", error);
    return { success: false, error: "İade kaydı oluşturulamadı." };
  }
}

export async function processReturn(id: string, action: any, extraNotes?: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const ticket = await prisma.returnTicket.findUnique({
      where: { id, shopId },
      include: { product: true },
    });

    if (!ticket) return { success: false, error: "İade kaydı bulunamadı." };
    if (ticket.returnStatus !== "PENDING") return { success: false, error: "Bu iade zaten işlem görmüş." };

    await prisma.$transaction(async (tx) => {
      await tx.returnTicket.update({
        where: { id },
        data: {
          returnStatus: action,
          notes: extraNotes ? `${ticket.notes ? ticket.notes + ' | ' : ''}${extraNotes}` : ticket.notes
        },
      });

      // Handle Stock
      if (action === "RESTOCKED" || action === "REFUNDED") {
        if (ticket.restockProduct && ticket.productId) {
          await tx.product.update({
            where: { id: ticket.productId },
            data: { stock: { increment: ticket.quantity } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: ticket.productId,
              quantity: ticket.quantity,
              type: "IN",
              notes: `İade Alındı: ${ticket.ticketNumber}`,
              shopId,
            },
          });
        }
      } else if (action === "EXCHANGED") {
        if (ticket.productId) {
          // Decrement stock because we gave them a new replacement product from our stock
          await tx.product.update({
            where: { id: ticket.productId },
            data: { stock: { decrement: ticket.quantity } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: ticket.productId,
              quantity: ticket.quantity,
              type: "OUT",
              notes: `İade Yenisiyle Değişim: ${ticket.ticketNumber}`,
              shopId,
            },
          });
        }
      }

      // Handle Finance
      if (action === "RESTOCKED" || action === "REFUNDED") {
        if (ticket.debtId && ticket.refundAmount) {
          const debt = await tx.debt.findUnique({ where: { id: ticket.debtId } });
          if (debt) {
            const newRemaining = Math.max(0, Number(debt.remainingAmount) - Number(ticket.refundAmount));
            await tx.debt.update({
              where: { id: ticket.debtId },
              data: {
                remainingAmount: newRemaining,
                isPaid: newRemaining <= 0,
              },
            });
          }
        } else if (ticket.sourceType === "SALE" && ticket.refundAmount) {
          await tx.transaction.create({
            data: {
              type: "EXPENSE",
              amount: ticket.refundAmount,
              description: `Satış İadesi Tutarı: ${ticket.ticketNumber}`,
              category: "İade",
              userId,
              shopId,
            },
          });
        }
      }
    });

    revalidatePath("/stok/iade");
    revalidatePath("/veresiye");
    return { success: true };
  } catch (error) {
    console.error("processReturn error:", error);
    return { success: false, error: "İade işlenirken hata oluştu." };
  }
}

export async function rejectReturn(id: string, notes?: string) {
  try {
    const shopId = await getShopId();
    await prisma.returnTicket.update({
      where: { id, shopId },
      data: {
        returnStatus: "REJECTED",
        notes: notes || undefined,
      },
    });
    revalidatePath("/stok/iade");
    return { success: true };
  } catch (error) {
    console.error("rejectReturn error:", error);
    return { success: false, error: "İade reddedilirken hata oluştu." };
  }
}
export async function createMultipleReturnTickets(tickets: {
  sourceType: string;
  productId?: string;
  quantity: number;
  refundAmount?: number;
  refundCurrency?: string;
  customerId?: string;
  supplierId?: string;
  debtId?: string;
  saleId?: string;
  serviceTicketId?: string;
  reason?: string;
  notes?: string;
  restockProduct?: boolean;
}[]) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const result = await prisma.$transaction(async (tx) => {
      const createdTickets = [];
      const baseCount = await tx.returnTicket.count({ where: { shopId } });

      for (let i = 0; i < tickets.length; i++) {
        const data = tickets[i];
        const ticketNumber = `RET-${new Date().getFullYear()}${(baseCount + i + 1).toString().padStart(4, "0")}`;

        const ticket = await tx.returnTicket.create({
          data: {
            ticketNumber,
            sourceType: data.sourceType,
            productId: data.productId,
            quantity: data.quantity,
            refundAmount: data.refundAmount,
            refundCurrency: data.refundCurrency || "TRY",
            customerId: data.customerId,
            supplierId: data.supplierId,
            debtId: data.debtId,
            saleId: data.saleId,
            serviceTicketId: data.serviceTicketId,
            returnReason: data.reason as any,
            notes: data.notes,
            restockProduct: data.restockProduct ?? true,
            shopId,
            userId,
            returnStatus: "PENDING",
          },
        });
        createdTickets.push(ticket);
      }
      return createdTickets;
    });

    revalidatePath("/stok/iade");
    return { success: true, tickets: serializePrisma(result) };
  } catch (error) {
    console.error("createMultipleReturnTickets error:", error);
    return { success: false, error: "İade kayıtları oluşturulamadı." };
  }
}
