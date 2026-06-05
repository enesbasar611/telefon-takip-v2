"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { getShopId, getUserId } from "@/lib/auth";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { recordAuditLog } from "./audit-actions";

const normalizeMoney = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return amount;
};

const clampRemainingAmount = (remaining: unknown, amount: unknown) => {
  const safeAmount = Math.max(0, normalizeMoney(amount));
  const safeRemaining = Math.max(0, normalizeMoney(remaining));
  return Math.min(safeRemaining, safeAmount);
};

export async function getDebts() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return [];
    const debts = await prisma.debt.findMany({
      where: { shopId },
      include: {
        customer: true,
        sale: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(debts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return [];
  }
}

export async function getThisMonthCollected() {
  try {
    const shopId = await getShopId();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = await prisma.transaction.findMany({
      where: {
        shopId,
        type: "INCOME",
        OR: [
          { description: { contains: "Borç Tahsilatı" } },
          { description: { startsWith: "Yapılan Ödeme" } },
          { category: "Tahsilat" }
        ],
        createdAt: { gte: startOfMonth }
      }
    });
    return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  } catch {
    return 0;
  }
}

export async function getTodayCollected() {
  try {
    const shopId = await getShopId();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const transactions = await prisma.transaction.findMany({
      where: {
        shopId,
        type: "INCOME",
        OR: [
          { description: { contains: "Borç Tahsilatı" } },
          { description: { startsWith: "Yapılan Ödeme" } },
          { category: "Tahsilat" }
        ],
        createdAt: { gte: startOfDay }
      }
    });
    return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  } catch {
    return 0;
  }
}

export async function createDebt(data: {
  customerId: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  dueDate?: Date;
  notes?: string;
  items?: {
    title: string;
    amount: number;
    currency: string;
    productId?: string;
    quantity?: number;
  }[];
}) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // 1. Capture Balance BEFORE
    const beforeSummary = await getCustomerDebtSummary(data.customerId);

    const debt = await prisma.$transaction(async (tx) => {
      // 1. Check if customer has balance (prepayment) to apply
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
        select: { balance: true, balanceUsd: true, name: true }
      });

      const debtAmount = normalizeMoney(data.amount);
      if (debtAmount <= 0) {
        throw new Error("Geçerli bir borç tutarı giriniz.");
      }

      let initialRemaining = debtAmount;
      const currency = data.currency || "TRY";
      const balanceField = currency === "USD" ? "balanceUsd" : "balance";
      const currentBalance = normalizeMoney(customer?.[balanceField] || 0);

      if (currentBalance > 0) {
        const amountFromBalance = Math.min(currentBalance, initialRemaining);
        initialRemaining -= amountFromBalance;

        // Update customer balance
        await tx.customer.update({
          where: { id: data.customerId },
          data: { [balanceField]: { decrement: amountFromBalance } }
        });

        // Create a transaction for internal payment from balance
        if (amountFromBalance > 0.01) {
          await tx.transaction.create({
            data: {
              type: "INCOME",
              amount: amountFromBalance,
              currency: currency,
              description: `Bakiye/Emanet ile Ödeme (Borç: ${data.notes || 'Yeni Borç'})`,
              paymentMethod: "CASH", // Internal
              userId,
              shopId,
              customerId: data.customerId,
              category: "Tahsilat"
            }
          });
        }
      }

      // 2. Create the debt record
      const newDebt = await tx.debt.create({
        data: {
          customerId: data.customerId,
          amount: debtAmount,
          remainingAmount: clampRemainingAmount(initialRemaining, debtAmount),
          currency: currency,
          isPaid: initialRemaining <= 0.01,
          exchangeRate: data.exchangeRate,
          dueDate: data.dueDate,
          notes: data.notes,
          shopId
        }
      });

      // 3. Create a Transaction record for this debt entry
      // This makes it visible in financial records/logs (kasa defteri) 
      // but DOES NOT affect finance account balances since financeAccountId is undefined.
      await tx.transaction.create({
        data: {
          type: "INCOME", // It's an asset increase (receivable)
          amount: debtAmount,
          currency: currency,
          description: `VERESİYE BORÇ: ${data.notes || (data.items ? data.items[0]?.title : 'Yeni Borç')}${initialRemaining < debtAmount ? ' (Kısmi Ödeme Yapıldı)' : ''}`,
          paymentMethod: "DEBT",
          userId,
          shopId,
          customerId: data.customerId,
          debtId: newDebt.id,
          category: "Veresiye",
          // Note: financeAccountId is left undefined so it doesn't affect any kasa balance
        }
      });

      // 4. Handle product stock deduction for items
      if (data.items) {
        for (const item of data.items) {
          if (item.productId && item.quantity) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });

            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                type: "OUT",
                notes: `Veresiye Satışı: ${newDebt.id.substring(0, 8)}`,
                shopId,
                debtId: newDebt.id
              }
            });
          }
        }
      }

      return newDebt;
    });

    // 2. Capture Balance AFTER
    const afterSummary = await getCustomerDebtSummary(data.customerId);

    revalidatePath("/veresiye");
    revalidatePath("/stok");
    revalidatePath("/servis");
    revalidatePath("/musteriler");
    revalidateTag(`dashboard-${shopId}`);
    return {
      success: true,
      debt: serializePrisma(debt),
      before: beforeSummary,
      after: afterSummary
    };
  } catch (error) {
    console.error("createDebt error:", error);
    return { success: false, error: "Borç kaydı oluşturulamadı." };
  }
}

export async function deleteDebt(debtId: string) {
  try {
    const shopId = await getShopId();
    const debt = await prisma.debt.findUnique({
      where: { id: debtId, shopId },
      include: { customer: true }
    });

    if (!debt) return { success: false, error: "Borç kaydı bulunamadı." };

    // 1. Capture Balance BEFORE
    const beforeSummary = await getCustomerDebtSummary(debt.customerId);

    await prisma.debt.delete({
      where: { id: debtId, shopId }
    });
    revalidatePath("/veresiye");
    revalidateTag(`dashboard-${shopId}`);

    // 2. Capture Balance AFTER
    const afterSummary = await getCustomerDebtSummary(debt.customerId);

    await recordAuditLog({
      action: "DELETE",
      entityType: "FINANCE",
      entityId: debtId,
      entityName: beforeSummary?.name,
      message: `${beforeSummary?.name} müşterisine ait ${debt.amount}${debt.currency} tutarındaki borç kaydı silindi.`,
      details: {
        debt,
        before: beforeSummary,
        after: afterSummary
      }
    });

    return {
      success: true,
      before: beforeSummary,
      after: afterSummary
    };

    return { success: true };
  } catch (error) {
    console.error("deleteDebt error:", error);
    return { success: false, error: "Borç kaydı silinemedi." };
  }
}

export async function updateDebt(data: {
  id: string;
  amount: number;
  currency: string;
  notes?: string;
}) {
  try {
    const shopId = await getShopId();
    const existing = await prisma.debt.findUnique({ where: { id: data.id, shopId } });
    if (!existing) return { success: false, error: "Kayıt bulunamadı." };

    // 1. Capture Balance BEFORE
    const beforeSummary = await getCustomerDebtSummary(existing.customerId);

    const debtAmount = normalizeMoney(data.amount);
    if (debtAmount <= 0) return { success: false, error: "Geçerli bir borç tutarı giriniz." };

    // Calculate the difference between old and new amount to adjust remaining
    const existingAmount = normalizeMoney(existing.amount);
    const existingRemaining = clampRemainingAmount(existing.remainingAmount, existing.amount);
    const diff = debtAmount - existingAmount;
    const newRemaining = clampRemainingAmount(existingRemaining + diff, debtAmount);

    const debt = await prisma.debt.update({
      where: { id: data.id, shopId },
      data: {
        amount: debtAmount,
        currency: data.currency,
        notes: data.notes,
        remainingAmount: newRemaining,
        isPaid: newRemaining <= 0.01
      }
    });

    // 2. Capture Balance AFTER
    const afterSummary = await getCustomerDebtSummary(existing.customerId);

    await recordAuditLog({
      action: "UPDATE",
      entityType: "FINANCE",
      entityId: data.id,
      entityName: beforeSummary?.name,
      message: `${beforeSummary?.name} müşterisine ait borç güncellendi: ${existing.amount}${existing.currency} -> ${debtAmount}${data.currency}`,
      details: {
        beforeDebt: existing,
        afterDebt: debt,
        beforeSummary,
        afterSummary
      }
    });

    revalidatePath("/veresiye");
    revalidateTag(`dashboard-${shopId}`);
    return {
      success: true,
      debt: serializePrisma(debt),
      before: beforeSummary,
      after: afterSummary
    };
  } catch (error) {
    console.error("updateDebt error:", error);
    return { success: false, error: "Borç kaydı güncellenemedi." };
  }
}

export async function collectDebtPayment(debtId: string, paymentAmount: number, paymentMethod: "CASH" | "CARD" | "TRANSFER" = "CASH", accountId?: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Get the debt and customer info for better transaction description
    const debt = await prisma.debt.findUnique({
      where: { id: debtId, shopId },
      include: { customer: true }
    });
    if (!debt) return { success: false, error: "Borç kaydı bulunamadı." };

    const currentRemaining = clampRemainingAmount(debt.remainingAmount, debt.amount);

    // 1. Capture Balance BEFORE
    const beforeSummary = await getCustomerDebtSummary(debt.customerId);

    const appliedPayment = Math.min(paymentAmount, currentRemaining);
    const excessPayment = Math.max(0, paymentAmount - appliedPayment);
    const newRemaining = clampRemainingAmount(currentRemaining - appliedPayment, debt.amount);

    // Use a transaction to ensure all updates happen together
    await prisma.$transaction(async (tx) => {
      // 1. Update the debt record
      await tx.debt.update({
        where: { id: debtId, shopId },
        data: {
          remainingAmount: newRemaining,
          isPaid: newRemaining <= 0.01
        }
      });

      if (excessPayment > 0.01) {
        const balanceField = debt.currency === "USD" ? "balanceUsd" : "balance";
        await tx.customer.update({
          where: { id: debt.customerId },
          data: { [balanceField]: { increment: excessPayment } }
        });
      }

      // 2. Identify the target finance account
      let targetAccountId = accountId;
      if (!targetAccountId) {
        const type = paymentMethod === "CASH" ? "CASH" : paymentMethod === "CARD" ? "POS" : "BANK";
        // Helper to get or create default account by type
        const nameMap = { CASH: "Merkez Kasa", BANK: "Banka Hesabı", POS: "POS Hesabı", CREDIT_CARD: "Kredi Kartı" };
        let account = await tx.financeAccount.findFirst({
          where: { type: type as any, shopId, isActive: true },
          orderBy: { isDefault: "desc" }
        });

        if (!account) {
          account = await tx.financeAccount.create({
            data: {
              name: (nameMap as any)[type],
              type: type as any,
              balance: 0,
              isDefault: type === "CASH",
              shopId
            }
          });
        }
        targetAccountId = account.id;
      }

      // 3. Create the transaction record
      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: paymentAmount,
          currency: debt.currency || "TRY",
          description: `Borç Tahsilatı: ${debt.customer.name}`,
          paymentMethod,
          financeAccountId: targetAccountId,
          userId,
          shopId,
          customerId: debt.customerId
        }
      });

      // 4. Update the finance account balance
      await tx.financeAccount.update({
        where: { id: targetAccountId },
        data: {
          balance: { increment: paymentAmount }
        }
      });
    });

    // 2. Capture Balance AFTER
    const afterSummary = await getCustomerDebtSummary(debt.customerId);

    revalidatePath("/veresiye");
    revalidatePath("/satis/kasa");
    revalidatePath("/servis");
    revalidatePath("/musteriler");
    revalidateTag(`dashboard-${shopId}`);
    return {
      success: true,
      before: beforeSummary,
      after: afterSummary,
      paidAmount: paymentAmount,
      currency: debt.currency || "TRY"
    };
  } catch (error) {
    console.error("collectDebtPayment error:", error);
    return { success: false, error: "Tahsilat kaydedilemedi." };
  }
}

export async function startTrackingDebt(debtId: string, dueDate: Date) {
  try {
    const shopId = await getShopId();
    await prisma.debt.update({
      where: { id: debtId, shopId },
      data: {
        isTracking: true,
        dueDate: dueDate
      }
    });

    const userId = await getUserId();
    await prisma.reminder.create({
      data: {
        title: "Borç Takip Hatırlatması",
        description: `Ücret tahsilatı için belirlenen gün geldi.`,
        date: dueDate,
        category: "FINANCE",
        creatorId: userId,
        shopId
      }
    });

    revalidatePath("/veresiye");
    return { success: true };
  } catch (error) {
    console.error("startTrackingDebt error:", error);
    return { success: false, error: "Takip başlatılamadı." };
  }
}

export async function collectGlobalCustomerPayment(data: {
  customerId: string;
  paymentAmount: number;
  paymentCurrency: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  accountId?: string;
  usdRate?: number;
  notes?: string;
  ignoreExcess?: boolean;
  debtIds?: string[];
}) {
  try {
    const {
      customerId,
      paymentAmount,
      paymentCurrency = "TRY",
      paymentMethod = "CASH",
      accountId,
      usdRate: initialUsdRate = 32.5,
      notes,
      ignoreExcess = false,
      debtIds,
    } = data;

    const shopId = await getShopId();
    const userId = await getUserId();

    const unpaidDebts = await prisma.debt.findMany({
      where: {
        customerId,
        shopId,
        isPaid: false,
        ...(debtIds && debtIds.length > 0 ? { id: { in: debtIds } } : {})
      },
      orderBy: { createdAt: "asc" }
    });

    if (unpaidDebts.length === 0) return { success: false, error: "Ödenmemiş borç bulunamadı." };

    if (isNaN(paymentAmount) || !isFinite(paymentAmount) || paymentAmount <= 0) {
      return { success: false, error: "Geçerli bir ödeme tutarı giriniz." };
    }

    const usdRate = initialUsdRate || 32.5;

    // 1. Capture Balance BEFORE
    const beforeSummary = await getCustomerDebtSummary(customerId);

    let remainingPayment = paymentAmount;

    await prisma.$transaction(async (tx) => {
      for (const debt of unpaidDebts) {
        if (remainingPayment <= 0.001) break;

        let amountToApplyFromPayment = 0;
        let amountToReduceFromDebt = 0;

        const debtRemaining = clampRemainingAmount(debt.remainingAmount, debt.amount);

        if (debt.currency === paymentCurrency) {
          amountToApplyFromPayment = Math.min(remainingPayment, debtRemaining);
          amountToReduceFromDebt = amountToApplyFromPayment;
        }
        else if (debt.currency === "USD" && paymentCurrency === "TRY") {
          const debtRemainingInTRY = parseFloat((debtRemaining * usdRate).toFixed(2));
          amountToApplyFromPayment = Math.min(remainingPayment, debtRemainingInTRY);
          amountToReduceFromDebt = parseFloat((amountToApplyFromPayment / usdRate).toFixed(2));
        }
        else if (debt.currency === "TRY" && paymentCurrency === "USD") {
          const debtRemainingInUSD = parseFloat((debtRemaining / usdRate).toFixed(2));
          amountToApplyFromPayment = Math.min(remainingPayment, debtRemainingInUSD);
          amountToReduceFromDebt = parseFloat((amountToApplyFromPayment * usdRate).toFixed(2));
        }

        if (amountToReduceFromDebt > 0.001) {
          const newRemaining = clampRemainingAmount(debtRemaining - amountToReduceFromDebt, debt.amount);
          await tx.debt.update({
            where: { id: debt.id },
            data: {
              remainingAmount: newRemaining,
              isPaid: newRemaining <= 0.01
            }
          });
          remainingPayment -= amountToApplyFromPayment;
        }
      }

      if (remainingPayment > 0.01 && !ignoreExcess) {
        const balanceField = paymentCurrency === "USD" ? "balanceUsd" : "balance";
        await tx.customer.update({
          where: { id: customerId },
          data: { [balanceField]: { increment: remainingPayment } }
        });
      }

      let targetAccountId = accountId;
      if (!targetAccountId) {
        const type = paymentMethod === "CASH" ? "CASH" : paymentMethod === "CARD" ? "POS" : "BANK";
        const account = await tx.financeAccount.findFirst({
          where: { type: type as any, shopId, isActive: true },
          orderBy: { isDefault: "desc" }
        });
        targetAccountId = account?.id;
      }

      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: paymentAmount,
          currency: paymentCurrency,
          description: notes || `${beforeSummary?.name || 'Müşteri'} Tahsilatı`,
          paymentMethod,
          financeAccountId: targetAccountId,
          userId,
          shopId,
          customerId,
          category: "Tahsilat"
        }
      });

      if (targetAccountId) {
        await tx.financeAccount.update({
          where: { id: targetAccountId },
          data: { balance: { increment: paymentAmount } }
        });
      }
    });

    // 2. Capture Balance AFTER
    const afterSummary = await getCustomerDebtSummary(customerId);

    // 3. Record Audit Log
    await recordAuditLog({
      action: "UPDATE",
      entityType: "FINANCE",
      entityId: customerId,
      entityName: beforeSummary?.name || customerId,
      message: `${beforeSummary?.name} müşterisinden ${paymentAmount}${paymentCurrency} tahsilat yapıldı.`,
      details: {
        paymentAmount,
        paymentCurrency,
        before: beforeSummary,
        after: afterSummary,
        notes
      }
    });

    revalidatePath("/veresiye");
    revalidatePath(`/musteriler/${customerId}`);
    revalidateTag(`dashboard-${shopId}`);

    return {
      success: true,
      before: beforeSummary,
      after: afterSummary,
      paidAmount: paymentAmount,
      currency: paymentCurrency
    };
  } catch (error: any) {
    console.error("collectGlobalCustomerPayment error:", error);
    return {
      success: false,
      error: error?.message || "Tahsilat yapılamadı. Lütfen tekrar deneyiniz."
    };
  }
}

export async function getCustomerStatement(customerId: string) {
  try {
    const shopId = await getShopId();
    const debts = await prisma.debt.findMany({
      where: { customerId, shopId },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId,
        shopId,
        paymentMethod: { not: "DEBT" }
      },
      orderBy: { createdAt: "desc" }
    });

    // Also fetch all sales with their items for this customer
    const sales = await prisma.sale.findMany({
      where: { customerId, shopId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        transaction: {
          select: { currency: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const activeReturns = await prisma.returnTicket.findMany({
      where: {
        customerId,
        shopId,
      },
      select: {
        id: true,
        productId: true,
        debtId: true,
        saleId: true,
        quantity: true,
        refundAmount: true,
        refundCurrency: true,
        returnStatus: true,
        ticketNumber: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      debts: serializePrisma(debts),
      transactions: serializePrisma(transactions),
      sales: serializePrisma(sales),
      activeReturns: serializePrisma(activeReturns)
    };
  } catch (error) {
    console.error("getCustomerStatement error:", error);
    return { success: false, error: "Ekstre verileri alınamadı." };
  }
}


export async function getDebtStatsDetails(filter: {
  type: 'RECEIVABLE_TRY' | 'RECEIVABLE_USD' | 'OVERDUE' | 'COLLECTED';
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const shopId = await getShopId();
    const { type, startDate, endDate } = filter;

    const dateFilter = (startDate || endDate) ? {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      }
    } : {};

    if (type === 'COLLECTED') {
      const transactions = await prisma.transaction.findMany({
        where: {
          shopId,
          type: 'INCOME',
          OR: [
            { description: { startsWith: "Borç Tahsilatı:" } },
            { description: { contains: "Borç Tahsilatı" } },
            { description: { startsWith: "Yapılan Ödeme" } },
            { category: "Tahsilat" }
          ],
          ...dateFilter
        },
        include: {
          customer: true,
          user: true,
          financeAccount: true
        },
        orderBy: { createdAt: "desc" }
      });
      return { success: true, data: serializePrisma(transactions) };
    } else {
      // For debt stats (Receivables, Overdue)
      const debts = await prisma.debt.findMany({
        where: {
          shopId,
          isPaid: false,
          ...(type === 'RECEIVABLE_TRY' && { currency: 'TRY' }),
          ...(type === 'RECEIVABLE_USD' && { currency: 'USD' }),
          ...(type === 'OVERDUE' && {
            dueDate: { lt: new Date() }
          }),
          ...dateFilter
        },
        include: {
          customer: true
        },
        orderBy: { createdAt: "desc" }
      });
      return { success: true, data: serializePrisma(debts) };
    }
  } catch (error) {
    console.error("getDebtStatsDetails error:", error);
    return { success: false, error: "Detay verileri alınamadı." };
  }
}

export async function deleteCustomerPayment(transactionId: string) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, shopId },
      include: { customer: true }
    });

    if (!transaction || !transaction.customerId) {
      return { success: false, error: "İşlem veya müşteri bulunamadı." };
    }

    const { customerId, amount } = transaction;

    // 1. Capture Balance BEFORE
    const beforeSummary = await getCustomerDebtSummary(customerId);

    await prisma.$transaction(async (tx) => {
      let amountToRestore = Number(amount);
      const { financeAccountId } = transaction;

      // 1. Restore Debts (Start from most recently modified)
      const debtsToRestore = await tx.debt.findMany({
        where: { customerId, shopId },
        orderBy: { updatedAt: "desc" }
      });

      for (const debt of debtsToRestore) {
        if (amountToRestore <= 0.001) break;

        const paidAmount = Number(debt.amount) - Number(debt.remainingAmount);
        if (paidAmount <= 0) continue;

        // Simplify currency handling for restoration (assume match or simple rate)
        // Since we didn't store the exact rate of the original payment in the debt row,
        // we use a best-effort approach.
        const restoreForThisDebt = Math.min(amountToRestore, paidAmount);

        await tx.debt.update({
          where: { id: debt.id },
          data: {
            remainingAmount: { increment: restoreForThisDebt },
            isPaid: false
          }
        });

        amountToRestore -= restoreForThisDebt;
      }

      const balanceField = transaction.currency === "USD" ? "balanceUsd" : "balance";
      const isBalancePayment = !financeAccountId && (transaction.description?.includes("Bakiye") || transaction.description?.includes("Emanet"));

      if (isBalancePayment) {
        await tx.customer.update({
          where: { id: customerId },
          data: { [balanceField]: { increment: amount } }
        });
      } else if (amountToRestore > 0.01) {
        await tx.customer.update({
          where: { id: customerId },
          data: { [balanceField]: { decrement: amountToRestore } }
        });
      }

      if (financeAccountId) {
        await tx.financeAccount.update({
          where: { id: financeAccountId },
          data: { balance: { decrement: amount } }
        });
      }

      await tx.transaction.delete({
        where: { id: transactionId }
      });
    });

    // 2. Capture Balance AFTER
    const afterSummary = await getCustomerDebtSummary(customerId);

    revalidatePath("/veresiye");
    revalidatePath(`/musteriler/${customerId}`);
    revalidateTag(`dashboard-${shopId}`);

    await recordAuditLog({
      action: "DELETE",
      entityType: "FINANCE",
      entityId: transactionId,
      entityName: beforeSummary?.name,
      message: `${beforeSummary?.name || 'Müşteri'} tahsilat kaydı (${amount}${transaction.currency}) sildi/iptal etti.`,
      details: {
        amount: transaction.amount,
        currency: transaction.currency,
        before: beforeSummary,
        after: afterSummary,
        transaction
      }
    });

    return { success: true, before: beforeSummary, after: afterSummary };
  } catch (error: any) {
    console.error("deleteCustomerPayment error:", error);
    return { success: false, error: error?.message || "İşlem geri alınamadı." };
  }
}

export async function updateCustomerPayment(
  transactionId: string,
  newAmount: number,
  description?: string,
  usdRate: number = 32.5
) {
  try {
    const shopId = await getShopId();
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, shopId }
    });

    if (!transaction || !transaction.customerId) return { success: false, error: "İşlem bulunamadı." };

    const customerId = transaction.customerId;
    const beforeSummary = await getCustomerDebtSummary(customerId);
    const oldAmount = Number(transaction.amount);
    const diff = newAmount - oldAmount; // Change in the payment currency
    const txCurrency = transaction.currency || "TRY";

    await prisma.$transaction(async (tx) => {
      const isBalancePayment = !transaction.financeAccountId && (transaction.description?.includes("Bakiye") || transaction.description?.includes("Emanet"));
      const balanceField = txCurrency === "USD" ? "balanceUsd" : "balance";

      if (isBalancePayment) {
        // This is a usage of balance. Any change in 'amount' directly affects balance in reverse.
        // If amount increases (diff > 0), customer used more from balance -> decrement balance.
        // If amount decreases (diff < 0), customer used less from balance -> increment balance.
        await tx.customer.update({
          where: { id: transaction.customerId! },
          data: { [balanceField]: { decrement: diff } }
        });

        // Now handle the debt change
        if (diff > 0) {
          let remainingDiff = diff;
          const unpaidDebts = await tx.debt.findMany({
            where: { customerId: transaction.customerId!, shopId, isPaid: false },
            orderBy: { createdAt: "asc" }
          });

          for (const debt of unpaidDebts) {
            if (remainingDiff <= 0.001) break;
            const debtRemaining = Number(debt.remainingAmount);
            let toReduce = 0;
            let toApply = 0;

            if (debt.currency === txCurrency) {
              toApply = Math.min(remainingDiff, debtRemaining);
              toReduce = toApply;
            } else if (debt.currency === "USD" && txCurrency === "TRY") {
              const inTRY = Math.round(debtRemaining * usdRate);
              toApply = Math.min(remainingDiff, inTRY);
              toReduce = Math.round(toApply / usdRate);
            } else if (debt.currency === "TRY" && txCurrency === "USD") {
              const inUSD = Math.round(debtRemaining / usdRate);
              toApply = Math.min(remainingDiff, inUSD);
              toReduce = Math.round(toApply * usdRate);
            }

            if (toReduce > 0.001) {
              await tx.debt.update({
                where: { id: debt.id },
                data: { remainingAmount: { decrement: toReduce }, isPaid: (debtRemaining - toReduce) <= 0.01 }
              });
              remainingDiff -= toApply;
            }
          }
        } else if (diff < 0) {
          let remainingRestore = Math.abs(diff);
          const partiallyPaidDebts = await tx.debt.findMany({
            where: { customerId: transaction.customerId!, shopId },
            orderBy: { updatedAt: "desc" }
          });

          for (const debt of partiallyPaidDebts) {
            if (remainingRestore <= 0.001) break;
            const paidamt = Number(debt.amount) - Number(debt.remainingAmount);
            if (paidamt <= 0) continue;
            let toRestore = 0;
            let toGap = 0;

            if (debt.currency === txCurrency) {
              toGap = Math.min(remainingRestore, paidamt);
              toRestore = toGap;
            } else if (debt.currency === "USD" && txCurrency === "TRY") {
              const inTRY = Math.round(paidamt * usdRate);
              toGap = Math.min(remainingRestore, inTRY);
              toRestore = Math.round(toGap / usdRate);
            } else if (debt.currency === "TRY" && txCurrency === "USD") {
              const inUSD = Math.round(paidamt / usdRate);
              toGap = Math.min(remainingRestore, inUSD);
              toRestore = Math.round(toGap * usdRate);
            }

            if (toRestore > 0.001) {
              await tx.debt.update({
                where: { id: debt.id },
                data: { remainingAmount: { increment: toRestore }, isPaid: false }
              });
              remainingRestore -= toGap;
            }
          }
        }
      } else {
        // Normal Payment (Income)
        if (diff > 0) {
          // More money paid: reduce more debt
          let remainingDiff = diff;
          const unpaidDebts = await tx.debt.findMany({
            where: { customerId: transaction.customerId!, shopId, isPaid: false },
            orderBy: { createdAt: "asc" }
          });

          for (const debt of unpaidDebts) {
            if (remainingDiff <= 0.001) break;

            let amountToApplyFromDiff = 0;
            let amountToReduceFromDebt = 0;
            const debtRemaining = Number(debt.remainingAmount);

            if (debt.currency === txCurrency) {
              amountToApplyFromDiff = Math.min(remainingDiff, debtRemaining);
              amountToReduceFromDebt = amountToApplyFromDiff;
            } else if (debt.currency === "USD" && txCurrency === "TRY") {
              const debtRemainingInTRY = Math.round(debtRemaining * usdRate);
              amountToApplyFromDiff = Math.min(remainingDiff, debtRemainingInTRY);
              amountToReduceFromDebt = Math.round(amountToApplyFromDiff / usdRate);
            } else if (debt.currency === "TRY" && txCurrency === "USD") {
              const debtRemainingInUSD = Math.round(debtRemaining / usdRate);
              amountToApplyFromDiff = Math.min(remainingDiff, debtRemainingInUSD);
              amountToReduceFromDebt = Math.round(amountToApplyFromDiff * usdRate);
            }

            if (amountToReduceFromDebt > 0.001) {
              const newRemaining = Math.max(0, debtRemaining - amountToReduceFromDebt);
              await tx.debt.update({
                where: { id: debt.id },
                data: {
                  remainingAmount: newRemaining,
                  isPaid: newRemaining <= 0.01
                }
              });
              remainingDiff -= amountToApplyFromDiff;
            }
          }

          // If still money left, add to balance
          if (remainingDiff > 0.01) {
            await tx.customer.update({
              where: { id: transaction.customerId! },
              data: { [balanceField]: { increment: remainingDiff } }
            });
          }
        } else if (diff < 0) {
          // Less money paid: reduce from balance first (if there was excess), then restore debt
          let remainingRestore = Math.abs(diff);
          const currentBalance = Number(beforeSummary?.[balanceField] || 0);

          if (currentBalance > 0) {
            const reductionFromBalance = Math.min(remainingRestore, currentBalance);
            await tx.customer.update({
              where: { id: transaction.customerId! },
              data: { [balanceField]: { decrement: reductionFromBalance } }
            });
            remainingRestore -= reductionFromBalance;
          }

          if (remainingRestore > 0.001) {
            const partiallyPaidDebts = await tx.debt.findMany({
              where: { customerId: transaction.customerId!, shopId },
              orderBy: { updatedAt: "desc" }
            });

            for (const debt of partiallyPaidDebts) {
              if (remainingRestore <= 0.001) break;

              const paidAmtOnDebt = Number(debt.amount) - Number(debt.remainingAmount);
              if (paidAmtOnDebt <= 0) continue;

              let amountToRestoreFromGap = 0;
              let amountToIncreaseOnDebt = 0;

              if (debt.currency === txCurrency) {
                amountToRestoreFromGap = Math.min(remainingRestore, paidAmtOnDebt);
                amountToIncreaseOnDebt = amountToRestoreFromGap;
              } else if (debt.currency === "USD" && txCurrency === "TRY") {
                const paidAmtInTRY = Math.round(paidAmtOnDebt * usdRate);
                amountToRestoreFromGap = Math.min(remainingRestore, paidAmtInTRY);
                amountToIncreaseOnDebt = Math.round(amountToRestoreFromGap / usdRate);
              } else if (debt.currency === "TRY" && txCurrency === "USD") {
                const paidAmtInUSD = Math.round(paidAmtOnDebt / usdRate);
                amountToRestoreFromGap = Math.min(remainingRestore, paidAmtInUSD);
                amountToIncreaseOnDebt = Math.round(amountToRestoreFromGap * usdRate);
              }

              if (amountToIncreaseOnDebt > 0.001) {
                await tx.debt.update({
                  where: { id: debt.id },
                  data: {
                    remainingAmount: { increment: amountToIncreaseOnDebt },
                    isPaid: false
                  }
                });
                remainingRestore -= amountToRestoreFromGap;
              }
            }
          }

          if (remainingRestore > 0.01) {
            await tx.customer.update({
              where: { id: transaction.customerId! },
              data: { [balanceField]: { decrement: remainingRestore } }
            });
          }
        }
      }

      // Update Account
      if (transaction.financeAccountId && diff !== 0) {
        await tx.financeAccount.update({
          where: { id: transaction.financeAccountId },
          data: { balance: { increment: diff } }
        });
      }

      // Update Transaction
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          amount: newAmount,
          ...(description && { description })
        }
      });
    });

    revalidatePath("/veresiye");
    revalidatePath(`/musteriler/${transaction.customerId}`);

    const afterSummary = await getCustomerDebtSummary(transaction.customerId);

    return { success: true, before: beforeSummary, after: afterSummary };
  } catch (error: any) {
    console.error("updateCustomerPayment error:", error);
    return { success: false, error: error?.message || "Güncelleme yapılamadı." };
  }
}

/**
 * Calculates a comprehensive summary of a customer's debt and balance.
 */
export async function getCustomerDebtSummary(customerId: string) {
  try {
    const shopId = await getShopId();
    const [customer, debts] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId }
      }),
      prisma.debt.findMany({
        where: { customerId, shopId, isPaid: false }
      })
    ]);

    if (!customer) throw new Error("Customer not found");

    let totalTRY = 0;
    let totalUSD = 0;

    debts.forEach(d => {
      const remaining = Number(d.remainingAmount || 0);
      if (d.currency === "USD") totalUSD += remaining;
      else totalTRY += remaining;
    });

    return {
      totalRemainingTRY: Math.round(totalTRY),
      totalRemainingUSD: Number(totalUSD.toFixed(2)),
      balance: Number(customer.balance || 0),
      balanceUsd: Number(customer.balanceUsd || 0),
      name: customer.name
    };
  } catch (error) {
    console.error("getCustomerDebtSummary error:", error);
    return null;
  }
}
