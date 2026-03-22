import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getDebts() {
  try {
    const debts = await prisma.debt.findMany({
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

export async function createDebt(data: { customerId: string; amount: number; dueDate?: Date; notes?: string }) {
  try {
    const debt = await prisma.debt.create({
      data: {
        ...data,
        remainingAmount: data.amount
      }
    });
    revalidatePath("/veresiye");
    return { success: true, debt: serializePrisma(debt) };
  } catch (error) {
    return { success: false, error: "Borç kaydı oluşturulamadı." };
  }
}

export async function collectDebtPayment(debtId: string, paymentAmount: number) {
  try {
    const debt = await prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt) return { success: false, error: "Borç kaydı bulunamadı." };

    const newRemaining = Number(debt.remainingAmount) - paymentAmount;

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        remainingAmount: newRemaining,
        isPaid: newRemaining <= 0
      }
    });

    // Create a transaction record for the collection
    let user = await prisma.user.findFirst(); // Mock user for demo
    if (user) {
        await prisma.transaction.create({
          data: {
            type: "INCOME",
            amount: paymentAmount,
            description: `Borç Tahsilatı: ${debtId}`,
            paymentMethod: "CASH",
            userId: user.id
          }
        });
    }

    revalidatePath("/veresiye");
    revalidatePath("/finans");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Tahsilat kaydedilemedi." };
  }
}
