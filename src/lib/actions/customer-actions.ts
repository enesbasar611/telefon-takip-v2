import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  try {
    const customer = await prisma.customer.create({
      data,
    });
    revalidatePath("/musteriler");
    return { success: true, data: serializePrisma(customer) };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Müşteri oluşturulurken bir hata oluştu." };
  }
}

export async function updateCustomer(id: string, data: Partial<{
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}>) {
  const customer = await prisma.customer.update({
    where: { id },
    data,
  });
  revalidatePath("/musteriler");
  return customer;
}

export async function deleteCustomer(id: string) {
  // Check if customer has related data
  const ticketCount = await prisma.serviceTicket.count({ where: { customerId: id } });
  if (ticketCount > 0) {
    throw new Error("Müşterinin servis kayıtları olduğu için silinemez.");
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/musteriler");
}
