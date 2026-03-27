"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function findCustomerByPhone(phone: string) {
  if (!phone) return null;
  const sanitizedPhone = phone.replace(/\D/g, "");
  if (sanitizedPhone.length !== 10) return null;

  const customer = await prisma.customer.findUnique({
    where: { phone: sanitizedPhone },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
      sales: { orderBy: { createdAt: "desc" }, take: 3 },
    }
  });
  return serializePrisma(customer);
}
