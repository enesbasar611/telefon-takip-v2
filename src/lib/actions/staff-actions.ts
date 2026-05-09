"use server";
import { unstable_cache } from "next/cache";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { serializePrisma, formatName } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getShopId, getUserId, auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const getStaff = async (shopId?: string) => {
    const finalShopId = shopId || await getShopId();
    return unstable_cache(
        async () => {
            try {
                const staff = await prisma.user.findMany({
                    where: { shopId: finalShopId },
                    include: {
                        assignedTickets: {
                            where: { status: "DELIVERED", shopId: finalShopId }
                        },
                        sales: {
                            where: { shopId: finalShopId }
                        },
                        shortageTasks: {
                            where: { shopId: finalShopId }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                });
                return serializePrisma(staff);
            } catch (error) {
                console.error("Error fetching staff:", error);
                return [];
            }
        },
        [`staff-list-${finalShopId}`],
        { tags: [`staff-${finalShopId}`], revalidate: 3600 }
    )();
};

export const getStaffShell = async (shopId?: string) => {
    const finalShopId = shopId || await getShopId();
    return unstable_cache(
        async () => {
            try {
                const staff = await prisma.user.findMany({
                    where: { shopId: finalShopId },
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        role: true,
                    },
                    orderBy: { createdAt: "desc" }
                });
                return serializePrisma(staff);
            } catch (error) {
                console.error("Error fetching staff shell:", error);
                return [];
            }
        },
        [`staff-shell-${finalShopId}`],
        { tags: [`staff-${finalShopId}`], revalidate: 3600 }
    )();
};

export async function getProfile() {
    try {
        const userId = await getUserId();
        const shopId = await getShopId(false);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                shop: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                    }
                },
                ...(shopId ? {
                    assignedTickets: {
                        where: { shopId },
                        orderBy: { createdAt: 'desc' as const },
                        take: 10,
                        include: {
                            customer: {
                                select: { name: true }
                            }
                        }
                    }
                } : {})
            }
        });

        console.log(`DEBUG: [getProfile] User ID: ${userId}, hasLayout: ${!!user?.dashboardLayout}`);
        if (user?.dashboardLayout) {
            const layout = user.dashboardLayout as any;
            console.log(`DEBUG: [getProfile] Layout length: ${Array.isArray(layout) ? layout.length : 'unknown'}`);
        }

        if (!user) return null;
        return serializePrisma({
            ...user,
            hasPassword: !!user.password
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
}

export async function createStaff(data: {
    name: string;
    surname?: string;
    email: string;
    phone?: string;
    image?: string;
    role: Role;
    commissionRate: number;
    password?: string;
    canSell?: boolean;
    canService: boolean;
    canStock: boolean;
    canFinance: boolean;
    canDelete: boolean;
    canEdit: boolean;
}) {
    try {
        const shopId = await getShopId();
        const session = await auth();

        if (data.role === "SUPER_ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
            return { success: false, error: "Süper Admin yetkisi atanamaz." };
        }

        const normalizedEmail = data.email.toLowerCase();

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return { success: false, error: "Bu e-posta adresi zaten kullanımda." };
        }

        const hashedPassword = await bcrypt.hash(data.password || "password123", 10);

        // Fetch role permissions from database or use defaults
        const template = await (prisma as any).rolePermission.findUnique({
            where: { role: data.role }
        });

        const roleDefaults: Record<string, { canSell: boolean, canService: boolean, canStock: boolean, canFinance: boolean, canDelete: boolean, canEdit: boolean }> = {
            SUPER_ADMIN: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
            SHOP_MANAGER: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
            ADMIN: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
            MANAGER: { canSell: true, canService: true, canStock: true, canFinance: true, canDelete: true, canEdit: true },
            CASHIER: { canSell: true, canService: false, canStock: false, canFinance: false, canDelete: false, canEdit: false },
            TECHNICIAN: { canSell: false, canService: true, canStock: false, canFinance: false, canDelete: false, canEdit: false },
            STAFF: { canSell: true, canService: false, canStock: false, canFinance: false, canDelete: false, canEdit: false },
        };

        const defaults = template || roleDefaults[data.role] || roleDefaults.STAFF;

        const user = await prisma.user.create({
            data: {
                name: formatName(data.name),
                surname: data.surname,
                email: normalizedEmail,
                phone: data.phone,
                image: data.image,
                role: data.role,
                password: hashedPassword,
                commissionRate: data.commissionRate,
                canSell: data.canSell ?? defaults.canSell,
                canService: data.canService ?? defaults.canService,
                canStock: data.canStock ?? defaults.canStock,
                canFinance: data.canFinance ?? defaults.canFinance,
                canDelete: data.canDelete ?? defaults.canDelete,
                canEdit: data.canEdit ?? defaults.canEdit,
                isApproved: true,
                shopId
            }
        });
        revalidatePath("/personel");
        return { success: true, user: serializePrisma(user) };
    } catch (error) {
        console.error("Error creating staff:", error);
        return { success: false, error: "Personel eklenemedi." };
    }
}

export async function updateStaff(userId: string, data: any) {
    try {
        const shopId = await getShopId();
        const session = await auth();

        const targetUser = await prisma.user.findUnique({ where: { id: userId, shopId } });
        if (!targetUser) {
            return { success: false, error: "Personel bulunamadı." };
        }

        if (targetUser.role === "SUPER_ADMIN" && session?.user?.id !== userId && session?.user?.role !== "SUPER_ADMIN") {
            return { success: false, error: "Süper Admin üzerinde değişiklik yapamazsınız." };
        }

        if (data.role === "SUPER_ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
            return { success: false, error: "Süper Admin yetkisi veremezsiniz." };
        }

        const updateData: any = { ...data };
        if (data.name) updateData.name = formatName(data.name);

        // Hash password if it's being updated
        if (data.password && data.password.length > 0) {
            updateData.password = await bcrypt.hash(data.password, 10);
        } else {
            delete updateData.password;
        }

        await prisma.user.update({
            where: { id: userId, shopId },
            data: updateData
        });

        revalidatePath("/personel");
        return { success: true };
    } catch (error) {
        console.error("Error updating staff:", error);
        return { success: false, error: "Personel bilgileri güncellenemedi." };
    }
}

export async function updateStaffCommission(userId: string, rate: number) {
    try {
        const shopId = await getShopId();
        await prisma.user.update({
            where: { id: userId, shopId },
            data: { commissionRate: rate }
        });
        revalidatePath("/personel");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Komisyon oranı güncellenemedi." };
    }
}

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

        return {
            success: true,
            hasPendingTasks: pendingTasks > 0,
            pendingTasks,
            role: user.role
        };
    } catch (error) {
        console.error("Error checking staff deletion:", error);
        return { success: false, error: "Kontrol yapılamadı." };
    }
}

export async function deleteStaff(userId: string, options?: {
    action: 'TRANSFER' | 'DELETE_ALL' | 'DETACH';
    transferToId?: string;
}) {
    try {
        const shopId = await getShopId();
        const session = await auth();

        const targetUser = await prisma.user.findUnique({ where: { id: userId, shopId } });
        if (!targetUser) {
            return { success: false, error: "Personel bulunamadı." };
        }

        if (targetUser.role === "SUPER_ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
            return { success: false, error: "Süper Admin hesabı silinemez." };
        }

        await prisma.$transaction(async (tx) => {
            if (options) {
                if (options.action === 'TRANSFER' && options.transferToId) {
                    // Transfer active tasks
                    await tx.shortageItem.updateMany({
                        where: { assignedToId: userId, isResolved: false },
                        data: { assignedToId: options.transferToId }
                    });
                    // For service tickets, we might also want to transfer assigned technician
                    await tx.serviceTicket.updateMany({
                        where: { technicianId: userId, status: { not: "DELIVERED" } },
                        data: { technicianId: options.transferToId }
                    });
                } else if (options.action === 'DELETE_ALL') {
                    // Delete unassigned shortage items (courier tasks are shortage items)
                    await tx.shortageItem.deleteMany({
                        where: { assignedToId: userId, isResolved: false }
                    });
                    // Note: We don't delete service tickets, we just unassign them or keep them
                } else if (options.action === 'DETACH') {
                    // Just unassign
                    await tx.shortageItem.updateMany({
                        where: { assignedToId: userId, isResolved: false },
                        data: { assignedToId: null }
                    });
                    await tx.serviceTicket.updateMany({
                        where: { technicianId: userId, status: { not: "DELIVERED" } },
                        data: { technicianId: null }
                    });
                }
            }

            await tx.user.delete({ where: { id: userId, shopId } });
        });

        revalidatePath("/personel");
        return { success: true };
    } catch (error) {
        console.error("Error deleting staff:", error);
        return { success: false, error: "Personel silinemedi." };
    }
}

export async function getStaffPerformance(userId?: string) {
    try {
        const shopId = await getShopId();
        const finalUserId = userId === "current" || !userId ? await getUserId() : userId;

        const user = await prisma.user.findUnique({
            where: { id: finalUserId, shopId },
            include: {
                assignedTickets: {
                    where: { status: "DELIVERED", shopId }
                },
                sales: {
                    where: { shopId }
                }
            }
        });

        if (!user) return null;

        const totalServiceRevenue = user.assignedTickets.reduce((sum, t) => sum + Number(t.actualCost || 0), 0);
        const totalSaleRevenue = user.sales.reduce((sum, s) => sum + Number(s.finalAmount || 0), 0);
        const commission = (totalServiceRevenue + totalSaleRevenue) * (Number(user.commissionRate || 0) / 100);

        return {
            serviceCount: user.assignedTickets.length,
            saleCount: user.sales.length,
            totalRevenue: totalServiceRevenue + totalSaleRevenue,
            commission: commission
        };
    } catch (error) {
        console.error("Error fetching staff performance:", error);
        return {
            serviceCount: 0,
            saleCount: 0,
            totalRevenue: 0,
            commission: 0
        };
    }
}
export async function getStaffLogs(page = 1, limit = 10, search?: string, date?: string) {
    try {
        const shopId = await getShopId();
        const skip = (page - 1) * limit;

        const where: any = { shopId };
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            where.createdAt = { gte: start, lte: end };
        }

        const serviceLogs = await prisma.serviceLog.findMany({
            where,
            include: { ticket: { include: { technician: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const sales = await prisma.sale.findMany({
            where,
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        const combined = [
            ...serviceLogs.map(log => ({
                id: log.id,
                type: 'service',
                user: log.ticket.technician || { name: 'Sistem' },
                message: `servis kaydını güncelledi: #${log.ticket.ticketNumber}`,
                createdAt: log.createdAt
            })),
            ...sales.map(sale => ({
                id: sale.id,
                type: 'sale',
                user: sale.user || { name: 'Sistem' },
                message: `satış işlemi gerçekleştirdi: ${Number(sale.finalAmount).toLocaleString('tr-TR')} ₺`,
                createdAt: sale.createdAt
            }))
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Apply search filter on combined logs
        const filtered = search
            ? combined.filter(log => log.user?.name?.toLowerCase().includes(search.toLowerCase()))
            : combined;

        const total = filtered.length;
        const paginated = filtered.slice(skip, skip + limit);

        return {
            success: true,
            logs: serializePrisma(paginated),
            totalPages: Math.ceil(total / limit),
            total
        };
    } catch (error) {
        console.error("Error fetching staff logs:", error);
        return { success: false, logs: [], totalPages: 0, total: 0 };
    }
}

export async function updateRoleTemplate(role: Role, permissions: any) {
    try {
        const res = await (prisma as any).rolePermission.upsert({
            where: { role },
            update: permissions,
            create: { role, ...permissions }
        });
        revalidatePath("/personel");
        return { success: true, template: serializePrisma(res) };
    } catch (error) {
        return { success: false, error: "Yetki şablonu güncellenemedi." };
    }
}

export async function getRoleTemplates() {
    try {
        const templates = await (prisma as any).rolePermission.findMany();
        return serializePrisma(templates);
    } catch (error) {
        return [];
    }
}

export async function getAllLogs() {
    try {
        const shopId = await getShopId();
        const serviceLogs = await prisma.serviceLog.findMany({
            where: { shopId },
            include: { ticket: { include: { technician: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const sales = await prisma.sale.findMany({
            where: { shopId },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        const combined = [
            ...serviceLogs.map(log => ({
                id: log.id,
                type: 'service',
                user: log.ticket.technician || { name: 'Sistem' },
                message: `servis kaydını güncelledi: #${log.ticket.ticketNumber}`,
                createdAt: log.createdAt
            })),
            ...sales.map(sale => ({
                id: sale.id,
                type: 'sale',
                user: sale.user || { name: 'Sistem' },
                message: `satış işlemi gerçekleştirdi: ${Number(sale.finalAmount).toLocaleString('tr-TR')} ₺`,
                createdAt: sale.createdAt
            }))
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return serializePrisma(combined);
    } catch (error) {
        console.error("Error fetching all logs:", error);
        return [];
    }
}

export async function updateProfile(data: {
    name: string;
    surname?: string;
    phone?: string;
    image?: string;
}) {
    try {
        const userId = await getUserId();
        const shopId = await getShopId();

        const updated = await prisma.user.update({
            where: { id: userId, shopId },
            data: {
                name: data.name,
                surname: data.surname,
                phone: data.phone,
                image: data.image
            }
        });

        revalidatePath("/(dashboard)/profil");
        return { success: true, user: serializePrisma(updated) };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Profil güncellenirken bir hata oluştu." };
    }
}

export async function updatePassword(data: { old: string, new: string }) {
    try {
        const userId = await getUserId();
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: "Kullanıcı bulunamadı." };

        // If user has a password, verify the old one
        if (user.password) {
            const isMatch = await bcrypt.compare(data.old, user.password);
            if (!isMatch) return { success: false, error: "Mevcut şifre hatalı." };
        }

        const hashedPassword = await bcrypt.hash(data.new, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: "Şifre güncellenirken bir hata oluştu." };
    }
}

export async function updateDashboardLayout(layout: any) {
    try {
        const userId = await getUserId();
        const shopId = await getShopId();

        console.log(`DEBUG: [updateDashboardLayout] Saving layout for user ${userId}. Items count: ${Array.isArray(layout) ? layout.length : 'not an array'}`);

        // Using executeRaw to bypass any Prisma client sync issues
        await prisma.$executeRaw`
            UPDATE "User"
            SET "dashboardLayout" = ${JSON.stringify(layout)}::jsonb
            WHERE "id" = ${userId}
        `;

        console.log(`DEBUG: [updateDashboardLayout] Raw SQL Save successful for ${userId}.`);

        // Revalidate all dashboard related paths and tags to clear cache
        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/(dashboard)/dashboard");

        // Also revalidate the shop-specific cache tags
        if (shopId) {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`dashboard-${shopId}`);
            revalidateTag(`staff-list-${shopId}`);
        }

        return { success: true };
    } catch (error) {
        console.error("DEBUG: [updateDashboardLayout] FAILED", error);
        return { success: false, error: "Düzen kaydedilemedi." };
    }
}
