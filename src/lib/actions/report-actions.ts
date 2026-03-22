import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";

export async function getSalesReport() {
  try {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
        finalAmount: true,
      },
    });

    const dailyData = eachDayOfInterval({ start, end }).map((day) => {
      const daySales = sales.filter((s) => {
        const saleDate = new Date(s.createdAt);
        return saleDate.getDate() === day.getDate() &&
               saleDate.getMonth() === day.getMonth() &&
               saleDate.getFullYear() === day.getFullYear();
      });

      const total = daySales.reduce((acc, s) => acc + Number(s.finalAmount), 0);

      return {
        date: format(day, "dd MMM"),
        total,
      };
    });

    return dailyData;
  } catch (error) {
    console.error("Error fetching sales report:", error);
    return [];
  }
}

export async function getServiceVolumeReport() {
  try {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const tickets = await prisma.serviceTicket.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const statusSummary = await prisma.serviceTicket.groupBy({
      by: ['status'],
      _count: true,
    });

    return statusSummary.map((s) => ({
      name: s.status,
      count: s._count,
    }));
  } catch (error) {
    console.error("Error fetching service volume report:", error);
    return [];
  }
}
