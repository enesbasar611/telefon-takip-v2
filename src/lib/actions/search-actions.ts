"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function globalSearch(query: string) {
  if (!query || query.length < 2) return { customers: [], devices: [], tickets: [] };

  const [customers, devices, tickets] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ]
      },
      take: 5
    }),
    prisma.product.findMany({
      where: {
        AND: [
          { deviceInfo: { isNot: null } },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { deviceInfo: { imei: { contains: query } } },
            ]
          }
        ]
      },
      include: { deviceInfo: true },
      take: 5
    }),
    prisma.serviceTicket.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: query, mode: 'insensitive' } },
          { imei: { contains: query } },
        ]
      },
      include: { customer: true },
      take: 5
    })
  ]);

  return serializePrisma({ customers, devices, tickets });
}
