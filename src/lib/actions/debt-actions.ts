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

export async function createDebt(data: { customerId: string; amount: number; dueDate?: Date; notes?: string }) {
  try {
    const shopId = await getShopId();
    const debt = await prisma.debt.create({
      data: {
        ...data,
        remainingAmount: data.amount,
        shopId
      }
    });
    revalidatePath("/veresiye");
    revalidatePath("/servis");
    revalidatePath("/musteriler");
    return { success: true, debt: serializePrisma(debt) };
  } catch (error) {
    return { success: false, error: "Borç kaydı oluşturulamadı." };
  }
}

export async function collectDebtPayment(debtId: string, paymentAmount: number) {
  try {
    const shopId = await getShopId();
    const debt = await prisma.debt.findUnique({ where: { id: debtId, shopId } });
    if (!debt) return { success: false, error: "Borç kaydı bulunamadı." };

    const newRemaining = Number(debt.remainingAmount) - paymentAmount;

    await prisma.debt.update({
      where: { id: debtId, shopId },
      data: {
        remainingAmount: newRemaining,
        isPaid: newRemaining <= 0
      }
    });

    // Create a transaction record for the collection
    const userId = await getUserId();
    await prisma.transaction.create({
      data: {
        type: "INCOME",
        amount: paymentAmount,
        description: `Borç Tahsilatı: ${debtId}`,
        paymentMethod: "CASH",
        userId: userId,
        shopId
      }
    });

    revalidatePath("/veresiye");
    revalidatePath("/satis/kasa");
    revalidatePath("/servis");
    revalidatePath("/musteriler");
    return { success: true };
  } catch (error) {
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
