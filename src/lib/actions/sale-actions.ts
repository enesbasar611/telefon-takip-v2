"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { PaymentMethod, TransactionType } from "@prisma/client";
import { addShortageItem } from "./shortage-actions";
import { getOrCreateAccountByType } from "./finance-actions";
import { getShopId, getUserId } from "@/lib/auth";
import { getSettings } from "./setting-actions";
import { calculateLoyaltyPoints } from "@/lib/loyalty-engine";
import { saleSchema } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// getOrCreateDevUser removed.

export async function createSale(rawData: z.infer<typeof saleSchema>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 30 sales per minute
    await checkRateLimit(`createSale:${userId}`, 30);

    const data = saleSchema.parse(rawData);

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Generate sale number and create sale record
      const saleCount = await tx.sale.count({ where: { shopId } });
      const saleNumber = `SALE-${1000 + saleCount + 1}`;

      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: data.customerId,
          userId,
          shopId,
          totalAmount: data.totalAmount,
          finalAmount: Math.max(0, data.totalAmount - (data.discountAmount || 0)),
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

      // 2. Increment Loyalty Points if customer exists and points earned
      let earnedPoints = 0;
      try {
        const result = await calculateLoyaltyPoints(
          newSale.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice)
          })),
          0,
          data.discountAmount || 0,
          shopId
        );
        earnedPoints = result.earnedPoints;
      } catch (err) {
        console.error("Loyalty calculation error:", err);
      }

      if (data.customerId && (earnedPoints > 0 || (data.usedPoints && data.usedPoints > 0))) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            loyaltyPoints: {
              increment: earnedPoints - (data.usedPoints || 0)
            }
          }
        });
      }

      // 3. Update stock and create movements
      for (const item of data.items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.productId, shopId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: "SALE",
            notes: `SATIŞ - ${newSale.saleNumber}`,
            shopId,
            saleId: newSale.id
          },
        });

        if (updatedProduct.stock <= 0) {
          await addShortageItem({
            productId: item.productId,
            name: updatedProduct.name,
            quantity: 1,
            notes: `Satış sonucu stok tükendi: ${newSale.saleNumber}`
          });
        }
      }

      // 4. Financial routing
      let targetAccount = null;
      let isDebt = data.paymentMethod === "DEBT";

      if (data.paymentMethod === "CASH") {
        targetAccount = await tx.financeAccount.findFirst({ where: { type: "CASH", shopId, isActive: true } });
      } else if (data.paymentMethod === "CREDIT_CARD") {
        targetAccount = await tx.financeAccount.findFirst({ where: { type: "POS", shopId, isActive: true } });
      } else if (data.paymentMethod === "TRANSFER" || data.paymentMethod === "BANK_TRANSFER") {
        targetAccount = await tx.financeAccount.findFirst({ where: { type: "BANK", shopId, isActive: true } });
      }

      const activeSession = await tx.dailySession.findFirst({ where: { status: "OPEN", shopId } });
      const finalAmount = Number(data.totalAmount);

      // 5. Create Financial Transaction
      await tx.transaction.create({
        data: {
          amount: finalAmount,
          type: TransactionType.INCOME,
          description: `SATIŞ - ${newSale.saleNumber}${data.discountAmount ? ` (₺${data.discountAmount} İndirim)` : ''}${isDebt ? ' (VERESİYE)' : ''}`,
          paymentMethod: isDebt ? PaymentMethod.DEBT : newSale.paymentMethod,
          userId,
          shopId,
          saleId: newSale.id,
          customerId: data.customerId || undefined,
          financeAccountId: targetAccount?.id ?? undefined,
          dailySessionId: activeSession?.id ?? undefined,
        },
      });

      // 6. Update Account Balance
      if (targetAccount) {
        await tx.financeAccount.update({
          where: { id: targetAccount.id },
          data: { balance: { increment: finalAmount } },
        });
      }

      // 7. Create Debt Record if VERESİYE
      if (isDebt && data.customerId) {
        await tx.debt.create({
          data: {
            customerId: data.customerId,
            amount: finalAmount,
            remainingAmount: finalAmount,
            shopId,
            notes: `Satış: ${newSale.saleNumber}`,
            saleId: newSale.id, // Verified in schema.prisma
            isPaid: false
          } as any
        });
      }

      return newSale;
    });

    revalidatePath("/satis");
    revalidatePath("/stok");
    revalidatePath("/satis/kasa");
    revalidatePath("/veresiye");
    revalidateTag(`dashboard-${shopId}`);
    if (data.customerId) {
      revalidatePath(`/musteriler/${data.customerId}`);
    }

    return { success: true, data: serializePrisma(sale) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Sale creation error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Satış işlemi sırasında bir hata oluştu." };
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
export async function deleteSale(id: string, revertStock: boolean = true) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 10 deletions per minute
    await checkRateLimit(`deleteSale:${userId}`, 10);

    // 1. Get sale details
    const sale = await prisma.sale.findUnique({
      where: { id, shopId },
      include: { items: true }
    });

    if (!sale) return { success: false, error: "Satış bulunamadı." };

    await prisma.$transaction(async (tx) => {
      // 2. Refund Stocks if requested
      if (revertStock) {
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
              notes: `Satış İptali (Stok Geri): ${sale.saleNumber}`
            }
          });
        }
      }

      // 3. Delete related records
      // Delete associated transactions
      await tx.transaction.deleteMany({
        where: { saleId: id, shopId }
      });

      // Delete inventory movements associated with this sale
      await tx.inventoryMovement.deleteMany({
        where: { saleId: id, shopId }
      });

      // Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id, shopId }
      });

      // Delete debt if exists
      await tx.debt.deleteMany({
        where: { saleId: id, shopId }
      });

      // Finally delete the sale
      await tx.sale.delete({
        where: { id, shopId }
      });
    });

    revalidatePath("/satis/gecmis");
    revalidatePath("/stok");
    revalidatePath("/veresiye");
    return { success: true };
  } catch (error) {
    console.error("Delete sale error:", error);
    return { success: false, error: "Satış silinirken bir hata oluştu." };
  }
}

export async function deleteSales(ids: string[], revertStock: boolean = true) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 5 batch deletions per minute
    await checkRateLimit(`deleteSales:${userId}`, 5);

    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const sale = await tx.sale.findUnique({
          where: { id, shopId },
          include: { items: true }
        });

        if (!sale) continue;

        if (revertStock) {
          for (const item of sale.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });

            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                shopId,
                type: "IN",
                quantity: item.quantity,
                notes: `Toplu Satış İptali (Stok Geri): ${sale.saleNumber}`
              }
            });
          }
        }

        await tx.transaction.deleteMany({ where: { saleId: id, shopId } });
        await tx.inventoryMovement.deleteMany({ where: { saleId: id, shopId } });
        await tx.saleItem.deleteMany({ where: { saleId: id, shopId } });
        await tx.debt.deleteMany({ where: { saleId: id, shopId } });
        await tx.sale.delete({ where: { id, shopId } });
      }
    });

    revalidatePath("/satis/gecmis");
    revalidatePath("/stok");
    revalidatePath("/veresiye");
    return { success: true };
  } catch (error) {
    console.error("Delete sales error:", error);
    return { success: false, error: "Satışlar silinirken bir hata oluştu." };
  }
}
