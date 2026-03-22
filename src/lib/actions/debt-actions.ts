import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function getDebts() {
  try {
    const debts = await prisma.debt.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(debts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return [];
  }
}

export async function getDebtSummary() {
  try {
    const aggregate = await prisma.debt.aggregate({
      _sum: {
        remainingAmount: true,
      },
    });
    return Number(aggregate._sum.remainingAmount) || 0;
  } catch (error) {
    console.error("Error fetching debt summary:", error);
    return 0;
  }
}
