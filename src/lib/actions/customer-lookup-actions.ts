"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function findCustomerByPhone(phone: string) {
  if (!phone || phone.length < 5) return null;
  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
      sales: { orderBy: { createdAt: "desc" }, take: 3 },
    }
  });
  return serializePrisma(customer);
}
