import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function getCustomers() {
  return await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const customer = await prisma.customer.create({
    data,
  });
  revalidatePath("/musteriler");
  return customer;
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
