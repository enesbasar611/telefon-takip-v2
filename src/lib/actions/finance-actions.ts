import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { TransactionType, PaymentMethod } from "@prisma/client";

async function getOrCreateDevUser() {
  return await prisma.user.upsert({
    where: { email: "admin@takipv2.com" },
    update: {},
    create: {
      email: "admin@takipv2.com",
      name: "Admin",
      password: "hashed_password",
      role: "ADMIN",
    },
  });
}

export async function getTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function createTransaction(data: {
  description: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
}) {
  try {
    const user = await getOrCreateDevUser();
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: user.id,
      },
    });
    revalidatePath("/finans");
    revalidatePath("/");
    return { success: true, data: serializePrisma(transaction) };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "İşlem kaydedilirken bir hata oluştu." };
  }
}

export async function getFinanceSummary() {
  try {
    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: "INCOME" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount) || 0;
    const totalExpense = Number(expense._sum.amount) || 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }
}
