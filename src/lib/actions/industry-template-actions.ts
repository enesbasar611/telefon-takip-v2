"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { industries as hardcodedIndustries } from "@/config/industries";
import { checkSuperAdmin } from "./superadmin-actions";

export async function getIndustryTemplates() {
    try {
        await checkSuperAdmin();
        const templates = await prisma.industryTemplate.findMany({
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: templates };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateIndustryTemplate(id: string, data: {
    displayName?: string;
    primaryColor?: string;
    whatsappTemplates?: any;
    sidebarConfig?: any;
    serviceFields?: any;
    dashboardStats?: any;
}) {
    try {
        await checkSuperAdmin();
        const updated = await prisma.industryTemplate.update({
            where: { id },
            data: {
                ...(data.displayName && { displayName: data.displayName }),
                ...(data.primaryColor && { primaryColor: data.primaryColor }),
                ...(data.whatsappTemplates && { whatsappTemplates: data.whatsappTemplates }),
                ...(data.sidebarConfig && { sidebarConfig: data.sidebarConfig }),
                ...(data.serviceFields && { serviceFields: data.serviceFields }),
                ...(data.dashboardStats && { dashboardStats: data.dashboardStats }),
            }
        });
        revalidatePath("/admin/settings/sektorler");
        return { success: true, data: updated };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function seedIndustryTemplates() {
    try {
        await checkSuperAdmin();
        const results = [];
        for (const [slug, config] of Object.entries(hardcodedIndustries)) {
            const industry = config as any;
            const item = await prisma.industryTemplate.upsert({
                where: { slug },
                create: {
                    slug,
                    displayName: industry.name,
                    primaryColor: getHexColor(industry.themeColor),
                    sidebarConfig: {
                        features: industry.features,
                        labels: industry.labels
                    },
                    serviceFields: industry.serviceFormFields || [],
                    whatsappTemplates: {
                        service_created: "Sayın {customer_name}, {ticket_number} nolu servis kaydınız oluşturulmuştur. Durumu: {status}",
                        service_completed: "Sayın {customer_name}, {ticket_number} nolu cihazınız hazır! Toplam: {total_amount}",
                    },
                    dashboardStats: []
                },
                update: {} // Don't overwrite existing ones on manual seed
            });
            results.push(item);
        }
        revalidatePath("/admin/settings/sektorler");
        return { success: true, count: results.length };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

function getHexColor(themeColor: string) {
    const colors: Record<string, string> = {
        blue: "#3b82f6",
        amber: "#f59e0b",
        cyan: "#06b6d4",
        indigo: "#6366f1",
        emerald: "#10b981",
        rose: "#f43f5e",
        slate: "#64748b",
        orange: "#f97316",
        purple: "#a855f7"
    };
    return colors[themeColor] || "#6366f1";
}

export async function deleteIndustryTemplate(id: string) {
    try {
        await checkSuperAdmin();
        await prisma.industryTemplate.delete({ where: { id } });
        revalidatePath("/admin/settings/sektorler");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
