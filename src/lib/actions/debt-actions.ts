"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId, getUserId } from "@/lib/auth";

export async function getDebts() {
  try {
    const shopId = await getShopId();
    const debts = await prisma.debt.findMany({
      where: { shopId },
      include: {
        customer: true
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
        description: { startsWith: "Borç Tahsilatı:" },
        createdAt: { gte: startOfMonth }
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
  notes?: string
}) {
  try {
    const shopId = await getShopId();
    const debt = await prisma.debt.create({
      data: {
        customerId: data.customerId,
        amount: data.amount,
        remainingAmount: data.amount,
        currency: data.currency || "TRY",
        exchangeRate: data.exchangeRate,
        dueDate: data.dueDate,
        notes: data.notes,
        shopId
      }
    });
    revalidatePath("/veresiye");
    revalidatePath("/servis");
    revalidatePath("/musteriler");
    return { success: true, debt: serializePrisma(debt) };
  } catch (error) {
    console.error("createDebt error:", error);
    return { success: false, error: "Borç kaydı oluşturulamadı." };
  }
}

export async function deleteDebt(debtId: string) {
  try {
    const shopId = await getShopId();
    await prisma.debt.delete({
      where: { id: debtId, shopId }
    });
    revalidatePath("/veresiye");
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

    // Calculate the difference between old and new amount to adjust remaining
    const diff = data.amount - Number(existing.amount);
    const newRemaining = Number(existing.remainingAmount) + diff;

    const debt = await prisma.debt.update({
      where: { id: data.id, shopId },
      data: {
        amount: data.amount,
        currency: data.currency,
        notes: data.notes,
        remainingAmount: newRemaining < 0 ? 0 : newRemaining, // Ensure no negative remainings
        isPaid: newRemaining <= 0
      }
    });

    revalidatePath("/veresiye");
    return { success: true, debt: serializePrisma(debt) };
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

    const newRemaining = Number(debt.remainingAmount) - paymentAmount;

    // Use a transaction to ensure all updates happen together
    await prisma.$transaction(async (tx) => {
      // 1. Update the debt record
      await tx.debt.update({
        where: { id: debtId, shopId },
        data: {
          remainingAmount: newRemaining,
          isPaid: newRemaining <= 0
        }
      });

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
          description: `Borç Tahsilatı: ${debt.customer.name}`,
          paymentMethod,
          financeAccountId: targetAccountId,
          userId,
          shopId
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

    revalidatePath("/veresiye");
    revalidatePath("/satis/kasa");
    revalidatePath("/servis");
    revalidatePath("/musteriler");
    return { success: true };
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
export async function collectGlobalCustomerPayment(
  customerId: string,
  paymentAmount: number,
  paymentCurrency: string = "TRY",
  paymentMethod: "CASH" | "CARD" | "TRANSFER" = "CASH",
  accountId?: string,
  usdRate: number = 32.5,
  notes?: string
) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    const unpaidDebts = await prisma.debt.findMany({
      where: { customerId, shopId, isPaid: false },
      orderBy: { createdAt: "asc" }
    });

    if (unpaidDebts.length === 0) return { success: false, error: "Ödenmemiş borç bulunamadı." };

    let remainingPayment = paymentAmount;

    await prisma.$transaction(async (tx) => {
      for (const debt of unpaidDebts) {
        if (remainingPayment <= 0) break;

        let amountToApplyFromPayment = 0;
        let amountToReduceFromDebt = 0;

        const debtRemaining = Number(debt.remainingAmount);

        // Case 1: Same currency
        if (debt.currency === paymentCurrency) {
          amountToApplyFromPayment = Math.min(remainingPayment, debtRemaining);
          amountToReduceFromDebt = amountToApplyFromPayment;
        }
        // Case 2: Paying TRY for USD debt
        else if (debt.currency === "USD" && paymentCurrency === "TRY") {
          const debtRemainingInTRY = debtRemaining * usdRate;
          amountToApplyFromPayment = Math.min(remainingPayment, debtRemainingInTRY);
          amountToReduceFromDebt = amountToApplyFromPayment / usdRate;
        }
        // Case 3: Paying USD for TRY debt
        else if (debt.currency === "TRY" && paymentCurrency === "USD") {
          const debtRemainingInUSD = debtRemaining / usdRate;
          amountToApplyFromPayment = Math.min(remainingPayment, debtRemainingInUSD);
          amountToReduceFromDebt = amountToApplyFromPayment * usdRate;
        }

        if (amountToReduceFromDebt > 0) {
          await tx.debt.update({
            where: { id: debt.id },
            data: {
              remainingAmount: { decrement: amountToReduceFromDebt },
              isPaid: (debtRemaining - amountToReduceFromDebt) <= 0.01 // Handle floating point
            }
          });
          remainingPayment -= amountToApplyFromPayment;
        }
      }

      // Record the transaction
      let targetAccountId = accountId;
      if (!targetAccountId) {
        const type = paymentMethod === "CASH" ? "CASH" : paymentMethod === "CARD" ? "POS" : "BANK";
        const account = await tx.financeAccount.findFirst({
          where: { type: type as any, shopId, isActive: true },
          orderBy: { isDefault: "desc" }
        });
        targetAccountId = account?.id;
      }

      const customer = await tx.customer.findUnique({ where: { id: customerId } });

      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: paymentAmount,
          description: `Toplu Borç Tahsilatı: ${customer?.name || customerId}`,
          paymentMethod,
          financeAccountId: targetAccountId,
          userId,
          shopId
        }
      });

      if (targetAccountId) {
        await tx.financeAccount.update({
          where: { id: targetAccountId },
          data: { balance: { increment: paymentAmount } }
        });
      }
    });

    let totalRemainingTRY = 0;
    let totalRemainingUSD = 0;
    const remainingDebts = await prisma.debt.findMany({
      where: { customerId, shopId, isPaid: false }
    });
    for (const d of remainingDebts) {
      if (d.currency === "USD") totalRemainingUSD += Number(d.remainingAmount);
      else totalRemainingTRY += Number(d.remainingAmount);
    }

    revalidatePath("/veresiye");
    return { success: true, remainingTRY: totalRemainingTRY, remainingUSD: totalRemainingUSD };
  } catch (error) {
    console.error("collectGlobalCustomerPayment error:", error);
    return { success: false, error: "Tahsilat kaydedilemedi." };
  }
}
