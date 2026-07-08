"use server";

import prisma from "@/lib/prisma";
import { auth, getShopId, getUserId } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { Role } from "@prisma/client";
const LeaveType = {
    ANNUAL: "ANNUAL",
    DAILY: "DAILY",
    PAID: "PAID",
    UNPAID: "UNPAID",
} as const;

const LeaveStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;
import { recordAuditLog } from "./audit-actions";
import { serializePrisma } from "@/lib/utils";
import { calculatePayrollSnapshot, getPayrollPeriodRange, getSalaryPaymentStatus } from "@/lib/staff-finance-calculations";

const CommissionStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

/**
 * Personele prim ekler (Hizmet veya Satış sonrası)
 * Varsayılan durum: PENDING (Mağaza sahibi onayı bekler)
 */
export async function createCommission({
    userId,
    amount,
    description,
    type,
    referenceId,
}: {
    userId: string;
    amount: number;
    description: string;
    type: "SERVICE" | "SALE";
    referenceId?: string;
}) {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const isAdmin = session.user.role !== Role.STAFF;

    const commission = await (prisma as any).staffCommission.create({
        data: {
            userId,
            amount,
            description,
            type,
            referenceId,
            shopId: session.user.shopId,
            status: isAdmin ? CommissionStatus.APPROVED : CommissionStatus.PENDING,
            approvedAt: isAdmin ? new Date() : null,
            approvedById: isAdmin ? session.user.id : null,
        },
    });

    revalidatePath("/personel");
    return serializePrisma(commission);
}

/**
 * Onay bekleyen primi onaylar	
 */
export async function approveCommission(commissionId: string) {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Sadece yönetici onaylayabilir");
    if (!session?.user?.shopId) throw new Error("Mağaza bilgisi bulunamadı");

    const commission = await (prisma as any).staffCommission.update({
        where: { id: commissionId, shopId: session.user.shopId },
        data: {
            status: CommissionStatus.APPROVED,
            approvedAt: new Date(),
            approvedById: session?.user?.id,
        },
    });

    revalidatePath("/personel");
    return serializePrisma(commission);
}

/**
 * Personele gider veya avans ekler
 */
export async function addStaffExpense({
    userId,
    amount,
    description,
    type,
}: {
    userId: string;
    amount: number;
    description: string;
    type: "ADVANCE" | "MEAL" | "TRAVEL" | "DEDUCTION";
}) {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error("Tutar pozitif olmalı");

    const staff = await prisma.user.findUnique({
        where: { id: userId, shopId: session.user.shopId },
        select: { id: true },
    });
    if (!staff) throw new Error("Personel bulunamadı");

    const expense = await (prisma as any).staffExpense.create({
        data: {
            userId,
            amount: Number(amount),
            description,
            type,
            shopId: session.user.shopId,
        },
    });

    revalidatePath("/personel");
    return serializePrisma(expense);
}

/**
 * Çalışan Dashboard verilerini getirir (Hassas veri kısıtlamalı)
 */
export async function getEmployeeDashboardData(userId: string, options?: { employmentEndedAt?: Date }) {
    const session = await auth();
    if (!session?.user) throw new Error("Yetkisiz erişim");

    // Güvenlik: Çalışan sadece kendi verisini görebilir (Admin/Müdür hariç)
    if (session.user.id !== userId && session.user.role === Role.STAFF) {
        throw new Error("Sadece kendi verilerinize erişebilirsiniz");
    }

    const shopId = session.user.shopId!;
    const now = new Date();
    const { start: firstDayOfMonth, end: lastDayOfMonth } = getPayrollPeriodRange(now);

    // 1. Personel Temel Bilgileri
    const user = await (prisma.user as any).findUnique({
        where: { id: userId },
        select: {
            name: true,
            surname: true,
            role: true,
            baseSalary: true,
            salaryCurrency: true,
            salaryPaymentDay: true,
            createdAt: true,
            employmentEndedAt: true,
        },
    });

    // 2. Bu Ayki Onaylı Primler
    const approvedCommissions = await (prisma as any).staffCommission.aggregate({
        where: {
            userId,
            shopId,
            status: CommissionStatus.APPROVED,
            approvedAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        },
        _sum: { amount: true },
    });

    // 3. Bu Ayki Bekleyen Primler
    const pendingCommissions = await (prisma as any).staffCommission.aggregate({
        where: {
            userId,
            shopId,
            status: CommissionStatus.PENDING,
            createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        },
        _sum: { amount: true },
    });

    // 4. Bu Ayki Gider/Avanslar (Detaylı listeyi de alalım)
    const expenses = await (prisma as any).staffExpense.findMany({
        where: {
            userId,
            shopId,
            createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        },
        orderBy: { createdAt: "desc" },
    });

    // 4b. Bu Ayki Onaylı Primlerin Detayları
    const commissions = await (prisma as any).staffCommission.findMany({
        where: {
            userId,
            shopId,
            status: CommissionStatus.APPROVED,
            approvedAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        },
        orderBy: { approvedAt: "desc" },
    });

    const totalCommissionsSum = commissions.reduce((sum: number, comm: any) => sum + Number(comm.amount || 0), 0);

    // 5. Milestone (Hedef) İlerlemesi
    const milestones = await prisma.performanceMilestone.findMany({
        where: {
            shopId,
            role: user?.role,
            isActive: true,
        },
    });

    // Dinamik hedef hesaplamaları (Örnek mantık)
    const milestoneProgress = await Promise.all(
        milestones.map(async (m: any) => {
            let currentProgress = 0;
            if (m.targetType === "SALES_AMOUNT") {
                const sales = await prisma.sale.aggregate({
                    where: { userId, shopId, createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
                    _sum: { finalAmount: true },
                });
                currentProgress = Number(sales._sum.finalAmount || 0);
            } else if (m.targetType === "SERVICE_COUNT") {
                currentProgress = await (prisma.serviceTicket as any).count({
                    where: { technicianId: userId, shopId, deliveredAt: { gte: firstDayOfMonth, lte: lastDayOfMonth }, status: "DELIVERED" },
                });
            } else if (m.targetType === "COURIER_TASK") {
                currentProgress = await (prisma.shortageItem as any).count({
                    where: { assignedToId: userId, shopId, takenAt: { gte: firstDayOfMonth, lte: lastDayOfMonth }, isResolved: true },
                });
            }

            return {
                id: m.id,
                targetType: m.targetType,
                targetValue: Number(m.targetValue),
                currentValue: currentProgress,
                bonusAmount: Number(m.bonusAmount),
                remaining: Math.max(0, Number(m.targetValue) - currentProgress),
                progressPercent: Math.min(100, (currentProgress / Number(m.targetValue)) * 100),
            };
        })
    );

    // 6. Bu Ayki İzin Günleri (Tüm statüler - liste için - Tarih kısıtlaması kaldırıldı)
    const allLeaves = await prisma.leaveRequest.findMany({
        where: {
            userId,
            shopId,
        },
        orderBy: { createdAt: "desc" }
    });

    const baseSalary = Number(user?.baseSalary || 0);
    const finance = calculatePayrollSnapshot({
        baseSalary,
        staffCreatedAt: user?.createdAt,
        staffEndedAt: options?.employmentEndedAt || user?.employmentEndedAt,
        periodStart: firstDayOfMonth,
        periodEnd: lastDayOfMonth,
        asOfDate: now,
        approvedCommissions: totalCommissionsSum,
        pendingCommissions: Number(pendingCommissions._sum.amount || 0),
        expenses,
        leaves: allLeaves,
    });

    return serializePrisma({
        finance,
        payroll: {
            periodStart: firstDayOfMonth,
            periodEnd: lastDayOfMonth,
            staffCreatedAt: user?.createdAt,
            employmentEndedAt: options?.employmentEndedAt || user?.employmentEndedAt,
            salaryPaymentDay: user?.salaryPaymentDay || 1,
            salaryCurrency: user?.salaryCurrency || "TRY",
        },
        milestones: milestoneProgress,
        leaves: allLeaves,
        expenses: expenses,
        commissions: commissions,
    });
}

/**
 * Personel izin talebi oluşturur
 */
export async function createLeaveRequest(data: {
    userId?: string;
    startDate: Date;
    endDate: Date;
    type: "ANNUAL" | "DAILY" | "PAID" | "UNPAID";
    description?: string;
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.shopId) throw new Error("Yetkisiz erişim");

    // Tarih doğrulama
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Geçersiz tarih formatı");
    }

    // Makul bir yıl aralığı kontrolü (Örn: 2000 - 2100)
    if (start.getFullYear() < 2000 || start.getFullYear() > 2100 ||
        end.getFullYear() < 2000 || end.getFullYear() > 2100) {
        throw new Error("Geçersiz tarih yılı");
    }

    const isAdmin = session.user.role !== "STAFF";
    const targetUserId = data.userId || session.user.id;

    const leave = await (prisma as any).leaveRequest.create({
        data: {
            userId: targetUserId,
            shopId: session.user.shopId,
            startDate: start,
            endDate: end,
            type: data.type,
            note: data.description,
            status: isAdmin ? "APPROVED" : "PENDING",
            approvedById: isAdmin ? session.user.id : null,
        },
    });

    await recordAuditLog({
        action: "CREATE",
        entityType: "STAFF" as any,
        entityId: leave.id,
        entityName: session.user.name || "Personel",
        message: `${session.user.name} yeni bir izin talebi oluşturdu (${data.type})`,
        details: { startDate: data.startDate, endDate: data.endDate }
    });

    revalidatePath("/personel");
    return { success: true, data: serializePrisma(leave) };
}

/**
 * İzin talebini onaylar ve finansal etkilerini işler
 */
export async function approveLeaveRequest(leaveId: string) {
    const session = await auth();
    const isAdmin = session?.user?.role !== Role.STAFF;
    if (!isAdmin) throw new Error("Sadece yöneticiler onaylayabilir");

    if (!session?.user?.shopId) throw new Error("Mağaza bilgisi bulunamadı");
    const shopId = session.user.shopId;

    const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId, shopId: shopId },
        include: { user: true }
    }) as any;

    if (!leave) throw new Error("İzin talebi bulunamadı");
    if (leave.status !== "PENDING") throw new Error("Bu talep zaten sonuçlanmış");

    await prisma.$transaction(async (tx) => {
        // 1. Talebi onayla
        await (tx as any).leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: "APPROVED",
                approvedById: session?.user?.id
            }
        });

        // 2. Ücretsiz izin kesintisi bordro snapshot hesabında dönemle çakışan gün kadar
        // dinamik hesaplanır. Böylece aya taşan izinler yanlış döneme yazılmaz.

        // 3. (Opsiyonel) Yıllık izin/Ücretli izin durumunda Yemek Gideri duraklatma uyarısı veya otomatik kesinti
        // Bu sistemde yemek giderleri StaffExpense:MEAL olarak tutulduğu için, 
        // manuel girilen meal kayıtlarına müdahale yerine raporlama ekranında bu günler dikkate alınacaktır.
    });

    await recordAuditLog({
        action: "UPDATE",
        entityType: "STAFF" as any,
        entityId: leave.id,
        entityName: `${leave.user.name} ${leave.user.surname || ""}`,
        message: `${leave.user.name} kişisinin izin talebi onaylandı (${leave.type})`,
        details: { leaveId }
    });

    revalidatePath("/personel");
    revalidateTag(`staff-${leave.shopId}`);
    return { success: true };
}

/**
 * İzin talebini reddeder
 */
export async function rejectLeaveRequest(leaveId: string) {
    const session = await auth();
    if (session?.user?.role === Role.STAFF) throw new Error("Yetkisiz işlem");

    if (!session?.user?.shopId) throw new Error("Mağaza bilgisi bulunamadı");

    await prisma.leaveRequest.update({
        where: { id: leaveId, shopId: session.user.shopId },
        data: { status: "REJECTED" }
    });

    revalidatePath("/personel");
    return { success: true };
}

/**
 * Personele kesinti ekler (addStaffExpense varyasyonu)
 */
export async function addStaffDeduction({
    userId,
    amount,
    description,
}: {
    userId: string;
    amount: number;
    description: string;
}) {
    return await addStaffExpense({
        userId,
        amount,
        description,
        type: "DEDUCTION" as any,
    });
}


/**
 * Belirli bir personel için arşiv kaydı oluşturur
 */
export async function createStaffArchive(userId: string, tx?: any, options?: { employmentEndedAt?: Date; closeReason?: string }) {
    try {
        const session = await auth();
        const shopId = session?.user?.shopId;
        if (!shopId) {
            console.error("[createStaffArchive] shopId bulunamadı, arşiv atlanıyor.");
            return null;
        }

        const data = await getEmployeeDashboardData(userId, { employmentEndedAt: options?.employmentEndedAt });
        const now = new Date();
        const { period } = getPayrollPeriodRange(now);

        const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                surname: true,
                email: true,
                createdAt: true,
                employmentEndedAt: true,
                salaryPaymentDay: true,
                salaryCurrency: true,
                baseSalary: true,
            }
        });

        const db = tx || prisma;
        const staffName = userData ? `${userData.name} ${userData.surname || ""}`.trim() : "Bilinmeyen Personel";
        const staffEmail = userData?.email || "";
        const employmentEndedAt = options?.employmentEndedAt || userData?.employmentEndedAt || null;
        const metadata = {
            ...data,
            payroll: {
                ...(data as any).payroll,
                staffCreatedAt: userData?.createdAt || (data as any).payroll?.staffCreatedAt,
                employmentEndedAt,
                salaryPaymentDay: userData?.salaryPaymentDay || (data as any).payroll?.salaryPaymentDay || 1,
                salaryCurrency: userData?.salaryCurrency || (data as any).payroll?.salaryCurrency || "TRY",
                monthlyBaseSalary: Number(userData?.baseSalary || (data as any).finance?.baseSalary || 0),
                closeReason: options?.closeReason || "MONTHLY_CLOSE",
            },
            statement: {
                incomeItems: [
                    {
                        type: "SALARY",
                        description: `${(data as any).finance.activeDays} gün dönem maaşı`,
                        amount: (data as any).finance.proRatedSalary,
                    },
                    ...((data as any).commissions || []).map((commission: any) => ({
                        type: commission.type || "COMMISSION",
                        description: commission.description || "Prim",
                        amount: Number(commission.amount || 0),
                        createdAt: commission.createdAt,
                        approvedAt: commission.approvedAt,
                    })),
                ],
                deductionItems: [
                    ...(((data as any).expenses || [])
                        .filter((expense: any) => expense.type !== "DEDUCTION")
                        .map((expense: any) => ({
                            type: expense.type || "EXPENSE",
                            description: expense.description || "Gider / avans",
                            amount: Number(expense.amount || 0),
                            createdAt: expense.createdAt,
                        }))),
                    ...(((data as any).finance.unpaidLeaveDeduction || 0) > 0 ? [{
                        type: "UNPAID_LEAVE",
                        description: `${(data as any).finance.unpaidLeaveDays} gün ücretsiz izin kesintisi`,
                        amount: (data as any).finance.unpaidLeaveDeduction,
                    }] : []),
                ],
            },
        };

        // upsert yerine findFirst + create/update kullan (nullable userId ile compound unique sorun yaratıyor)
        const existing = await (db as any).monthlyStaffArchive.findFirst({
            where: { userId, period, shopId }
        });

        if (existing) {
            return await (db as any).monthlyStaffArchive.update({
                where: { id: existing.id },
                data: {
                    staffName,
                    staffEmail,
                    baseSalary: data.finance.proRatedSalary,
                    totalCommissions: data.finance.approvedCommissions,
                    totalExpenses: data.finance.totalExpenses,
                    netPayout: data.finance.netPayout,
                    metadata,
                }
            });
        } else {
            return await (db as any).monthlyStaffArchive.create({
                data: {
                    userId,
                    staffName,
                    staffEmail,
                    period,
                    baseSalary: data.finance.proRatedSalary,
                    totalCommissions: data.finance.approvedCommissions,
                    totalExpenses: data.finance.totalExpenses,
                    netPayout: data.finance.netPayout,
                    shopId,
                    metadata,
                }
            });
        }
    } catch (error) {
        console.error("[createStaffArchive] Arşiv oluşturulurken hata:", error);
        // Arşiv hatası silme işlemini engellemesin
        return null;
    }
}

/**
 * Aktif ayı kapatır ve arşivler
 */
export async function closeFinancialPeriod() {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Yetkisiz işlem");

    const shopId = session.user.shopId!;

    const users = await prisma.user.findMany({
        where: { shopId, isApproved: true },
    });

    const now = new Date();
    const { period } = getPayrollPeriodRange(now);

    for (const user of users) {
        await createStaffArchive(user.id);
    }

    revalidatePath("/personel");
    return { success: true, period, archivedCount: users.length };
}

/**
 * Tek personelin aktif aylık bordro dönemini manuel kapatır.
 */
export async function closeStaffFinancialPeriod(userId: string) {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Yetkisiz işlem");
    if (!session?.user?.shopId) throw new Error("Mağaza bilgisi bulunamadı");

    const staff = await prisma.user.findUnique({
        where: { id: userId, shopId: session.user.shopId },
        select: { id: true, name: true, surname: true },
    });
    if (!staff) throw new Error("Personel bulunamadı");

    const archive = await createStaffArchive(userId, undefined, { closeReason: "MANUAL_SALARY_CLOSE" });
    if (!archive) throw new Error("Bordro arşivi oluşturulamadı");

    const notificationId = `payroll-${userId}-${(archive as any).period}`;
    await (prisma as any).notification.upsert({
        where: { id: notificationId },
        update: {
            isRead: true,
            isDeleted: true,
            status: "ARCHIVED",
        },
        create: {
            id: notificationId,
            type: "PAYROLL_DUE",
            category: "Finans",
            title: "Maaş bordrosu arşivlendi",
            message: `${staff.name || ""} ${staff.surname || ""} için ${(archive as any).period} dönemi kapatıldı.`,
            referenceId: userId,
            status: "ARCHIVED",
            isRead: true,
            isDeleted: true,
            shopId: session.user.shopId,
        },
    });

    revalidatePath("/personel");
    return { success: true, archive: serializePrisma(archive), period: (archive as any).period };
}

export async function getSalaryDueStaff() {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin || !session?.user?.shopId) return [];

    const now = new Date();
    const { period } = getPayrollPeriodRange(now);
    const users = await prisma.user.findMany({
        where: { shopId: session.user.shopId, isApproved: true, employmentEndedAt: null },
        select: {
            id: true,
            name: true,
            surname: true,
            image: true,
            salaryPaymentDay: true,
            baseSalary: true,
            monthlyArchives: {
                where: { period, shopId: session.user.shopId },
                select: { id: true },
                take: 1,
            },
        },
    });

    return serializePrisma(users
        .map((user) => ({ ...user, salaryStatus: getSalaryPaymentStatus((user as any).salaryPaymentDay, now) }))
        .filter((user: any) => user.salaryStatus.shouldNotify && user.monthlyArchives.length === 0));
}

/**
 * Belirli bir personelin tüm geçmiş raporlarını (bordrolarını) getirir
 */
export async function getStaffArchives(userId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Yetkisiz erişim");

    if (session.user.id !== userId && session.user.role === Role.STAFF) {
        throw new Error("Sadece kendi arşivlerinize erişebilirsiniz");
    }

    const archives = await (prisma as any).monthlyStaffArchive.findMany({
        where: { userId, shopId: session.user.shopId },
        orderBy: { period: "desc" },
    });

    return serializePrisma(archives);
}

/**
 * Tüm dükkanın geçmiş dönem arşivlerini getirir (Admin için)
 */
export async function getAllStaffArchives() {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Yetkisiz erişim");

    const archives = await (prisma as any).monthlyStaffArchive.findMany({
        where: { shopId: session.user.shopId },
        include: {
            user: {
                select: { name: true, surname: true, image: true, role: true }
            }
        },
        orderBy: { period: "desc" },
    });

    return serializePrisma(archives);
}

/**
 * Detaylı arşiv dökümünü (bordro snaphot) getirir
 */
export async function getDetailedArchive(archiveId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Yetkisiz erişim");

    const archive = await (prisma as any).monthlyStaffArchive.findUnique({
        where: { id: archiveId },
        include: {
            user: {
                select: { name: true, surname: true, role: true, email: true }
            }
        }
    });

    if (!archive) throw new Error("Arşiv bulunamadı");
    if (session.user.id !== archive.userId && session.user.role === Role.STAFF) {
        throw new Error("Bu işleme yetkiniz yok");
    }

    return serializePrisma({
        ...archive,
        metadata: typeof archive.metadata === "string"
            ? JSON.parse(archive.metadata)
            : archive.metadata ?? null
    });
}

/**
 * Onay bekleyen tüm primleri getirir (Mağaza yönetimi için)
 */
export async function getPendingCommissions() {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Yetkisiz erişim");

    const commissions = await (prisma as any).staffCommission.findMany({
        where: {
            shopId: session.user.shopId,
            status: CommissionStatus.PENDING
        },
        include: {
            user: { select: { name: true, surname: true, image: true, role: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return serializePrisma(commissions);
}

/**
 * Personel bazlı finansal özet (Tablo görünümü için)
 */
export async function getStaffFinanceSummary() {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Yetkisiz erişim");
    const shopId = session.user.shopId!;

    const users = await (prisma as any).user.findMany({
        where: { shopId, isApproved: true },
        select: {
            id: true,
            name: true,
            surname: true,
            role: true,
            baseSalary: true,
            commissionRate: true,
        }
    });

    const summaries = await Promise.all(users.map(async (u: any) => {
        const data = await getEmployeeDashboardData(u.id);
        return {
            userId: u.id,
            name: `${u.name} ${u.surname || ""}`.trim(),
            role: u.role,
            ...data.finance
        };
    }));

    return summaries;
}

/**
 * Yönetici için kapsamlı finansal özet metrikleri
 */
export async function getManagerFinanceStats() {
    const session = await auth();
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SHOP_MANAGER;
    if (!isAdmin) throw new Error("Yetkisiz erişim");
    const shopId = session.user.shopId!;
    const users = await (prisma as any).user.findMany({
        where: { shopId, isApproved: true },
        select: { id: true },
    });

    const summaries = await Promise.all(users.map((user: any) => getEmployeeDashboardData(user.id)));
    const monthlyFixedCost = summaries.reduce((sum: number, data: any) => sum + Number(data.finance.proRatedSalary || 0), 0);
    const monthlyVariableComm = summaries.reduce((sum: number, data: any) => sum + Number(data.finance.approvedCommissions || 0), 0);
    const monthlyExpenses = summaries.reduce((sum: number, data: any) => sum + Number(data.finance.totalExpenses || 0), 0);

    return {
        monthlyFixedCost,
        monthlyVariableComm,
        monthlyExpenses,
        totalPersonnel: users.length,
        totalMonthlyLiability: monthlyFixedCost + monthlyVariableComm - monthlyExpenses
    };
}

/**
 * Onay bekleyen tüm izinleri getirir
 */
export async function getPendingLeaves() {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const leaves = await prisma.leaveRequest.findMany({
        where: {
            shopId: session.user.shopId,
            status: "PENDING"
        },
        include: {
            user: { select: { name: true, surname: true, image: true, role: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return serializePrisma(leaves);
}

/**
 * Belirli bir personelin izinlerini getirir
 */
export async function getStaffLeavesByUserId(userId: string) {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const leaves = await prisma.leaveRequest.findMany({
        where: {
            userId,
            shopId: session.user.shopId,
        },
        orderBy: { startDate: "desc" }
    });

    return serializePrisma(leaves);
}

/**
 * Tüm aktif hedefleri (milestones) getirir
 */
export async function getMilestones() {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const milestones = await prisma.performanceMilestone.findMany({
        where: { shopId: session.user.shopId },
        orderBy: { createdAt: "desc" }
    });

    return serializePrisma(milestones);
}

/**
 * Yeni bir hedef oluşturur
 */
export async function createMilestone(data: {
    role: Role;
    targetType: "SALES_AMOUNT" | "SERVICE_COUNT" | "COURIER_TASK";
    targetValue: number;
    bonusAmount: number;
}) {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const milestone = await prisma.performanceMilestone.create({
        data: {
            ...data,
            shopId: session.user.shopId,
            isActive: true
        }
    });

    revalidatePath("/personel");
    return serializePrisma({ success: true, milestone });
}

/**
 * Hedefi siler
 */
export async function deleteMilestone(id: string) {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    await prisma.performanceMilestone.delete({
        where: { id, shopId: session.user.shopId }
    });

    revalidatePath("/personel");
    return { success: true };
}

/**
 * Finansal hesapları getirir (Maaş ödemesi kasa seçimi için)
 */
export async function getFinanceAccounts() {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const accounts = await prisma.financeAccount.findMany({
        where: {
            shopId: session.user.shopId,
            isActive: true
        },
        orderBy: { isDefault: "desc" }
    });

    return serializePrisma(accounts);
}
