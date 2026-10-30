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
import { recordAuditLog } from "./audit-actions";
import { revalidateSmartReplenishment } from "@/lib/inventory/replenishment-cache";
import { decrementProductStockSafely } from "@/lib/inventory/stock-guards";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import { convertTransactionAmount, type TransactionCurrency } from "@/lib/finance/transaction-currency";

// getOrCreateDevUser removed.

export async function generateSaleNumber(
  tx: any,
  shopId: string,
  prefix: string = "SALE-"
): Promise<string> {
  // Query recent sales for this shop to find the absolute max numeric suffix
  const recentSales = await tx.sale.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { saleNumber: true },
  });

  const saleCount = await tx.sale.count({ where: { shopId } });
  let maxNum = 1000 + saleCount;

  for (const s of recentSales) {
    if (s.saleNumber) {
      const match = s.saleNumber.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        // Exclude timestamp values (> 1,000,000)
        if (!isNaN(num) && num > maxNum && num < 1000000) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${nextNum}`;

  let exists = await tx.sale.findFirst({
    where: { shopId, saleNumber: candidate },
    select: { id: true },
  });

  while (exists) {
    nextNum++;
    candidate = `${prefix}${nextNum}`;
    exists = await tx.sale.findFirst({
      where: { shopId, saleNumber: candidate },
      select: { id: true },
    });
  }

  return candidate;
}

export async function createSale(rawData: z.infer<typeof saleSchema>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 30 sales per minute
    await checkRateLimit(`createSale:${userId}`, 30);

    const data = saleSchema.parse(rawData);
    const exchangeRates = await getExchangeRates(shopId);

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Generate sale number and create sale record
      let saleNumber = await generateSaleNumber(tx, shopId, "SALE-");

      const saleData = {
        saleNumber,
        customerId: data.customerId,
        userId,
        shopId,
        totalAmount: data.totalAmount + (data.discountAmount || 0),
        finalAmount: Math.max(0, data.totalAmount),
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
      };

      const includeConfig = {
        items: {
          include: {
            product: {
              include: {
                deviceInfo: true
              }
            }
          }
        },
        customer: true
      };

      let newSale;
      try {
        newSale = await tx.sale.create({
          data: saleData,
          include: includeConfig
        });
      } catch (err: any) {
        if (err?.code === "P2002" || err?.message?.includes("P2002") || err?.message?.includes("saleNumber")) {
          const timestampPart = Date.now().toString().slice(-4);
          saleData.saleNumber = `${saleNumber}-${timestampPart}`;
          newSale = await tx.sale.create({
            data: saleData,
            include: includeConfig
          });
        } else {
          throw err;
        }
      }

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
        const updatedProduct = await decrementProductStockSafely(tx, item.productId, shopId, item.quantity);

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

        if (updatedProduct.stock <= updatedProduct.criticalStock) {
          await addShortageItem({
            productId: item.productId,
            name: updatedProduct.name,
            quantity: 1,
            notes: updatedProduct.stock <= 0
              ? `Satış sonucu stok tükendi: ${newSale.saleNumber}`
              : `Satış sonucu kritik stok seviyesine ulaşıldı (${updatedProduct.stock} adet kaldı): ${newSale.saleNumber}`
          });
        }
      }

      // 4. Financial routing
      let targetAccount = null;
      let isDebt = data.paymentMethod === "DEBT";

      if (!isDebt && data.accountId) {
        targetAccount = await tx.financeAccount.findFirst({
          where: { id: data.accountId, shopId, isActive: true }
        });
        if (!targetAccount) throw new Error("Seçilen kasa hesabı bulunamadı.");
      } else if (data.paymentMethod === "CASH") {
        targetAccount = await tx.financeAccount.findFirst({ where: { type: "CASH", shopId, isActive: true } });
      } else if (data.paymentMethod === "CREDIT_CARD") {
        targetAccount = await tx.financeAccount.findFirst({ where: { type: "POS", shopId, isActive: true } });
      } else if (data.paymentMethod === "TRANSFER" || data.paymentMethod === "BANK_TRANSFER") {
        targetAccount = await tx.financeAccount.findFirst({ where: { type: "BANK", shopId, isActive: true } });
      }

      const activeSession = await tx.dailySession.findFirst({ where: { status: "OPEN", shopId } });
      const saleCurrency = data.currency === "USD" || data.currency === "EUR" ? data.currency : "TRY";
      const finalAmount = Number(data.totalAmount);
      const finalAmountTry = convertTransactionAmount(
        finalAmount,
        saleCurrency as TransactionCurrency,
        exchangeRates
      ).TRY;
      const soldProductNames = newSale.items.map(item => item.product?.name).filter(Boolean);
      const baseDesc = data.description?.trim() || (soldProductNames.length > 0
        ? `${soldProductNames[0]}${soldProductNames.length > 1 ? ` + ${soldProductNames.length - 1} ürün` : ""}`
        : `Satış ${newSale.saleNumber}`);
      const saleDescription = baseDesc;

      // 5. Create Financial Transaction
      await tx.transaction.create({
        data: {
          amount: finalAmount,
          currency: saleCurrency,
          type: TransactionType.INCOME,
          description: `${saleDescription}${data.discountAmount ? ` (₺${data.discountAmount} İndirim)` : ''}${isDebt ? ' (VERESİYE)' : ''}`,
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
          data: { balance: { increment: finalAmountTry } },
        });
      }

      // 7. Create Debt Record if VERESİYE
      if (isDebt && data.customerId) {
        await tx.debt.create({
          data: {
            customerId: data.customerId,
            amount: finalAmount,
            remainingAmount: finalAmount,
            currency: saleCurrency,
            shopId,
            notes: saleDescription,
            saleId: newSale.id, // Verified in schema.prisma
            isPaid: false
          } as any
        });
      }

      // 8. Fetch the full sale object with transaction to return
      const fullSale = await tx.sale.findUnique({
        where: { id: newSale.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  deviceInfo: true
                }
              }
            }
          },
          customer: true,
          transaction: true
        }
      });

      return fullSale;
    });

    revalidatePath("/satis");
    revalidatePath("/stok");
    revalidatePath("/satis/kasa");
    revalidatePath("/veresiye");
    revalidateTag(`dashboard-${shopId}`);
    revalidateSmartReplenishment(shopId);
    if (data.customerId) {
      revalidatePath(`/musteriler/${data.customerId}`);
    }

    if (!sale) {
      return { success: false, error: "Satış oluşturulamadı." };
    }

    await recordAuditLog({
      action: "CREATE",
      entityType: "SALE",
      entityId: sale.id,
      entityName: sale.saleNumber,
      message: `${sale.saleNumber} numaralı yeni satış oluşturuldu.`,
      details: { totalAmount: Number(sale.finalAmount), paymentMethod: sale.paymentMethod }
    });

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
        items: {
          include: {
            product: {
              include: {
                deviceInfo: true
              }
            }
          }
        },
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
export interface DeleteSaleOptions {
  revertStock?: boolean;
  adjustFinanceBalance?: boolean;
  deleteTransaction?: boolean;
}

export interface SaleDeletePreview {
  id: string;
  saleNumber: string;
  customerName: string;
  customerId?: string | null;
  totalAmount: number;
  finalAmount: number;
  discount: number;
  currency: string;
  paymentMethod: string;
  createdAt: Date;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currentStock: number;
  }[];
  transaction?: {
    id: string;
    amount: number;
    currency: string;
    type: string;
    financeAccountId?: string | null;
    financeAccountName?: string | null;
    financeAccountBalance?: number | null;
  } | null;
  debt?: {
    id: string;
    amount: number;
    remainingAmount: number;
  } | null;
}

export async function getSaleDeletePreview(saleId: string): Promise<{ success: boolean; data?: SaleDeletePreview; error?: string }> {
  try {
    const shopId = await getShopId();
    const sale = await prisma.sale.findUnique({
      where: { id: saleId, shopId },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, stock: true } }
          }
        },
        transaction: {
          include: {
            financeAccount: { select: { id: true, name: true, balance: true, type: true } }
          }
        },
        debt: { select: { id: true, amount: true, remainingAmount: true } }
      }
    });

    if (!sale) return { success: false, error: "Satış kaydı bulunamadı." };

    const currency = sale.transaction?.currency || "TRY";

    const preview: SaleDeletePreview = {
      id: sale.id,
      saleNumber: sale.saleNumber,
      customerName: sale.customer?.name || "Perakende Satış",
      customerId: sale.customerId,
      totalAmount: Number(sale.totalAmount),
      finalAmount: Number(sale.finalAmount),
      discount: Number(sale.discount),
      currency,
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || "Ürün",
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        currentStock: item.product?.stock ?? 0
      })),
      transaction: sale.transaction ? {
        id: sale.transaction.id,
        amount: Number(sale.transaction.amount),
        currency: sale.transaction.currency || "TRY",
        type: sale.transaction.type,
        financeAccountId: sale.transaction.financeAccountId,
        financeAccountName: sale.transaction.financeAccount?.name || "Nakit Kasa",
        financeAccountBalance: sale.transaction.financeAccount ? Number(sale.transaction.financeAccount.balance) : null
      } : null,
      debt: sale.debt ? {
        id: sale.debt.id,
        amount: Number(sale.debt.amount),
        remainingAmount: Number(sale.debt.remainingAmount)
      } : null
    };

    return { success: true, data: serializePrisma(preview) };
  } catch (error) {
    console.error("getSaleDeletePreview error:", error);
    return { success: false, error: "Satış detayları alınamadı." };
  }
}

export async function deleteSale(
  id: string,
  options: boolean | DeleteSaleOptions = true
) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const normalizedOptions: DeleteSaleOptions = typeof options === "boolean"
      ? { revertStock: options, adjustFinanceBalance: true, deleteTransaction: true }
      : {
          revertStock: options.revertStock ?? true,
          adjustFinanceBalance: options.adjustFinanceBalance ?? true,
          deleteTransaction: options.deleteTransaction ?? true
        };

    // Rate limit: 20 deletions per minute
    await checkRateLimit(`deleteSale:${userId}`, 20);

    // 1. Get sale details with relations
    const sale = await prisma.sale.findUnique({
      where: { id, shopId },
      include: {
        items: { include: { product: true } },
        transaction: { include: { financeAccount: true } },
        debt: true
      }
    });

    if (!sale) return { success: false, error: "Satış bulunamadı." };

    await prisma.$transaction(async (tx) => {
      // 2. Refund Stocks if requested
      if (normalizedOptions.revertStock) {
        for (const item of sale.items) {
          if (item.productId) {
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
                notes: `Satış Silme (Stok İadesi): ${sale.saleNumber}`
              }
            });
          }
        }
      }

      // 3. Reverse Finance Account Balance if requested and linked
      if (normalizedOptions.adjustFinanceBalance && sale.transaction?.financeAccountId) {
        const amount = Number(sale.transaction.amount);
        const balanceChange = sale.transaction.type === 'INCOME' ? -amount : amount;

        await tx.financeAccount.update({
          where: { id: sale.transaction.financeAccountId },
          data: {
            balance: { increment: balanceChange },
            availableBalance: sale.transaction.financeAccount?.type === 'CREDIT_CARD' ? { increment: balanceChange } : undefined
          }
        });

        // Update subsequent running balances
        await tx.transaction.updateMany({
          where: {
            financeAccountId: sale.transaction.financeAccountId,
            createdAt: { gt: sale.transaction.createdAt },
            shopId
          },
          data: {
            runningBalance: { increment: balanceChange }
          }
        });
      }

      // 4. Delete or unlink associated transaction
      if (normalizedOptions.deleteTransaction) {
        await tx.transaction.deleteMany({
          where: { saleId: id, shopId }
        });
      } else {
        await tx.transaction.updateMany({
          where: { saleId: id, shopId },
          data: {
            saleId: null,
            description: `${sale.transaction?.description || 'Satış'} [Satış Fişi Silindi: ${sale.saleNumber}]`
          }
        });
      }

      // 5. Unlink ReturnTickets if any
      await tx.returnTicket.updateMany({
        where: { saleId: id, shopId },
        data: { saleId: null }
      });

      // 6. Delete inventory movements associated with this sale
      await tx.inventoryMovement.deleteMany({
        where: { saleId: id, shopId }
      });

      // 7. Delete debt if exists
      if (sale.debt) {
        await tx.debt.deleteMany({
          where: { saleId: id, shopId }
        });
      }

      // 8. Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id, shopId }
      });

      // 9. Finally delete the sale
      await tx.sale.delete({
        where: { id, shopId }
      });
    });

    recordAuditLog({
      action: "DELETE",
      entityType: "SALE",
      entityId: id,
      entityName: sale.saleNumber,
      message: `${sale.saleNumber} numaralı satış silindi. (Tutar: ${sale.finalAmount} TL, Stok İadesi: ${normalizedOptions.revertStock ? "Evet" : "Hayır"}, Kasa Düzeltmesi: ${normalizedOptions.adjustFinanceBalance ? "Evet" : "Hayır"})`,
      details: {
        saleNumber: sale.saleNumber,
        finalAmount: sale.finalAmount,
        options: normalizedOptions
      }
    }).catch(console.error);

    revalidatePath("/satis/gecmis");
    revalidatePath("/satis/kasa");
    revalidatePath("/stok");
    revalidatePath("/veresiye");
    revalidateTag(`dashboard-${shopId}`);
    revalidateSmartReplenishment(shopId);
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
    revalidateTag(`dashboard-${shopId}`);
    revalidateSmartReplenishment(shopId);
    return { success: true };
  } catch (error) {
    console.error("Delete sales error:", error);
    return { success: false, error: "Satışlar silinirken bir hata oluştu." };
  }
}
