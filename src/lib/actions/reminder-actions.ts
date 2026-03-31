"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

export async function getReminders() {
    try {
        const shopId = await getShopId();
        const reminders = await prisma.reminder.findMany({
            where: { shopId, isCompleted: false },
            orderBy: { date: 'asc' },
            include: { user: { select: { name: true } } }
        });
        return serializePrisma(reminders);
    } catch (error) {
        console.error("Error fetching reminders:", error);
        return [];
    }
}

export async function createReminderAction(data: {
    title: string;
    description?: string;
    date: Date;
    category: string;
    recurrence: string;
    assignedTo?: string;
    creatorId: string;
}) {
    try {
        const shopId = await getShopId();
        const reminder = await prisma.reminder.create({
            data: {
                ...data,
                shopId,
                date: new Date(data.date)
            }
        });
        revalidatePath("/bildirimler");
        return { success: true, reminder: serializePrisma(reminder) };
    } catch (error) {
        console.error("Error creating reminder:", error);
        return { success: false, error: "Hatırlatıcı oluşturulamadı" };
    }
}

export async function updateReminderStatusAction(id: string, isCompleted: boolean) {
    try {
        const shopId = await getShopId();
        await prisma.reminder.updateMany({
            where: { id, shopId },
            data: { isCompleted }
        });
        revalidatePath("/bildirimler");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteReminderAction(id: string) {
    try {
        const shopId = await getShopId();
        await prisma.reminder.deleteMany({
            where: { id, shopId }
        });
        revalidatePath("/bildirimler");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
