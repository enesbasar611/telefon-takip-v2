"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "CRITICAL_STOCK"
  | "DELIVERY_TIME"
  | "FINANCIAL_DELAY"
  | "COMPLETED"
  | "WARRANTY_EXPIRY"
  | "PENDING_APPROVAL";

export type NotificationCategory = "Tümü" | "Stok" | "Servis" | "Finans" | "Garanti";

export interface SystemNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: Date;
  referenceId?: string;
  status?: string;
  isRead?: boolean;
  isDeleted?: boolean;
  metadata?: any;
}

export async function getSystemNotifications(options?: {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 100; // Use a large number if not paginating for navbar
    const skip = (page - 1) * limit;

    const notifications: SystemNotification[] = [];
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Fetch user-specific notification states from DB
    const dbStates = await (prisma as any).notification.findMany({
      where: { isDeleted: false }
    });

    const deletedIds = new Set(await (prisma as any).notification.findMany({
      where: { isDeleted: true },
      select: { id: true }
    }).then((res: any[]) => res.map((r: any) => r.id)));

    const readIds = new Set(dbStates.filter((n: any) => n.isRead).map((n: any) => n.id));

    // 1. CRITICAL_STOCK (Stok)
    const criticalProducts = await prisma.product.findMany({
      where: { stock: { lte: prisma.product.fields.criticalStock } },
    });
    criticalProducts.forEach(p => {
      const id = `stock-${p.id}`;
      if (!deletedIds.has(id)) {
        notifications.push({
          id,
          type: "CRITICAL_STOCK",
          category: "Stok",
          title: `${p.name} stoğu ${p.stock} adetin altına düştü.`,
          message: `Stok kodu: ${p.sku || p.barcode || 'Yok'}. Acil tedarik gerekiyor.`,
          createdAt: p.updatedAt,
          referenceId: p.id,
          isRead: readIds.has(id)
        });
      }
    });

    // 2. FINANCIAL_DELAY (Finans)
    const suppliersWithDebt = await prisma.supplier.findMany({
      where: { balance: { gt: 0 } },
      orderBy: { updatedAt: 'asc' },
      take: 10
    });
    suppliersWithDebt.forEach(s => {
      const id = `fin-${s.id}`;
      if (!deletedIds.has(id)) {
        notifications.push({
          id,
          type: "FINANCIAL_DELAY",
          category: "Finans",
          title: `${s.name}'e ${Number(s.balance).toLocaleString('tr-TR')} TL borç ödemesi gecikmiş olabilir.`,
          message: `Son işlem tarihi: ${s.updatedAt.toLocaleDateString('tr-TR')}. Lütfen kontrol edin.`,
          createdAt: s.updatedAt,
          referenceId: s.id,
          isRead: readIds.has(id)
        });
      }
    });

    // 3. Servis & Garanti
    const tickets = await prisma.serviceTicket.findMany({
      include: { customer: true }
    });

    tickets.forEach(t => {
      // PENDING APPROVAL
      if (t.status === "PENDING" || t.status === "WAITING_PART") {
        const id = `pend-${t.id}`;
        if (!deletedIds.has(id)) {
          notifications.push({
            id,
            type: "PENDING_APPROVAL",
            category: "Servis",
            title: `${t.ticketNumber} Servis Kaydı Onay/Parça Bekliyor`,
            message: `Müşteri: ${t.customer.name} - ${t.deviceBrand} ${t.deviceModel}`,
            createdAt: t.updatedAt,
            referenceId: t.id,
            status: t.status,
            isRead: readIds.has(id),
            metadata: { cost: Number(t.estimatedCost), phone: t.customer.phone }
          });
        }
      }

      // COMPLETED
      if ((t.status === "READY" || t.status === "DELIVERED") && t.updatedAt >= threeDaysAgo) {
        const id = `comp-${t.id}`;
        if (!deletedIds.has(id)) {
          notifications.push({
            id,
            type: "COMPLETED",
            category: "Servis",
            title: `${t.deviceBrand} ${t.deviceModel} Onarımı Tamamlandı.`,
            message: `İşlem sıraya alındı ve teknisyene atandı / teslim edildi.`,
            createdAt: t.updatedAt,
            referenceId: t.id,
            status: t.status,
            isRead: readIds.has(id)
          });
        }
      }

      // DELIVERY_TIME
      if (t.estimatedDeliveryDate && t.estimatedDeliveryDate <= now && t.status !== "DELIVERED") {
        const id = `deliv-${t.id}`;
        if (!deletedIds.has(id)) {
          notifications.push({
            id,
            type: "DELIVERY_TIME",
            category: "Servis",
            title: `Teslimat günü: ${t.deviceBrand}`,
            message: `IMEI: ${t.imei || '...'}. Müşteri: ${t.customer.name}.`,
            createdAt: t.estimatedDeliveryDate,
            referenceId: t.id,
            status: t.status,
            isRead: readIds.has(id)
          });
        }
      }

      // WARRANTY_EXPIRY
      if (t.warrantyExpiry && t.warrantyExpiry > now && t.warrantyExpiry.getTime() - now.getTime() < 14 * 24 * 60 * 60 * 1000) {
        const id = `warr-${t.id}`;
        if (!deletedIds.has(id)) {
          const daysLeft = Math.ceil((t.warrantyExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          notifications.push({
            id,
            type: "WARRANTY_EXPIRY",
            category: "Garanti",
            title: "Garanti Bitiş Uyarısı",
            message: `${t.deviceBrand} ${t.deviceModel} garantisi ${daysLeft} gün sonra bitiyor.`,
            createdAt: now,
            referenceId: t.id,
            isRead: readIds.has(id)
          });
        }
      }
    });

    // 4. Stock AI Alerts (Pre-generated)
    const stockAlerts = await (prisma as any).stockAIAlert.findMany({
      where: {
        expiresAt: { gt: now },
        isRead: false
      },
      include: { product: true }
    });

    stockAlerts.forEach((a: any) => {
      const id = `ai-${a.id}`;
      if (!deletedIds.has(id)) {
        notifications.push({
          id,
          type: "CRITICAL_STOCK",
          category: "Stok",
          title: `AI Stok Uyarısı: ${a.product?.name || 'Ürün'}`,
          message: a.message,
          createdAt: a.createdAt,
          referenceId: a.productId,
          isRead: readIds.has(id) || a.isRead
        });
      }
    });

    // Filter by category if requested
    let filtered = notifications;
    if (options?.category && options.category !== "Tümü") {
      filtered = notifications.filter(n => n.category === options.category);
    }

    // Sort by date
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination for the feed
    const total = filtered.length;
    const paginated = options?.limit ? filtered.slice(skip, skip + limit) : filtered;

    return {
      notifications: serializePrisma(paginated),
      total,
      hasMore: skip + limit < total,
      unreadCount: filtered.filter(n => !n.isRead).length
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], total: 0, hasMore: false, unreadCount: 0 };
  }
}

export async function markNotificationAsReadAction(id: string) {
  try {
    await (prisma as any).notification.upsert({
      where: { id },
      update: { isRead: true },
      create: {
        id,
        type: "MANUAL",
        category: "Tümü",
        title: "Marked Read",
        message: "...",
        isRead: true
      }
    });

    // If it's an AI alert, mark that as read too
    if (id.startsWith("ai-")) {
      const dbId = id.replace("ai-", "");
      await (prisma as any).stockAIAlert.update({
        where: { id: dbId },
        data: { isRead: true }
      });
    }

    revalidatePath("/bildirimler");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    // 1. Mark all existing DB notifications as read
    await (prisma as any).notification.updateMany({
      where: { isDeleted: false },
      data: { isRead: true }
    });

    // 2. Mark AI alerts as read
    await (prisma as any).stockAIAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });

    // 3. Fetch all current "virtual" notifications and mark them as read by creating records
    const { notifications } = await getSystemNotifications({ limit: 100 });
    const unreadVirtuals = notifications.filter((n: any) => !n.isRead);

    if (unreadVirtuals.length > 0) {
      for (const n of unreadVirtuals) {
        await (prisma as any).notification.upsert({
          where: { id: n.id },
          update: { isRead: true },
          create: {
            id: n.id,
            type: n.type,
            category: n.category,
            title: n.title,
            message: n.message,
            isRead: true
          }
        });
      }
    }

    revalidatePath("/bildirimler");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }
}

export async function dismissNotificationAction(id: string) {
  try {
    await (prisma as any).notification.upsert({
      where: { id },
      update: { isDeleted: true },
      create: {
        id,
        type: "MANUAL",
        category: "Tümü",
        title: "Dismissed",
        message: "...",
        isDeleted: true
      }
    });

    // If it's an AI alert, mark that as read/deleted too
    if (id.startsWith("ai-")) {
      const dbId = id.replace("ai-", "");
      await (prisma as any).stockAIAlert.update({
        where: { id: dbId },
        data: { isRead: true }
      });
    }

    revalidatePath("/bildirimler");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
