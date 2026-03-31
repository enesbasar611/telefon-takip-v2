"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { getShopId } from "@/lib/auth";

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  try {
    const shopId = await getShopId();
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const sales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end }
      }
    });

    const days = eachDayOfInterval({ start, end });
    const trend = days.map(day => {
      const daySales = sales.filter(s =>
        format(new Date(s.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      return {
        date: format(day, 'dd MMM', { locale: tr }),
        total: daySales.reduce((sum, s) => sum + Number(s.finalAmount), 0)
      };
    });

    return serializePrisma(trend);
  } catch (error) {
    return [];
  }
}

export async function getServiceMetrics() {
  try {
    const shopId = await getShopId();
    const statuses = await prisma.serviceTicket.groupBy({
      by: ['status'],
      where: { shopId },
      _count: true
    });

    const metrics = statuses.map(s => ({
      name: s.status,
      value: s._count
    }));

    return serializePrisma(metrics);
  } catch (error) {
    return [];
  }
}

export async function getDashboardStats() {
  try {
    const shopId = await getShopId();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const monthStart = startOfMonth(new Date());
    const prevMonthStart = startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const prevMonthEnd = endOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)));

    const [activeServices, dailySales, products, customers, completedServicesThisMonth, thisMonthSales, prevMonthSales] = await Promise.all([
      prisma.serviceTicket.count({ where: { shopId, status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { finalAmount: true }
      }),
      prisma.product.findMany({ where: { shopId } }),
      prisma.customer.count({ where: { shopId } }),
      prisma.serviceTicket.count({ where: { shopId, status: 'DELIVERED', updatedAt: { gte: monthStart } } }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: monthStart, lte: endOfDay(new Date()) } },
        _sum: { finalAmount: true }
      }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { finalAmount: true }
      })
    ]);

    const criticalStockCount = products.filter(p => p.stock <= p.criticalStock).length;

    const currentSales = Number(thisMonthSales._sum.finalAmount || 0);
    const prevSales = Number(prevMonthSales._sum.finalAmount || 0);
    let revenueGrowth = 0;
    if (prevSales > 0) {
      revenueGrowth = ((currentSales - prevSales) / prevSales) * 100;
    } else if (currentSales > 0) {
      revenueGrowth = 100;
    }

    return serializePrisma({
      activeServices,
      dailyRevenue: Number(dailySales._sum.finalAmount || 0),
      criticalStockCount,
      totalCustomers: customers,
      completedServicesThisMonth,
      revenueGrowth: Math.round(revenueGrowth),
      currentMonthRevenue: currentSales
    });
  } catch (error) {
    return serializePrisma({ activeServices: 0, dailyRevenue: 0, criticalStockCount: 0, totalCustomers: 0, completedServicesThisMonth: 0, revenueGrowth: 0, currentMonthRevenue: 0 });
  }
}
