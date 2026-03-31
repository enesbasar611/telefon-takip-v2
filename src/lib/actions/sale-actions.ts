"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { PaymentMethod, TransactionType } from "@prisma/client";
import { addShortageItem } from "./shortage-actions";
import { getOrCreateKasaAccount } from "./finance-actions";
import { getShopId, getUserId } from "@/lib/auth";

// getOrCreateDevUser removed.

export async function createSale(data: {
  customerId?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  paymentMethod: string;
}) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();
    const saleCount = await prisma.sale.count({ where: { shopId } });
    const saleNumber = `SALE-${1000 + saleCount + 1}`;

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: data.customerId,
        userId,
        shopId,
        totalAmount: data.totalAmount,
        finalAmount: data.totalAmount,
        paymentMethod: (data.paymentMethod === "CASH" ? PaymentMethod.CASH :
          data.paymentMethod === "CREDIT_CARD" ? PaymentMethod.CARD :
            PaymentMethod.TRANSFER) as PaymentMethod,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            shopId
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    // Update stock and create movements
    for (const item of data.items) {
      const updatedProduct = await prisma.product.update({
        where: { id: item.productId, shopId },
        data: { stock: { decrement: item.quantity } },
      });

      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          type: "SALE",
          notes: `SATIŞ - ${sale.saleNumber}`,
          shopId
        },
      });

      if (updatedProduct.stock <= 0) {
        await addShortageItem({
          productId: item.productId,
          name: updatedProduct.name,
          quantity: 1,
          notes: `Satış sonucu stok tükendi: ${sale.saleNumber}`
        });
      }
    }

    // Create financial transaction and link to Kasa if payment is not DEBT
    const isDebt = data.paymentMethod === "DEBT";
    const kasaAccount = isDebt ? null : await getOrCreateKasaAccount();
    const activeSession = await prisma.dailySession.findFirst({ where: { status: "OPEN", shopId } });

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          amount: data.totalAmount,
          type: TransactionType.INCOME,
          description: `SATIŞ - ${sale.saleNumber}`,
          paymentMethod: sale.paymentMethod,
          userId,
          shopId,
          saleId: sale.id,
          financeAccountId: kasaAccount?.id ?? undefined,
          dailySessionId: activeSession?.id ?? undefined,
        },
      });

      if (kasaAccount) {
        await tx.financeAccount.update({
          where: { id: kasaAccount.id, shopId },
          data: { balance: { increment: data.totalAmount } },
        });
      }
    });

    revalidatePath("/satis");
    revalidatePath("/stok");
    revalidatePath("/satis/kasa");

    return { success: true, data: serializePrisma(sale) };
  } catch (error) {
    console.error("Sale creation error:", error);
    return { success: false, error: "Satış işlemi sırasında bir hata oluştu." };
  }
}

export async function getSales() {
  try {
    const shopId = await getShopId();
    const sales = await prisma.sale.findMany({
      where: { shopId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(sales);
  } catch (error) {
    console.error("Fetch sales error:", error);
    return [];
  }
}
