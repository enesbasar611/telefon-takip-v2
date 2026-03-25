"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfWeek, startOfMonth, subMonths, endOfDay } from "date-fns";

export async function getProfitMatrix(range: string = "THIS_MONTH") {
  try {
    let startDate = startOfMonth(new Date());
    const endDate = endOfDay(new Date());

    if (range === "THIS_WEEK") {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (range === "LAST_MONTH") {
      startDate = startOfMonth(subMonths(new Date(), 1));
    }

    const [services, returns] = await Promise.all([
      prisma.serviceTicket.findMany({
        where: {
          status: "DELIVERED",
          deliveredAt: { gte: startDate, lte: endDate },
        },
        include: { usedParts: true },
      }),
      prisma.returnTicket.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const serviceStats = services.reduce((acc, ticket) => {
      const actualRevenue = Number(ticket.actualCost);
      const partsCost = ticket.usedParts.reduce((sum, part) => sum + (Number(part.costPrice) * part.quantity), 0);
      const overhead = Number(ticket.overhead);

      acc.totalRevenue += actualRevenue;
      acc.totalPartsCost += partsCost;
      acc.totalOverhead += overhead;

      return acc;
    }, {
      totalRevenue: 0,
      totalPartsCost: 0,
      totalOverhead: 0,
    });

    const returnLosses = returns.reduce((sum, ret) => sum + Number(ret.lossAmount), 0);
    const netProfit = serviceStats.totalRevenue - (serviceStats.totalPartsCost + serviceStats.totalOverhead + returnLosses);

    return serializePrisma({
      ...serviceStats,
      totalReturnLosses: returnLosses,
      totalNetProfit: netProfit,
    });
  } catch (error) {
    console.error("Error calculating profit matrix:", error);
    return { totalRevenue: 0, totalPartsCost: 0, totalOverhead: 0, totalNetProfit: 0 };
  }
}

export async function getTopRepairedModels(limit: number = 5) {
  try {
    const tickets = await prisma.serviceTicket.groupBy({
      by: ['deviceModel'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return serializePrisma(tickets.map(t => ({
      model: t.deviceModel,
      count: t._count.id,
    })));
  } catch (error) {
    console.error("Error fetching top repaired models:", error);
    return [];
  }
}

export async function getProfitabilityByModel() {
  try {
    const services = await prisma.serviceTicket.findMany({
      where: { status: "DELIVERED" },
      include: { usedParts: true, returns: true },
    });

    const modelStats = services.reduce((acc: any, ticket) => {
      const model = ticket.deviceModel;
      const partCost = ticket.usedParts.reduce((sum, p) => sum + (Number(p.costPrice) * p.quantity), 0);
      const returnLoss = ticket.returns.reduce((sum, r) => sum + Number(r.lossAmount), 0);

      const profit = Number(ticket.actualCost) - (partCost + Number(ticket.overhead) + returnLoss);

      if (!acc[model]) {
        acc[model] = { name: model, profit: 0, count: 0, returns: 0 };
      }
      acc[model].profit += profit;
      acc[model].count += 1;
      acc[model].returns += ticket.returns.length;
      return acc;
    }, {});

    return serializePrisma(Object.values(modelStats).sort((a: any, b: any) => b.profit - a.profit).slice(0, 5));
  } catch (error) {
    console.error("Error calculating model profitability:", error);
    return [];
  }
}

export async function getReturnAnalytics() {
  try {
    const products = await prisma.product.findMany({
      where: { returns: { some: {} } },
      include: {
        returns: true,
        usedInServices: true,
      }
    });

    const analytics = products.map(p => {
      const totalUses = p.usedInServices.length;
      const totalReturns = p.returns.filter(r => r.returnReason !== "CUSTOMER_CANCEL").length;
      const rate = totalUses > 0 ? (totalReturns / totalUses) : 0;

      return {
        id: p.id,
        name: p.name,
        totalUses,
        totalReturns,
        returnRate: rate,
        isChronic: p.isChronic,
        supplierId: p.supplierId,
      };
    });

    return serializePrisma(analytics.sort((a, b) => b.returnRate - a.returnRate));
  } catch (error) {
    console.error("Error fetching return analytics:", error);
    return [];
  }
}
