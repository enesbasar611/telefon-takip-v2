import { getStaff } from "@/lib/actions/staff-actions";
import { StaffManagementClient } from "@/components/staff/staff-management-client";
import prisma from "@/lib/prisma";
import { getShopId, getSession } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function PersonelPage() {
  const staff = await getStaff();
  const shopId = await getShopId();

  // Fetch recent activities for the Audit Log
  const serviceLogs = await prisma.serviceLog.findMany({
    where: { shopId },
    include: { ticket: { include: { technician: true } } },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  const sales = await prisma.sale.findMany({
    where: { shopId },
    include: { user: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  // Combine and format for the log feed
  const combinedLogs = [
    ...serviceLogs.map(log => ({
      id: log.id,
      type: 'service',
      user: log.ticket.technician || { name: 'Sistem' },
      message: `servis kaydını güncelledi: #${log.ticket.ticketNumber}`,
      createdAt: log.createdAt.toISOString()
    })),
    ...sales.map(sale => ({
      id: sale.id,
      type: 'sale',
      user: sale.user || { name: 'Sistem' },
      message: `satış işlemi gerçekleştirdi: ${Number(sale.finalAmount).toLocaleString('tr-TR')} ₺`,
      createdAt: sale.createdAt.toISOString()
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  const session = await getSession();
  const userRole = session?.user?.role;

  return (
    <StaffManagementClient
      staff={serializePrisma(staff)}
      logs={serializePrisma(combinedLogs)}
      userRole={userRole}
    />
  );
}



