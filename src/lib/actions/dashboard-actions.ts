"use server";
import prisma from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeServices,
      totalCustomers,
      products,
      totalIncome,
      todaySales,
      repairRevenue,
      transactions,
    ] = await Promise.all([
      prisma.serviceTicket.count({
        where: {
          status: {
            in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"]
          }
        }
      }),
      prisma.customer.count(),
      prisma.product.findMany(),
      prisma.transaction.aggregate({
        where: { type: "INCOME" },
        _sum: { amount: true }
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { finalAmount: true }
      }),
      prisma.serviceTicket.aggregate({
        where: { status: "DELIVERED", deliveredAt: { gte: today } },
        _sum: { actualCost: true }
      }),
      prisma.transaction.findMany()
    ]);

    const lowStockCount = products.filter(p => p.stock <= p.criticalStock).length;

    // Financial calculations for the 8 cards requirement
    const financialSummary = transactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        acc.totalIncome += amount;
        if (t.paymentMethod === 'CASH') acc.cashBalance += amount;
        else acc.bankBalance += amount;
      } else {
        acc.totalExpense += amount;
        if (t.paymentMethod === 'CASH') acc.cashBalance -= amount;
        else acc.bankBalance -= amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, cashBalance: 0, bankBalance: 0 });

    return {
      activeServices: activeServices.toString(),
      totalCustomers: totalCustomers.toString(),
      criticalStock: lowStockCount.toString(),
      totalIncome: `₺${(Number(totalIncome._sum.amount) || 0).toLocaleString('tr-TR')}`,
      todaySales: `₺${(Number(todaySales._sum.finalAmount) || 0).toLocaleString('tr-TR')}`,
      repairRevenue: `₺${(Number(repairRevenue._sum.actualCost) || 0).toLocaleString('tr-TR')}`,
      totalExpense: `₺${financialSummary.totalExpense.toLocaleString('tr-TR')}`,
      cashBalance: `₺${(financialSummary.cashBalance + financialSummary.bankBalance).toLocaleString('tr-TR')}`,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      activeServices: "0",
      totalCustomers: "0",
      criticalStock: "0",
      totalIncome: "₺0",
      todaySales: "₺0",
      repairRevenue: "₺0",
      totalExpense: "₺0",
      cashBalance: "₺0",
    };
  }
}

export async function getRecentServiceTickets() {
  try {
    return await prisma.serviceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true
      }
    });
  } catch (error) {
    console.error("Error fetching recent tickets:", error);
    return [];
  }
}
