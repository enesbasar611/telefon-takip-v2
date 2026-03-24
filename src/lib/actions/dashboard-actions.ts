"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingServices,
      readyDevices,
      products,
      todaySales,
      todayRepairIncome,
      todayTransactions,
      totalDebts,
      allTransactions,
    ] = await Promise.all([
      // PENDING SERVICES
      prisma.serviceTicket.count({
        where: {
          status: {
            in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"]
          }
        }
      }),
      // READY DEVICES
      prisma.serviceTicket.count({
        where: {
          status: "READY"
        }
      }),
      // For CRITICAL STOCK
      prisma.product.findMany(),
      // TODAY'S SALES
      prisma.sale.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { finalAmount: true }
      }),
      // TODAY'S REPAIR INCOME (Delivered today)
      prisma.serviceTicket.aggregate({
        where: { status: "DELIVERED", deliveredAt: { gte: today } },
        _sum: { actualCost: true }
      }),
      // COLLECTED PAYMENTS TODAY
      prisma.transaction.aggregate({
        where: {
          type: "INCOME",
          createdAt: { gte: today }
        },
        _sum: { amount: true }
      }),
      // TOTAL DEBTS
      prisma.debt.aggregate({
        where: { isPaid: false },
        _sum: { remainingAmount: true }
      }),
      // For CASH BALANCE
      prisma.transaction.findMany()
    ]);

    const lowStockCount = products.filter(p => p.stock <= 2).length;

    // Financial calculations for CASH BALANCE (Total Income - Total Expense)
    const financialSummary = allTransactions.reduce((acc, t) => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        acc.balance += amount;
      } else {
        acc.balance -= amount;
      }
      return acc;
    }, { balance: 0 });

    return serializePrisma({
      todaySales: `₺${(Number(todaySales._sum.finalAmount) || 0).toLocaleString('tr-TR')}`,
      todayRepairIncome: `₺${(Number(todayRepairIncome._sum.actualCost) || 0).toLocaleString('tr-TR')}`,
      collectedPayments: `₺${(Number(todayTransactions._sum.amount) || 0).toLocaleString('tr-TR')}`,
      pendingServices: pendingServices.toString(),
      readyDevices: readyDevices.toString(),
      criticalStock: lowStockCount.toString(),
      totalDebts: `₺${(Number(totalDebts._sum.remainingAmount) || 0).toLocaleString('tr-TR')}`,
      cashBalance: `₺${financialSummary.balance.toLocaleString('tr-TR')}`,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return serializePrisma({
      todaySales: "₺0",
      todayRepairIncome: "₺0",
      collectedPayments: "₺0",
      pendingServices: "0",
      readyDevices: "0",
      criticalStock: "0",
      totalDebts: "₺0",
      cashBalance: "₺0",
    });
  }
}

export async function getRecentServiceTickets() {
  try {
    const tickets = await prisma.serviceTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        technician: true
      }
    });
    return serializePrisma(tickets);
  } catch (error) {
    console.error("Error fetching recent tickets:", error);
    return [];
  }
}

export async function getRecentTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        sale: {
          include: {
            customer: true
          }
        }
      }
    });
    return serializePrisma(transactions);
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}

export async function getTopSellingProducts() {
  try {
    // This is a simplified version, ideally you'd join with SaleItem and group by productId
    const products = await prisma.product.findMany({
      take: 4,
      orderBy: { saleItems: { _count: 'desc' } },
      include: {
        category: true,
        _count: {
          select: { saleItems: true }
        }
      }
    });

    return serializePrisma(products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category.name,
      price: Number(p.sellPrice),
      sales: p._count.saleItems,
      stock: p.stock,
      criticalStock: p.criticalStock
    })));
  } catch (error) {
    console.error("Error fetching top products:", error);
    return [];
  }
}
