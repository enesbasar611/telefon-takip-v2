"use server";

import prisma from "@/lib/prisma";
import { getShopId, getUserId } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type LogFilter = {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
};

export async function recordAuditLog(params: {
    action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "RETURN" | "LOGIN";
    entityType: "PRODUCT" | "STAFF" | "CUSTOMER" | "SALE" | "SERVICE" | "FINANCE" | "SETTING" | "SYSTEM";
    entityId?: string;
    entityName?: string;
    message: string;
    details?: any;
}) {
    try {
        const shopId = await getShopId();
        const userId = await getUserId();

        const log = await prisma.auditLog.create({
            data: {
                shopId,
                userId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                entityName: params.entityName,
                message: params.message,
                details: params.details || {},
            },
        });
        return { success: true, id: log.id };
    } catch (error) {
        console.error("Audit log creation error:", error);
        return { success: false };
    }
}

export async function getActivityLogs(filters: LogFilter = {}) {
    try {
        const shopId = await getShopId();
        if (!shopId) throw new Error("Mağaza ID bulunamadı.");

        const {
            page = 1,
            limit = 20,
            search,
            action,
            entityType,
            startDate,
            endDate
        } = filters;

        const skip = (page - 1) * limit;

        const where: any = { shopId };

        if (search) {
            where.OR = [
                { message: { contains: search, mode: 'insensitive' } },
                { entityName: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (action && action !== 'all') where.action = action;
        if (entityType && entityType !== 'all') where.entityType = entityType;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                where.createdAt.gte = s;
            }
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                where.createdAt.lte = e;
            }
        }

        const [total, logs] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            surname: true,
                            role: true,
                            image: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        return {
            success: true,
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearAllActivityLogs() {
    try {
        const shopId = await getShopId();
        const userId = await getUserId();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        // Use Role from @prisma/client which is already available
        if (user?.role !== Role.SUPER_ADMIN && user?.role !== Role.SHOP_MANAGER) {
            throw new Error("Bu işlem için yetkiniz bulunmamaktadır.");
        }

        await prisma.auditLog.deleteMany({
            where: { shopId }
        });

        revalidatePath("/ayarlar/loglar");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
