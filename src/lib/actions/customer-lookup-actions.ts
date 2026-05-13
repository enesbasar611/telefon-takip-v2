"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

export async function findCustomerByPhone(phone: string) {
  if (!phone) return null;
  const sanitizedPhone = phone.replace(/\D/g, "");
  if (sanitizedPhone.length < 7) return null;

  const shopId = await getShopId();

  const customer = await prisma.customer.findFirst({
    where: { shopId, phone: { contains: sanitizedPhone } },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
      sales: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: {
        select: { tickets: true }
      },
    }
  });
  return serializePrisma(customer);
}

export async function findCustomerByName(name: string) {
  if (!name || name.trim().length < 2) return [];
  const shopId = await getShopId();
  const customers = await prisma.customer.findMany({
    where: { shopId, name: { contains: name.trim(), mode: "insensitive" } },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
      sales: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: {
        select: { tickets: true }
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  return serializePrisma(customers);
}

