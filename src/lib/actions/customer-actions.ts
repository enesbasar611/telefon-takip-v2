"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        tickets: true,
        sales: true,
        debts: true
      },
      orderBy: { updatedAt: "desc" }
    });
    return serializePrisma(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        tickets: { orderBy: { createdAt: "desc" } },
        sales: {
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: "desc" }
        },
        debts: { orderBy: { createdAt: "desc" } }
      }
    });
    return serializePrisma(customer);
  } catch (error) {
    return null;
  }
}

export async function createCustomer(data: { name: string; phone: string; email?: string; address?: string; notes?: string }) {
  try {
    const customer = await prisma.customer.create({ data });
    revalidatePath("/musteriler");
    return { success: true, customer: serializePrisma(customer) };
  } catch (error) {
    return { success: false, error: "Müşteri oluşturulurken hata oluştu." };
  }
}

export async function deleteCustomer(id: string) {
    try {
      await prisma.customer.delete({ where: { id } });
      revalidatePath("/musteriler");
      return { success: true };
    } catch (error) {
      return { success: false, error: "Müşteri silinemedi. Aktif kayıtları olabilir." };
    }
}
