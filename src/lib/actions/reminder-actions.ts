"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/utils";

export async function getReminders() {
    try {
        const reminders = await prisma.reminder.findMany({
            where: { isCompleted: false },
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
        const reminder = await prisma.reminder.create({
            data: {
                ...data,
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
        await prisma.reminder.update({
            where: { id },
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
        await prisma.reminder.delete({
            where: { id }
        });
        revalidatePath("/bildirimler");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
