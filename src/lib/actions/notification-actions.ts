"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export type NotificationType =
  | "CRITICAL_STOCK"
  | "DELIVERY_TIME"
  | "FINANCIAL_DELAY"
  | "COMPLETED"
  | "WARRANTY_EXPIRY"
  | "PENDING_APPROVAL"
  | "DEBT_TRACKING";

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
  snoozedUntil?: Date;
  metadata?: any;
}

export async function getSystemNotifications(options?: {
  page?: number;
  limit?: number;
  category?: NotificationCategory;
  showSnoozed?: boolean;
}) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { notifications: [], total: 0, hasMore: false, unreadCount: 0 };
    const page = options?.page || 1;
    const limit = options?.limit || 100; // Use a large number if not paginating for navbar
    const skip = (page - 1) * limit;

    const notifications: SystemNotification[] = [];
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Fetch all notification states from DB including deleted ones to check metadata
    const dbStates = await (prisma as any).notification.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" }
    });

    const deletedIds = new Set<string>();
    const readIds = new Set<string>();
    const snoozedIds = new Map<string, Date>();
    const dismissedMetadata = new Map<string, any>();

    dbStates.forEach((n: any) => {
      if (n.isDeleted) {
        deletedIds.add(n.id);
        if (n.metadata) dismissedMetadata.set(n.id, n.metadata);
      }
      if (n.isRead) readIds.add(n.id);
      if (n.snoozedUntil && new Date(n.snoozedUntil) > now) {
        snoozedIds.set(n.id, new Date(n.snoozedUntil));
      }
    });

    const shouldIncludeFn = (id: string) => {
      const isSnoozed = snoozedIds.has(id);
      return options?.showSnoozed ? isSnoozed : !isSnoozed;
    };

    dbStates.forEach((n: any) => {
      if (!n.id.startsWith("stock-") && !n.id.startsWith("fin-") && !n.id.startsWith("pend-") && !n.id.startsWith("comp-") && !n.id.startsWith("deliv-") && !n.id.startsWith("warr-") && !n.id.startsWith("ai-") && !n.id.startsWith("debt-") && !n.isDeleted && shouldIncludeFn(n.id)) {
        notifications.push({
          id: n.id,
          type: n.type as any,
          category: (n.category === "SYSTEM" ? "Tümü" : n.category) as any,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          referenceId: n.referenceId,
          status: n.status,
          isRead: n.isRead,
          metadata: n.metadata
        });
      }
    });

    // 1. CRITICAL_STOCK (Stok)
    const criticalProducts = await prisma.product.findMany({
      where: {
        shopId,
        stock: { lte: prisma.product.fields.criticalStock }
      },
    });
    criticalProducts.forEach(p => {
      const id = `stock-${p.id}`;
      // Smart delete: only hide if deleted AND stock level hasn't changed since deletion
      let isDeleted = deletedIds.has(id);
      if (isDeleted && dismissedMetadata.has(id)) {
        const lastStock = dismissedMetadata.get(id)?.stock;
        if (lastStock !== undefined && lastStock !== p.stock) {
          isDeleted = false; // Stock changed, show it again
        }
      }

      if (!isDeleted && shouldIncludeFn(id)) {
        notifications.push({
          id,
          type: "CRITICAL_STOCK",
          category: "Stok",
          title: `${p.name} stoğu ${p.stock} adetin altına düştü.`,
          message: `Stok kodu: ${p.sku || p.barcode || 'Yok'}. Acil tedarik gerekiyor.`,
          createdAt: p.updatedAt,
          referenceId: p.id,
          isRead: readIds.has(id),
          metadata: { stock: p.stock } // Include current stock for dismiss action
        });
      }
    });

    // 2. FINANCIAL_DELAY (Finans)
    const suppliersWithDebt = await prisma.supplier.findMany({
      where: {
        shopId,
        balance: { gt: 0 }
      },
      orderBy: { updatedAt: 'asc' },
      take: 10
    });
    suppliersWithDebt.forEach(s => {
      const id = `fin-${s.id}`;
      if (!deletedIds.has(id) && shouldIncludeFn(id)) {
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
      where: { shopId },
      include: { customer: true }
    });

    tickets.forEach(t => {
      // PENDING APPROVAL
      if (t.status === "PENDING" || t.status === "WAITING_PART") {
        const id = `pend-${t.id}`;
        if (!deletedIds.has(id) && shouldIncludeFn(id)) {
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
        if (!deletedIds.has(id) && shouldIncludeFn(id)) {
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
        if (!deletedIds.has(id) && shouldIncludeFn(id)) {
          const delayDays = Math.floor((now.getTime() - t.estimatedDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
          const delayMsg = delayDays > 0 ? `${delayDays} gün gecikti!` : "Bugün teslim edilmeli!";
          notifications.push({
            id,
            type: "DELIVERY_TIME",
            category: "Servis",
            title: `${t.ticketNumber} Servis Gecikti!`,
            message: `${delayMsg} Müşteri: ${t.customer.name}`,
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
        if (!deletedIds.has(id) && shouldIncludeFn(id)) {
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
        isRead: false,
        shopId
      },
      include: { product: true }
    });

    stockAlerts.forEach((a: any) => {
      const id = `ai-${a.id}`;
      if (!deletedIds.has(id) && shouldIncludeFn(id)) {
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

    // 5. DEBT_TRACKING (Finans)
    const trackedDebts = await prisma.debt.findMany({
      where: {
        shopId,
        isTracking: true,
        isPaid: false,
        dueDate: { lte: now }
      },
      include: { customer: true }
    });

    trackedDebts.forEach(d => {
      const id = `debt-${d.id}`;
      if (!deletedIds.has(id) && shouldIncludeFn(id)) {
        notifications.push({
          id,
          type: "DEBT_TRACKING",
          category: "Finans",
          title: `Ödeme Günü: ${d.customer.name}`,
          message: `${Number(d.remainingAmount).toLocaleString('tr-TR')} TL tahsilat bekliyor. Ödeme sözü tarihi: ${d.dueDate?.toLocaleDateString('tr-TR')}`,
          createdAt: d.dueDate || d.updatedAt,
          referenceId: d.id,
          isRead: readIds.has(id)
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
      unreadCount: notifications.filter(n => !n.isRead && !snoozedIds.has(n.id)).length,
      snoozedCount: snoozedIds.size
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], total: 0, hasMore: false, unreadCount: 0 };
  }
}

export async function markNotificationAsReadAction(id: string) {
  try {
    const shopId = await getShopId();
    await (prisma as any).notification.upsert({
      where: { id },
      update: { isRead: true },
      create: {
        id,
        type: "MANUAL",
        category: "Tümü",
        title: "Marked Read",
        message: "...",
        isRead: true,
        shopId
      }
    });

    // If it's an AI alert, mark that as read too
    if (id.startsWith("ai-")) {
      const dbId = id.replace("ai-", "");
      await (prisma as any).stockAIAlert.update({
        where: { id: dbId, shopId },
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
    const shopId = await getShopId();
    // 1. Mark all existing DB notifications as read
    await (prisma as any).notification.updateMany({
      where: { isDeleted: false, shopId },
      data: { isRead: true }
    });

    // 2. Mark AI alerts as read
    await (prisma as any).stockAIAlert.updateMany({
      where: { isRead: false, shopId },
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
            isRead: true,
            shopId
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



export async function dismissNotificationAction(id: string, metadata?: any) {
  try {
    const shopId = await getShopId();
    await (prisma as any).notification.upsert({
      where: { id },
      update: { isDeleted: true, metadata },
      create: {
        id,
        type: "MANUAL",
        category: "Tümü",
        title: "Dismissed",
        message: "...",
        isDeleted: true,
        metadata,
        shopId
      }
    });

    // If it's an AI alert, mark that as read/deleted too
    if (id.startsWith("ai-")) {
      const dbId = id.replace("ai-", "");
      await (prisma as any).stockAIAlert.update({
        where: { id: dbId, shopId },
        data: { isRead: true }
      });
    }

    revalidatePath("/bildirimler");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Dismiss error:", error);
    return { success: false };
  }
}
export async function snoozeNotificationAction(id: string, hours: number = 24) {
  try {
    const shopId = await getShopId();
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Find or create notification state
    await prisma.notification.upsert({
      where: { id },
      // @ts-ignore
      update: { snoozedUntil },
      create: {
        id,
        shopId,
        title: "Ertelenmiş Bildirim",
        message: "Bu bildirim kullanıcı tarafından ertelendi.",
        type: "SYSTEM",
        category: "SYSTEM",
        // @ts-ignore
        snoozedUntil
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Snooze error:", error);
    return { success: false, error: "Bildirim ertelenemedi" };
  }
}

export async function unsnoozeNotificationAction(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      // @ts-ignore
      data: { snoozedUntil: null }
    });

    revalidatePath("/bildirimler");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Unsnooze error:", error);
    return { success: false, error: "Bildirim ertelemesi kaldırılamadı" };
  }
}
export async function getBrowserNotificationPreference() {
  try {
    const session = await (await import("@/lib/auth")).getSession();
    if (!session?.user?.id) return false;

    const user = await (prisma.user as any).findUnique({
      where: { id: session.user.id },
      select: { browserNotificationsEnabled: true }
    } as any);

    return user?.browserNotificationsEnabled || false;
  } catch (error) {
    console.error("Error getting browser notification preference:", error);
    return false;
  }
}

export async function updateBrowserNotificationPreference(enabled: boolean) {
  try {
    const session = await (await import("@/lib/auth")).getSession();
    if (!session?.user?.id) return { success: false };

    await (prisma.user as any).update({
      where: { id: session.user.id },
      data: { browserNotificationsEnabled: enabled }
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error updating browser notification preference:", error);
    return { success: false };
  }
}
