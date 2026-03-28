"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function findCustomerByPhone(phone: string) {
  if (!phone) return null;
  const sanitizedPhone = phone.replace(/\D/g, "");
  if (sanitizedPhone.length < 7) return null;

  const customer = await prisma.customer.findFirst({
    where: { phone: { contains: sanitizedPhone } },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
      sales: { orderBy: { createdAt: "desc" }, take: 3 },
    }
  });
  return serializePrisma(customer);
}

export async function findCustomerByName(name: string) {
  if (!name || name.trim().length < 2) return [];
  const customers = await prisma.customer.findMany({
    where: { name: { contains: name.trim(), mode: "insensitive" } },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
      sales: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(customers);
}

