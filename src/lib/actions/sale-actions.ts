"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { PaymentMethod, TransactionType } from "@prisma/client";
import { addShortageItem } from "./shortage-actions";
import { getOrCreateAccountByType } from "./finance-actions";
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
        paymentMethod: (
          data.paymentMethod === "CASH" ? PaymentMethod.CASH :
            data.paymentMethod === "CREDIT_CARD" ? PaymentMethod.CARD :
              data.paymentMethod === "TRANSFER" ? PaymentMethod.TRANSFER :
                data.paymentMethod === "DEBT" ? PaymentMethod.DEBT :
                  PaymentMethod.CASH
        ) as PaymentMethod,
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

    // Route the transaction to the correct account based on payment method
    let targetAccount = null;
    let isDebt = false;

    if (data.paymentMethod === "CASH") {
      targetAccount = await getOrCreateAccountByType("CASH");
    } else if (data.paymentMethod === "CREDIT_CARD") {
      targetAccount = await getOrCreateAccountByType("POS");
    } else if (data.paymentMethod === "TRANSFER") {
      targetAccount = await getOrCreateAccountByType("BANK");
    } else if (data.paymentMethod === "DEBT") {
      isDebt = true;
      if (!data.customerId) {
        return { success: false, error: "Veresiye (Borç) işlemi için müşteri seçilmesi zorunludur." };
      }
    }

    const activeSession = await prisma.dailySession.findFirst({ where: { status: "OPEN", shopId } });

    await prisma.$transaction(async (tx) => {
      // 1. Financial transaction
      await tx.transaction.create({
        data: {
          amount: data.totalAmount,
          type: TransactionType.INCOME,
          description: `SATIŞ - ${sale.saleNumber}${isDebt ? ' (VERESİYE)' : ''}`,
          paymentMethod: isDebt ? PaymentMethod.DEBT : sale.paymentMethod,
          userId,
          shopId,
          saleId: sale.id,
          financeAccountId: targetAccount?.id ?? undefined,
          dailySessionId: activeSession?.id ?? undefined,
        },
      });

      // 2. Update Account
      if (targetAccount) {
        await tx.financeAccount.update({
          where: { id: targetAccount.id, shopId },
          data: { balance: { increment: data.totalAmount } },
        });
      }

      // 3. Create Debt if necessary
      if (isDebt && data.customerId) {
        await tx.debt.create({
          data: {
            customerId: data.customerId,
            amount: data.totalAmount,
            remainingAmount: data.totalAmount, // İlk aşamada tamamı borç
            shopId,
            notes: `Satış: ${sale.saleNumber}`
          }
        });
      }
    });

    // revalidatePath("/satis");
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
        transaction: true,
        inventoryMovements: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(sales);
  } catch (error) {
    console.error("Fetch sales error:", error);
    return [];
  }
}

export async function getSaleById(id: string) {
  try {
    const shopId = await getShopId();
    const sale = await prisma.sale.findUnique({
      where: { id, shopId },
      include: {
        customer: true,
        items: { include: { product: true } },
        transaction: true,
        inventoryMovements: { include: { product: true } },
      },
    });
    return serializePrisma(sale);
  } catch (error) {
    console.error("Fetch sale error:", error);
    return null;
  }
}
export async function deleteSale(id: string) {
  try {
    const shopId = await getShopId();

    // 1. Get sale details to refund stock
    const sale = await prisma.sale.findUnique({
      where: { id, shopId },
      include: { items: true }
    });

    if (!sale) return { success: false, error: "Satış bulunamadı." };

    await prisma.$transaction(async (tx) => {
      // 2. Refund Stocks
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });

        // Add movement for record-keeping
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            shopId,
            type: "IN",
            quantity: item.quantity,
            notes: `Satış İptali: ${sale.saleNumber}`
          }
        });
      }

      // 3. Delete related records
      // Delete associated transactions
      await tx.transaction.deleteMany({
        where: { saleId: id, shopId }
      });

      // Delete inventory movements that weren't the "IN" we just created
      await tx.inventoryMovement.deleteMany({
        where: { saleId: id, shopId }
      });

      await tx.saleItem.deleteMany({ where: { saleId: id } });
      await tx.sale.delete({ where: { id } });
    });

    revalidatePath("/satis/gecmis");
    revalidatePath("/stok");
    revalidatePath("/satis/kasa");
    return { success: true };
  } catch (error) {
    console.error("Delete sale error:", error);
    return { success: false, error: "Satış silinirken bir hata oluştu." };
  }
}

export async function deleteSales(ids: string[]) {
  try {
    const shopId = await getShopId();

    for (const id of ids) {
      const res = await deleteSale(id);
      if (!res.success) throw new Error(res.error);
    }

    revalidatePath("/satis/gecmis");
    return { success: true };
  } catch (error) {
    console.error("Bulk delete sales error:", error);
    return { success: false, error: "Birtakım satışlar silinemedi." };
  }
}
