"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getDeadStockCount } from "./product-actions";
import { getOrCreateKasaAccount } from "./finance-actions";
import { getShopId } from "@/lib/auth";

export async function getDashboardStats() {
  try {
    const shopId = await getShopId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingServices,
      readyDevices,
      products,
      todaySalesAgg,
      todayRepairIncome,
      todayTransactions,
      totalDebts,
      pendingProcurementCount,
      deadStockCount,
      kasaAccount,
    ] = await Promise.all([
      prisma.serviceTicket.count({
        where: { shopId, status: { in: ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"] } }
      }),
      prisma.serviceTicket.count({ where: { shopId, status: "READY" } }),
      prisma.product.findMany({ where: { shopId } }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: today } },
        _sum: { finalAmount: true }
      }),
      prisma.serviceTicket.aggregate({
        where: { shopId, status: "DELIVERED", deliveredAt: { gte: today } },
        _sum: { actualCost: true }
      }),
      prisma.transaction.aggregate({
        where: { shopId, type: "INCOME", createdAt: { gte: today } },
        _sum: { amount: true }
      }),
      prisma.supplier.aggregate({ where: { shopId }, _sum: { balance: true } }),
      prisma.shortageItem.count({ where: { shopId, isResolved: false } }),
      getDeadStockCount(),
      // Kasa account balance (real-time)
      getOrCreateKasaAccount(),
    ]);

    const lowStockCount = products.filter(p => p.stock <= p.criticalStock).length;
    const kasaBalance = Number(kasaAccount.balance) || 0;
    const todaySalesAmount = Number(todaySalesAgg._sum.finalAmount) || 0;

    // Get active session opening balance (if any)
    let kasaOpeningBalance = 0;
    try {
      const activeSession = await prisma.dailySession.findFirst({
        where: { shopId, status: "OPEN" },
        orderBy: { createdAt: "desc" }
      });
      kasaOpeningBalance = Number(activeSession?.openingBalance) || 0;
    } catch { /* ignore */ }

    return serializePrisma({
      // Card primary value: actual today's sales
      todaySales: `₺${todaySalesAmount.toLocaleString('tr-TR')}`,
      todaySalesRaw: todaySalesAmount,
      // Sub-label: current kasa balance
      kasaBalance: `₺${kasaBalance.toLocaleString('tr-TR')}`,
      kasaBalanceRaw: kasaBalance,
      kasaOpeningBalance: `₺${kasaOpeningBalance.toLocaleString('tr-TR')}`,
      kasaOpeningBalanceRaw: kasaOpeningBalance,
      todayRepairIncome: `₺${(Number(todayRepairIncome._sum.actualCost) || 0).toLocaleString('tr-TR')}`,
      collectedPayments: `₺${(Number(todayTransactions._sum.amount) || 0).toLocaleString('tr-TR')}`,
      pendingServices: pendingServices.toString(),
      readyDevices: readyDevices.toString(),
      criticalStock: lowStockCount.toString(),
      totalDebts: `₺${(Number(totalDebts._sum.balance) || 0).toLocaleString('tr-TR')}`,
      cashBalance: `₺${kasaBalance.toLocaleString('tr-TR')}`,
      pendingProcurementCount: pendingProcurementCount.toString(),
      deadStockCount: deadStockCount.toString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return serializePrisma({
      todaySales: "₺0",
      todaySalesRaw: 0,
      kasaBalance: "₺0",
      kasaBalanceRaw: 0,
      kasaOpeningBalance: "₺0",
      kasaOpeningBalanceRaw: 0,
      todayRepairIncome: "₺0",
      collectedPayments: "₺0",
      pendingServices: "0",
      readyDevices: "0",
      criticalStock: "0",
      totalDebts: "₺0",
      cashBalance: "₺0",
      pendingProcurementCount: "0",
      deadStockCount: "0",
    });
  }
}


export async function getRecentServiceTickets() {
  try {
    const shopId = await getShopId();
    const tickets = await prisma.serviceTicket.findMany({
      where: { shopId },
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
    const shopId = await getShopId();
    const transactions = await prisma.transaction.findMany({
      where: { shopId },
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
    const shopId = await getShopId();
    // This is a simplified version, ideally you'd join with SaleItem and group by productId
    const products = await prisma.product.findMany({
      where: { shopId },
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
