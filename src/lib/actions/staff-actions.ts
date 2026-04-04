"use server";
import prisma from "@/lib/prisma";
import { serializePrisma, formatName } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function getStaff() {
  try {
    const shopId = await getShopId();
    const staff = await prisma.user.findMany({
      where: { shopId },
      include: {
        assignedTickets: {
          where: { status: "DELIVERED", shopId }
        },
        sales: {
          where: { shopId }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return serializePrisma(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function createStaff(data: {
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "TECHNICIAN" | "STAFF";
  commissionRate: number;
  password?: string;
  canSell?: boolean;
  canService?: boolean;
  canStock?: boolean;
  canFinance?: boolean;
}) {
  try {
    const shopId = await getShopId();
    const user = await prisma.user.create({
      data: {
        ...data,
        name: formatName(data.name),
        password: data.password || "password123",
        shopId
      }
    });
    revalidatePath("/personel");
    return { success: true, user: serializePrisma(user) };
  } catch (error) {
    console.error("Error creating staff:", error);
    return { success: false, error: "Personel eklenemedi." };
  }
}

export async function updateStaffCommission(userId: string, rate: number) {
  try {
    const shopId = await getShopId();
    await prisma.user.update({
      where: { id: userId, shopId },
      data: { commissionRate: rate }
    });
    revalidatePath("/personel");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Komisyon oranı güncellenemedi." };
  }
}

export async function deleteStaff(userId: string) {
  try {
    const shopId = await getShopId();
    await prisma.user.delete({ where: { id: userId, shopId } });
    revalidatePath("/personel");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Personel silinemedi." };
  }
}

export async function getStaffPerformance(userId: string) {
  try {
    const shopId = await getShopId();
    const user = await prisma.user.findUnique({
      where: { id: userId, shopId },
      include: {
        assignedTickets: {
          where: { status: "DELIVERED", shopId }
        },
        sales: {
          where: { shopId }
        }
      }
    });

    if (!user) return null;

    const totalServiceRevenue = user.assignedTickets.reduce((sum, t) => sum + Number(t.actualCost || 0), 0);
    const totalSaleRevenue = user.sales.reduce((sum, s) => sum + Number(s.finalAmount || 0), 0);
    const commission = (totalServiceRevenue + totalSaleRevenue) * (Number(user.commissionRate || 0) / 100);

    return {
      serviceCount: user.assignedTickets.length,
      saleCount: user.sales.length,
      totalRevenue: totalServiceRevenue + totalSaleRevenue,
      commission: commission
    };
  } catch (error) {
    console.error("Error fetching staff performance:", error);
    return {
      serviceCount: 0,
      saleCount: 0,
      totalRevenue: 0,
      commission: 0
    };
  }
}
export async function updateStaffName(userId: string, name: string) {
  try {
    const shopId = await getShopId();
    await prisma.user.update({
      where: { id: userId, shopId },
      data: { name: formatName(name) }
    });
    revalidatePath("/personel");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "İsim güncellenemedi." };
  }
}
