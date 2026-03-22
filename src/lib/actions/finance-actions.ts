"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: true,
        sale: true
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function createManualTransaction(data: { type: "INCOME" | "EXPENSE"; amount: number; description: string; paymentMethod: "CASH" | "CARD" | "TRANSFER" }) {
  try {
    // For demo/simplicity, we use the first admin user or a generic user ID
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
              email: "admin@basarteknik.com",
              name: "Admin",
              password: "password123",
              role: "ADMIN"
            }
          });
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: user.id
      }
    });
    revalidatePath("/finans");
    revalidatePath("/");
    return { success: true, transaction: serializePrisma(transaction) };
  } catch (error) {
    return { success: false, error: "İşlem kaydedilemedi." };
  }
}

export async function getFinancialSummary() {
  try {
    const transactions = await prisma.transaction.findMany();

    const summary = transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        acc.totalIncome += amount;
        if (t.paymentMethod === 'CASH') acc.cashBalance += amount;
        if (t.paymentMethod === 'CARD') acc.bankBalance += amount;
        if (t.paymentMethod === 'TRANSFER') acc.bankBalance += amount;
      } else {
        acc.totalExpense += amount;
        if (t.paymentMethod === 'CASH') acc.cashBalance -= amount;
        if (t.paymentMethod === 'CARD') acc.bankBalance -= amount;
        if (t.paymentMethod === 'TRANSFER') acc.bankBalance -= amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, cashBalance: 0, bankBalance: 0 });

    return summary;
  } catch (error) {
    return { totalIncome: 0, totalExpense: 0, cashBalance: 0, bankBalance: 0 };
  }
}
