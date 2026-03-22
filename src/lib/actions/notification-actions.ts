import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function getSystemNotifications() {
  try {
    const notifications: any[] = [];

    // 1. Critical Stock Notifications
    const criticalStock = await prisma.product.findMany({
      where: { stock: { lte: prisma.product.fields.criticalStock } },
      include: { category: true }
    });

    criticalStock.forEach(p => {
      notifications.push({
        id: `stock-${p.id}`,
        type: "CRITICAL_STOCK",
        title: "Kritik Stok Uyarısı",
        message: `${p.name} ürünü için kritik stok seviyesine ulaşıldı. Kalan: ${p.stock}`,
        createdAt: p.updatedAt,
        priority: "HIGH"
      });
    });

    // 2. Overdue Service Tickets
    const overdueServices = await prisma.serviceTicket.findMany({
      where: {
        status: { notIn: ["DELIVERED", "CANCELLED"] },
        createdAt: { lte: new Date(new Date().setDate(new Date().getDate() - 3)) } // 3 days ago
      }
    });

    overdueServices.forEach(t => {
      notifications.push({
        id: `service-${t.id}`,
        type: "OVERDUE_SERVICE",
        title: "Geciken Servis",
        message: `${t.ticketNumber} numaralı servis kaydı 3 gündür tamamlanmadı.`,
        createdAt: t.createdAt,
        priority: "MEDIUM"
      });
    });

    return serializePrisma(notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  } catch (error) {
    return [];
  }
}
