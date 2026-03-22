import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getStaff() {
  try {
    const staff = await prisma.user.findMany({
      include: {
        assignedTickets: {
          where: { status: "DELIVERED" }
        },
        sales: true
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function updateStaffCommission(userId: string, rate: number) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { commissionRate: rate }
    });
    revalidatePath("/personel");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Komisyon oranı güncellenemedi." };
  }
}

export async function getStaffPerformance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTickets: {
          where: { status: "DELIVERED" }
        },
        sales: true
      }
    });

    if (!user) return null;

    const totalServiceRevenue = user.assignedTickets.reduce((sum, t) => sum + Number(t.actualCost), 0);
    const totalSaleRevenue = user.sales.reduce((sum, s) => sum + Number(s.finalAmount), 0);
    const commission = (totalServiceRevenue + totalSaleRevenue) * (Number(user.commissionRate) / 100);

    return {
      serviceCount: user.assignedTickets.length,
      saleCount: user.sales.length,
      totalRevenue: totalServiceRevenue + totalSaleRevenue,
      commission: commission
    };
  } catch (error) {
    return null;
  }
}
