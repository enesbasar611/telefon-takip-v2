"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  try {
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const sales = await prisma.sale.findMany({
      where: {
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

    return trend;
  } catch (error) {
    return [];
  }
}

export async function getServiceMetrics() {
  try {
    const statuses = await prisma.serviceTicket.groupBy({
      by: ['status'],
      _count: true
    });

    const metrics = statuses.map(s => ({
      name: s.status,
      value: s._count
    }));

    return metrics;
  } catch (error) {
    return [];
  }
}

export async function getDashboardStats() {
    try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const [activeServices, dailySales, criticalStock, customers] = await Promise.all([
            prisma.serviceTicket.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
            prisma.sale.aggregate({
                where: { createdAt: { gte: todayStart, lte: todayEnd } },
                _sum: { finalAmount: true }
            }),
            prisma.product.count({ where: { stock: { lte: prisma.product.fields.criticalStock } } }),
            prisma.customer.count()
        ]);

        return {
            activeServices,
            dailyRevenue: Number(dailySales._sum.finalAmount || 0),
            criticalStockCount: criticalStock,
            totalCustomers: customers
        };
    } catch (error) {
        return { activeServices: 0, dailyRevenue: 0, criticalStockCount: 0, totalCustomers: 0 };
    }
}
