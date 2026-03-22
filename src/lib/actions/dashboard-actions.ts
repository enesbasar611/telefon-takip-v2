"use server";
import prisma from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeServices,
      totalCustomers,
      criticalStock,
      totalIncome,
      todaySales,
      repairRevenue,
    ] = await Promise.all([
      prisma.serviceTicket.count({
        where: {
          status: {
            in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"]
          }
        }
      }),
      prisma.customer.count(),
      prisma.product.count({
        where: {
          stock: {
            lte: prisma.product.fields.criticalStock
          }
        }
      }),
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
      })
    ]);

    return {
      activeServices: activeServices.toString(),
      totalCustomers: totalCustomers.toString(),
      criticalStock: criticalStock.toString(),
      totalIncome: `₺${(Number(totalIncome._sum.amount) || 0).toLocaleString('tr-TR')}`,
      todaySales: `₺${(Number(todaySales._sum.finalAmount) || 0).toLocaleString('tr-TR')}`,
      repairRevenue: `₺${(Number(repairRevenue._sum.actualCost) || 0).toLocaleString('tr-TR')}`,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      activeServices: "0",
      totalCustomers: "0",
      criticalStock: "0",
      totalIncome: "₺0",
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
