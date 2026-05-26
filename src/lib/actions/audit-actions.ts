"use server";

import prisma from "@/lib/prisma";
import { getShopId, getUserId } from "@/lib/auth";

export async function recordAuditLog(params: {
    action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "RETURN";
    entityType: "PRODUCT" | "STAFF" | "CUSTOMER" | "SALE" | "SERVICE" | "FINANCE" | "SETTING";
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
