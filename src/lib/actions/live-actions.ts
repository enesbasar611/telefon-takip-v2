"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

export async function getLiveActivity() {
  try {
    const shopId = await getShopId();
    const [serviceLogs, transactions] = await Promise.all([
      prisma.serviceLog.findMany({
        where: { shopId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { ticket: { include: { customer: true } } }
      }),
      prisma.transaction.findMany({
        where: { shopId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { sale: { include: { customer: true } } }
      })
    ]);

    const activity = [
      ...serviceLogs.map(log => ({
        id: `log-${log.id}`,
        type: 'SERVICE',
        title: log.ticket.ticketNumber,
        message: log.message,
        time: log.createdAt,
        user: log.ticket.customer?.name || 'Müşteri',
        status: log.status
      })),
      ...transactions.map(tr => ({
        id: `tr-${tr.id}`,
        type: 'FINANCE',
        title: tr.type === 'INCOME' ? 'Tahsilat' : 'Gider',
        message: tr.description,
        time: tr.createdAt,
        user: tr.sale?.customer?.name || 'Hızlı Satış',
        amount: Number(tr.amount)
      }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

    return serializePrisma(activity);
  } catch (error) {
    return [];
  }
}
