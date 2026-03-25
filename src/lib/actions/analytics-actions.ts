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

    const services = await prisma.serviceTicket.findMany({
      where: {
        status: "DELIVERED",
        deliveredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        usedParts: true,
      },
    });

    const matrix = services.reduce((acc, ticket) => {
      const actualRevenue = Number(ticket.actualCost);
      const partsCost = ticket.usedParts.reduce((sum, part) => sum + (Number(part.costPrice) * part.quantity), 0);
      const overhead = Number(ticket.overhead);

      const netProfit = actualRevenue - (partsCost + overhead);

      acc.totalRevenue += actualRevenue;
      acc.totalPartsCost += partsCost;
      acc.totalOverhead += overhead;
      acc.totalNetProfit += netProfit;

      return acc;
    }, {
      totalRevenue: 0,
      totalPartsCost: 0,
      totalOverhead: 0,
      totalNetProfit: 0,
    });

    return serializePrisma(matrix);
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
      include: { usedParts: true },
    });

    const modelStats = services.reduce((acc: any, ticket) => {
      const model = ticket.deviceModel;
      const profit = Number(ticket.actualCost) - (
        ticket.usedParts.reduce((sum, p) => sum + (Number(p.costPrice) * p.quantity), 0) + Number(ticket.overhead)
      );

      if (!acc[model]) {
        acc[model] = { name: model, profit: 0, count: 0 };
      }
      acc[model].profit += profit;
      acc[model].count += 1;
      return acc;
    }, {});

    return serializePrisma(Object.values(modelStats).sort((a: any, b: any) => b.profit - a.profit).slice(0, 5));
  } catch (error) {
    console.error("Error calculating model profitability:", error);
    return [];
  }
}
