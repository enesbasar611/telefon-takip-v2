"use server";

import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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

    const commission = await (prisma as any).staffCommission.update({
        where: { id: commissionId },
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
    type: "ADVANCE" | "MEAL" | "TRAVEL";
}) {
    const session = await auth();
    if (!session?.user?.shopId) throw new Error("Yetkisiz erişim");

    const expense = await (prisma as any).staffExpense.create({
        data: {
            userId,
            amount,
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
export async function getEmployeeDashboardData(userId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Yetkisiz erişim");

    // Güvenlik: Çalışan sadece kendi verisini görebilir (Admin/Müdür hariç)
    if (session.user.id !== userId && session.user.role === Role.STAFF) {
        throw new Error("Sadece kendi verilerinize erişebilirsiniz");
    }

    const shopId = session.user.shopId!;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Personel Temel Bilgileri
    const user = await (prisma.user as any).findUnique({
        where: { id: userId },
        select: {
            name: true,
            surname: true,
            role: true,
            baseSalary: true,
            createdAt: true,
        },
    });

    // 2. Bu Ayki Onaylı Primler
    const approvedCommissions = await (prisma as any).staffCommission.aggregate({
        where: {
            userId,
            status: CommissionStatus.APPROVED,
            approvedAt: { gte: firstDayOfMonth },
        },
        _sum: { amount: true },
    });

    // 3. Bu Ayki Bekleyen Primler
    const pendingCommissions = await (prisma as any).staffCommission.aggregate({
        where: {
            userId,
            status: CommissionStatus.PENDING,
            createdAt: { gte: firstDayOfMonth },
        },
        _sum: { amount: true },
    });

    // 4. Bu Ayki Gider/Avanslar (Detaylı listeyi de alalım)
    const expenses = await (prisma as any).staffExpense.findMany({
        where: {
            userId,
            createdAt: { gte: firstDayOfMonth },
        },
        orderBy: { createdAt: "desc" },
    });

    const totalExpensesSum = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);

    // 4b. Bu Ayki Onaylı Primlerin Detayları
    const commissions = await (prisma as any).staffCommission.findMany({
        where: {
            userId,
            status: CommissionStatus.APPROVED,
            approvedAt: { gte: firstDayOfMonth },
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
                    where: { userId, createdAt: { gte: firstDayOfMonth } },
                    _sum: { finalAmount: true },
                });
                currentProgress = Number(sales._sum.finalAmount || 0);
            } else if (m.targetType === "SERVICE_COUNT") {
                currentProgress = await (prisma.serviceTicket as any).count({
                    where: { technicianId: userId, deliveredAt: { gte: firstDayOfMonth }, status: "DELIVERED" },
                });
            } else if (m.targetType === "COURIER_TASK") {
                currentProgress = await (prisma.shortageItem as any).count({
                    where: { assignedToId: userId, takenAt: { gte: firstDayOfMonth }, isResolved: true },
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

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let dailyLeaveCount = 0;

    // Sadece onaylanmış ve bu aya sarkanlar finansal hesaplamada dikkate alınır
    allLeaves.filter(l => l.status === "APPROVED" && l.startDate <= lastDayOfMonth && l.endDate >= firstDayOfMonth).forEach((leave: any) => {
        const start = leave.startDate < firstDayOfMonth ? firstDayOfMonth : leave.startDate;
        const end = leave.endDate > lastDayOfMonth ? lastDayOfMonth : leave.endDate;
        const diffTime = Math.max(0, end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        if (leave.type === "UNPAID") unpaidLeaveDays += days;
        else if (leave.type === "DAILY") dailyLeaveCount += 1;
        else paidLeaveDays += days;
    });

    // 7. Pro-rata Maaş Hesaplama (30 gün üzerinden)
    const daysInMonth = 30;
    let activeDaysCount = 30;

    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Eğer personel bu ay işe girdiyse, başlangıç gününü ayın başı değil işe giriş günü yap
    const effectiveStartDate = (user?.createdAt && user.createdAt > startOfCurrentMonth)
        ? user.createdAt
        : startOfCurrentMonth;

    // Çalışılan gün: Bugün - Başlangıç + 1 (Aynı gün bile olsa 1 gün sayılır)
    const timeDiff = today.getTime() - effectiveStartDate.getTime();
    activeDaysCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) || 1;

    // Sınırlar: 0 ile 30 arası
    if (activeDaysCount < 1) activeDaysCount = 1;
    if (activeDaysCount > 30) activeDaysCount = 30;

    const baseSalary = Number(user?.baseSalary || 0);
    const proRatedSalary = (baseSalary / 30) * activeDaysCount;

    return serializePrisma({
        finance: {
            baseSalary: baseSalary,
            proRatedSalary: proRatedSalary,
            activeDays: activeDaysCount,
            approvedCommissions: totalCommissionsSum,
            pendingCommissions: Number(pendingCommissions._sum.amount || 0),
            totalExpenses: totalExpensesSum,
            leaveDays: paidLeaveDays + unpaidLeaveDays,
            unpaidLeaveDays,
            dailyLeaveCount,
            netPayout: proRatedSalary + totalCommissionsSum - totalExpensesSum,
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

        // 2. Eğer ÜCRETSİZ İZİN ise maaş kesintisini oluştur
        if (leave.type === "UNPAID") {
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const baseSalary = Number(leave.user.baseSalary || 0);
            const dailyRate = baseSalary / 30;
            const deductionAmount = dailyRate * diffDays;

            if (deductionAmount > 0) {
                await (tx as any).staffExpense.create({
                    data: {
                        userId: leave.userId,
                        shopId: leave.shopId,
                        amount: deductionAmount,
                        type: "DEDUCTION",
                        description: `${diffDays} Gün Ücretsiz İzin Kesintisi (${format(leave.startDate, "d MMM", { locale: tr })} - ${format(leave.endDate, "d MMM", { locale: tr })})`,
                        createdAt: leave.startDate
                    }
                });
            }
        }

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
export async function createStaffArchive(userId: string, tx?: any) {
    try {
        const session = await auth();
        const shopId = session?.user?.shopId;
        if (!shopId) {
            console.error("[createStaffArchive] shopId bulunamadı, arşiv atlanıyor.");
            return null;
        }

        const data = await getEmployeeDashboardData(userId);
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, surname: true, email: true }
        });

        const db = tx || prisma;
        const staffName = userData ? `${userData.name} ${userData.surname || ""}`.trim() : "Bilinmeyen Personel";
        const staffEmail = userData?.email || "";

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
                    baseSalary: data.finance.baseSalary,
                    totalCommissions: data.finance.approvedCommissions,
                    totalExpenses: data.finance.totalExpenses,
                    netPayout: data.finance.netPayout,
                    metadata: data,
                }
            });
        } else {
            return await (db as any).monthlyStaffArchive.create({
                data: {
                    userId,
                    staffName,
                    staffEmail,
                    period,
                    baseSalary: data.finance.baseSalary,
                    totalCommissions: data.finance.approvedCommissions,
                    totalExpenses: data.finance.totalExpenses,
                    netPayout: data.finance.netPayout,
                    shopId,
                    metadata: data,
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

    for (const user of users) {
        await createStaffArchive(user.id);
    }

    revalidatePath("/personel");
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return { success: true, period };
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
        metadata: archive.metadata ? JSON.parse(archive.metadata as string) : null
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
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSalaries, totalApprovedCommissions, totalExpenses, totalStaff] = await Promise.all([
        (prisma as any).user.aggregate({
            where: { shopId, isApproved: true },
            _sum: { baseSalary: true }
        }),
        (prisma as any).staffCommission.aggregate({
            where: {
                shopId,
                status: CommissionStatus.APPROVED,
                approvedAt: { gte: firstDayOfMonth }
            },
            _sum: { amount: true }
        }),
        (prisma as any).staffExpense.aggregate({
            where: { shopId, createdAt: { gte: firstDayOfMonth } },
            _sum: { amount: true }
        }),
        prisma.user.count({ where: { shopId, isApproved: true } })
    ]);

    return {
        monthlyFixedCost: Number(totalSalaries._sum.baseSalary || 0),
        monthlyVariableComm: Number(totalApprovedCommissions._sum.amount || 0),
        monthlyExpenses: Number(totalExpenses._sum.amount || 0),
        totalPersonnel: totalStaff,
        totalMonthlyLiability: Number(totalSalaries._sum.baseSalary || 0) +
            Number(totalApprovedCommissions._sum.amount || 0) -
            Number(totalExpenses._sum.amount || 0)
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
