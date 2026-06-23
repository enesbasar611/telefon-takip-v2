"use server";
import { unstable_cache } from "next/cache";
import { Role, CommissionStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { serializePrisma, formatName } from "@/lib/utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { getShopId, getUserId, auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { getDefaultStaffPermissions } from "@/lib/staff-permissions";
import { recordAuditLog } from "./audit-actions";
import { createStaffArchive } from "./staff-finance-actions";

/**
 * Yardımcı: Ortak revalidasyon işlemleri
 */
async function triggerStaffRevalidate(shopId: string) {
    revalidatePath("/personel");
    revalidateTag(`staff-${shopId}`);
}

/**
 * Checks if a user has an active leave today.
 */
export async function checkActiveLeave(userId: string) {
    try {
        const shopId = await getShopId();
        const now = new Date();
        const activeLeave = await prisma.leaveRequest.findFirst({
            where: { userId, shopId, startDate: { lte: now }, endDate: { gte: now } }
        });
        return { isLeave: !!activeLeave, leave: activeLeave ? serializePrisma(activeLeave) : null };
    } catch (error) {
        return { isLeave: false, leave: null };
    }
}

/**
 * Personel listesini detaylı getirir
 */
export const getStaff = async (shopId?: string) => {
    const finalShopId = shopId || await getShopId();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const staff = await prisma.user.findMany({
            where: { shopId: finalShopId },
            include: {
                assignedTickets: { where: { status: "DELIVERED", shopId: finalShopId, updatedAt: { gte: startOfMonth } } },
                sales: { where: { shopId: finalShopId, createdAt: { gte: startOfMonth } } },
                staffCommissions: { where: { shopId: finalShopId, status: CommissionStatus.APPROVED, createdAt: { gte: startOfMonth } } },
                shortageTasks: { where: { shopId: finalShopId } },
                leaveRequests: { where: { shopId: finalShopId } }
            },
            orderBy: { createdAt: "desc" }
        });
        return serializePrisma(staff);
    } catch (error) {
        console.error("getStaff error:", error);
        return [];
    }
};

/**
 * Hafif personel listesi
 */
export const getStaffShell = async (shopId?: string) => {
    const finalShopId = shopId || await getShopId();
    return unstable_cache(
        async () => {
            const staff = await prisma.user.findMany({
                where: { shopId: finalShopId },
                select: { id: true, name: true, surname: true, role: true },
                orderBy: { createdAt: "desc" }
            });
            return serializePrisma(staff);
        },
        [`staff-shell-${finalShopId}`],
        { tags: [`staff-${finalShopId}`], revalidate: 3600 }
    )();
};

/**
 * Mevcut kullanıcı profilini getirir
 */
export async function getProfile() {
    try {
        const userId = await getUserId();
        const shopId = await getShopId(false);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                shop: true,
                ...(shopId ? {
                    assignedTickets: {
                        where: { shopId },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                        include: { customer: { select: { name: true } } }
                    }
                } : {})
            }
        });
        if (!user) return null;
        return serializePrisma({ ...user, hasPassword: !!user.password });
    } catch (error) {
        return null;
    }
}

/**
 * Yeni personel oluşturur
 */
export async function createStaff(data: any) {
    try {
        const shopId = await getShopId();
        const session = await auth();

        if (data.role === Role.SUPER_ADMIN && session?.user?.role !== Role.SUPER_ADMIN) {
            return { success: false, error: "Yetki yetersiz." };
        }

        const normalizedEmail = data.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) return { success: false, error: "Bu e-posta zaten kullanımda." };

        const hashedPassword = await bcrypt.hash(data.password || "password123", 10);
        const defaults = getDefaultStaffPermissions(data.role);

        const user = await (prisma.user as any).create({
            data: {
                name: formatName(data.name),
                surname: data.surname ? formatName(data.surname) : undefined,
                email: normalizedEmail,
                phone: data.phone?.replace(/\D/g, ''),
                image: data.image,
                role: data.role,
                password: hashedPassword,
                canSell: data.canSell ?? defaults.canSell,
                canService: data.canService ?? defaults.canService,
                canStock: data.canStock ?? defaults.canStock,
                canFinance: data.canFinance ?? defaults.canFinance,
                canDelete: data.canDelete ?? defaults.canDelete,
                canEdit: data.canEdit ?? defaults.canEdit,
                baseSalary: Number(data.baseSalary || 0),
                salaryCurrency: data.salaryCurrency || "TRY",
                serviceCommissionAmount: Number(data.serviceCommissionAmount || 0),
                isApproved: true,
                shopId
            }
        });

        await triggerStaffRevalidate(shopId);
        await recordAuditLog({
            action: "CREATE", entityType: "STAFF", entityId: user.id,
            entityName: `${user.name || ""} ${user.surname || ""}`.trim() || undefined,
            message: `${user.name} personeli eklendi.`
        });

        return { success: true, user: serializePrisma(user) };
    } catch (error) {
        return { success: false, error: "Personel eklenemedi." };
    }
}

/**
 * Personel bilgilerini günceller
 */
export async function updateStaff(userId: string, data: any) {
    try {
        const shopId = await getShopId();
        const session = await auth();
        const target = await prisma.user.findUnique({ where: { id: userId, shopId } });

        if (!target) return { success: false, error: "Personel bulunamadı." };
        if (target.role === Role.SUPER_ADMIN && session?.user?.id !== userId && session?.user?.role !== Role.SUPER_ADMIN) {
            return { success: false, error: "Süper Admin yetkisi korunuyor." };
        }

        const updateData: any = { ...data };
        if (data.name) updateData.name = formatName(data.name);
        if (data.surname) updateData.surname = formatName(data.surname);
        if (data.phone) updateData.phone = data.phone.replace(/\D/g, '');
        if (data.baseSalary) updateData.baseSalary = Number(data.baseSalary);
        if (data.serviceCommissionAmount !== undefined) updateData.serviceCommissionAmount = Number(data.serviceCommissionAmount);

        if (data.password?.length > 0) updateData.password = await bcrypt.hash(data.password, 10);
        else delete updateData.password;

        await (prisma.user as any).update({ where: { id: userId, shopId }, data: updateData });

        await triggerStaffRevalidate(shopId);
        await recordAuditLog({
            action: "UPDATE", entityType: "STAFF", entityId: userId,
            entityName: `${target.name || ""} ${target.surname || ""}`.trim() || undefined,
            message: `${target.name} personeli güncellendi.`
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: "Güncelleme başarısız." };
    }
}

/**
 * Personel silme öncesi kontrol
 */
export async function checkStaffDeletion(userId: string) {
    try {
        const shopId = await getShopId();
        const user = await prisma.user.findUnique({
            where: { id: userId, shopId },
            include: {
                _count: {
                    select: {
                        assignedTickets: { where: { status: { not: "DELIVERED" } } },
                        shortageTasks: { where: { isResolved: false } }
                    }
                }
            }
        });
        if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
        const pendingTasks = user._count.assignedTickets + user._count.shortageTasks;
        return { success: true, hasPendingTasks: pendingTasks > 0, pendingTasks, role: user.role };
    } catch (error) {
        return { success: false, error: "Kontrol yapılamadı." };
    }
}

/**
 * 3 FAZLI PERSONEL SİLME SİSTEMİ (Transaction Safety)
 */
export async function deleteStaff(userId: string, options?: any) {
    try {
        const shopId = await getShopId();
        const session = await auth();
        const targetUser = await prisma.user.findUnique({ where: { id: userId, shopId } });
        if (!targetUser) return { success: false, error: "Personel bulunamadı." };
        if (targetUser.role === Role.SUPER_ADMIN && session?.user?.role !== Role.SUPER_ADMIN) return { success: false, error: "Süper Admin silinemez." };

        // FAZ 1: Arşiv ve Nullable İşlemler
        await createStaffArchive(userId);
        const tables = ["Transaction", "Sale", "ReturnTicket", "InventoryLog", "ServiceTicket", "DailySession"];
        for (const t of tables) {
            try { await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" ALTER COLUMN "${t === "ServiceTicket" ? "createdById" : (t === "DailySession" ? "openedById" : "userId")}" DROP NOT NULL`); } catch (e) { }
        }

        // Maaş Ödemesi
        if (options?.salaryPayment?.amount > 0) {
            const acc = await prisma.financeAccount.findUnique({ where: { id: options.salaryPayment.accountId } });
            if (acc) {
                const bal = Number(acc.balance) - options.salaryPayment.amount;
                await prisma.transaction.create({ data: { type: "EXPENSE", amount: options.salaryPayment.amount, description: options.salaryPayment.description, category: "MAAŞ", paymentMethod: acc.type === "CASH" ? "CASH" : "TRANSFER", financeAccountId: acc.id, userId: session!.user.id, shopId, runningBalance: bal } });
                await prisma.financeAccount.update({ where: { id: acc.id }, data: { balance: bal, availableBalance: acc.type === "CREDIT_CARD" ? (Number(acc.limit || 0) - bal) : bal } });
            }
        }

        // FAZ 2: Hızlı Transaction
        await prisma.$transaction(async (tx) => {
            if (options?.action === 'TRANSFER' && options.transferToId) {
                await tx.shortageItem.updateMany({ where: { assignedToId: userId, isResolved: false }, data: { assignedToId: options.transferToId } });
                await tx.serviceTicket.updateMany({ where: { technicianId: userId, status: { not: "DELIVERED" } }, data: { technicianId: options.transferToId } });
            } else if (options?.action === 'DELETE_ALL') {
                await tx.shortageItem.deleteMany({ where: { assignedToId: userId, isResolved: false } });
            } else {
                await tx.shortageItem.updateMany({ where: { assignedToId: userId, isResolved: false }, data: { assignedToId: null } });
                await tx.serviceTicket.updateMany({ where: { technicianId: userId, status: { not: "DELIVERED" } }, data: { technicianId: null } });
            }

            const rawUpdate = (table: string, col: string) => tx.$executeRawUnsafe(`UPDATE "${table}" SET "${col}" = NULL WHERE "${col}" = '${userId}'`);
            await Promise.all([
                rawUpdate("Transaction", "userId"), rawUpdate("Sale", "userId"), rawUpdate("ReturnTicket", "userId"),
                rawUpdate("InventoryLog", "userId"), rawUpdate("ServiceTicket", "createdById"), rawUpdate("ServiceTicket", "technicianId"),
                rawUpdate("DailySession", "openedById"), rawUpdate("DailySession", "closedById"), rawUpdate("PurchaseOrder", "responsibleId"),
                rawUpdate("Reminder", "assignedTo"), rawUpdate("AuditLog", "userId"), rawUpdate("MonthlyStaffArchive", "userId")
            ]);

            await tx.staffCommission.deleteMany({ where: { userId } });
            await tx.staffExpense.deleteMany({ where: { userId } });
            await tx.leaveRequest.deleteMany({ where: { userId } });
            await tx.user.delete({ where: { id: userId } });
        }, { timeout: 30000 });

        // FAZ 3: Temizlik
        await triggerStaffRevalidate(shopId);
        await recordAuditLog({
            action: "DELETE",
            entityType: "STAFF",
            entityId: userId,
            entityName: `${targetUser.name || ""} ${targetUser.surname || ""}`.trim() || undefined,
            message: "Personel silindi."
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Personel performansı
 */
export async function getStaffPerformance(userId?: string) {
    try {
        const shopId = await getShopId();
        const uid = userId === "current" || !userId ? await getUserId() : userId;
        const user = await prisma.user.findUnique({
            where: { id: uid, shopId },
            include: { assignedTickets: { where: { status: "DELIVERED", shopId } }, sales: { where: { shopId } } }
        });
        if (!user) return null;
        const rev = user.assignedTickets.reduce((s, t) => s + Number(t.actualCost || 0), 0) + user.sales.reduce((s, sl) => s + Number(sl.finalAmount || 0), 0);
        return { serviceCount: user.assignedTickets.length, saleCount: user.sales.length, totalRevenue: rev, commission: rev * (Number(user.commissionRate || 0) / 100) };
    } catch (error) { return null; }
}

function formatLogs(svc: any[], sls: any[], adt: any[]) {
    return [
        ...svc.map(l => ({ id: l.id, type: 'service', user: l.ticket.technician || { name: 'Sitem' }, message: `güncelleme: #${l.ticket.ticketNumber}`, createdAt: l.createdAt })),
        ...sls.map(s => ({ id: s.id, type: 'sale', user: s.user || { name: 'Sistem' }, message: `satış: ${Number(s.finalAmount).toLocaleString()} TL`, createdAt: s.createdAt })),
        ...adt.map(a => ({ id: a.id, type: 'audit', user: a.user || { name: 'Sistem' }, message: a.message, createdAt: a.createdAt }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getStaffLogs(page = 1, limit = 10, search?: string, date?: string) {
    try {
        const shopId = await getShopId();
        const where: any = { shopId };
        if (date) {
            const d = new Date(date); d.setHours(0, 0, 0, 0);
            where.createdAt = { gte: d, lte: new Date(d.getTime() + 86400000) };
        }
        const [svc, sls, adt] = await Promise.all([
            prisma.serviceLog.findMany({ where, include: { ticket: { include: { technician: true } } } }),
            prisma.sale.findMany({ where, include: { user: true } }),
            prisma.auditLog.findMany({ where, include: { user: true } })
        ]);
        let logs = formatLogs(svc, sls, adt);
        if (search) logs = logs.filter(l => l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.message.toLowerCase().includes(search.toLowerCase()));
        return { success: true, logs: serializePrisma(logs.slice((page - 1) * limit, page * limit)), totalPages: Math.ceil(logs.length / limit), total: logs.length };
    } catch (error) { return { success: false, logs: [], totalPages: 0, total: 0 }; }
}

export async function updateProfile(data: any) {
    try {
        const uid = await getUserId();
        const shopId = await getShopId();
        const updated = await prisma.user.update({ where: { id: uid, shopId }, data: { name: data.name, surname: data.surname, phone: data.phone, image: data.image } });
        revalidatePath("/(dashboard)/profil");
        return { success: true, user: serializePrisma(updated) };
    } catch (error) { return { success: false }; }
}

export async function updatePassword(data: any) {
    try {
        const uid = await getUserId();
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (!user || (user.password && !await bcrypt.compare(data.old, user.password))) return { success: false, error: "Şifre hatalı" };
        await prisma.user.update({ where: { id: uid }, data: { password: await bcrypt.hash(data.new, 10) } });
        return { success: true };
    } catch (error) { return { success: false }; }
}

export async function updateDashboardLayout(l: any) {
    try {
        const uid = await getUserId();
        await prisma.$executeRaw`UPDATE "User" SET "dashboardLayout" = ${JSON.stringify(l)}::jsonb WHERE "id" = ${uid}`;
        revalidatePath("/");
        return { success: true };
    } catch (error) { return { success: false }; }
}

export async function assignLeave(d: any) {
    try {
        const sid = await getShopId();
        await prisma.leaveRequest.create({ data: { ...d, shopId: sid } });
        await triggerStaffRevalidate(sid);
        return { success: true };
    } catch (error) { return { success: false }; }
}

export async function deleteLeave(id: string) {
    try {
        const sid = await getShopId();
        await prisma.leaveRequest.delete({ where: { id, shopId: sid } });
        await triggerStaffRevalidate(sid);
        return { success: true };
    } catch (error) { return { success: false }; }
}

export async function getMonthlyStaffReport(m?: number, y?: number) {
    try {
        const sid = await getShopId();
        const now = new Date();
        const start = new Date(y || now.getFullYear(), (m || now.getMonth() + 1) - 1, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
        const staff = await prisma.user.findMany({
            where: { shopId: sid },
            include: {
                leaveRequests: { where: { shopId: sid, OR: [{ startDate: { lte: end }, endDate: { gte: start } }] } },
                sales: { where: { shopId: sid, createdAt: { gte: start, lte: end } } },
                assignedTickets: { where: { shopId: sid, status: "DELIVERED", createdAt: { gte: start, lte: end } } }
            }
        });
        const report = staff.map(u => {
            const rev = u.sales.reduce((acc, s) => acc + Number(s.finalAmount || 0), 0) + u.assignedTickets.reduce((acc, t) => acc + Number(t.actualCost || 0), 0);
            return { userId: u.id, name: `${u.name} ${u.surname || ""}`.trim(), role: u.role, salesCount: u.sales.length, serviceCount: u.assignedTickets.length, totalRevenue: rev, commission: rev * (Number(u.commissionRate || 0) / 100) };
        });
        return { success: true, report: serializePrisma(report) };
    } catch (error) { return { success: false }; }
}

export async function updateRoleTemplate(role: Role, p: any) {
    try {
        const res = await (prisma as any).rolePermission.upsert({ where: { role }, update: p, create: { role, ...p } });
        revalidatePath("/personel");
        return { success: true, template: serializePrisma(res) };
    } catch (error) { return { success: false }; }
}

export async function getRoleTemplates() {
    try { return serializePrisma(await (prisma as any).rolePermission.findMany()); } catch (error) { return []; }
}
