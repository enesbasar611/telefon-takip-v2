"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getShopId, getUserId } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";
import { AgendaEventType } from "@prisma/client";

export async function createAgendaEventAction(data: {
    title: string;
    type: AgendaEventType;
    date: Date;
    category?: string;
    amount?: number;
    assignedTo?: string[];
    notes?: string;
}) {
    try {
        const shopId = await getShopId();

        const event = await prisma.agendaEvent.create({
            data: {
                title: data.title,
                type: data.type,
                date: data.date,
                category: data.category,
                amount: data.amount,
                assignedTo: data.assignedTo || [],
                notes: data.notes,
                shopId
            }
        });

        revalidatePath("/ajanda");
        return { success: true, event: serializePrisma(event) };
    } catch (error) {
        console.error("Error creating agenda event:", error);
        return { success: false, error: "Gündem maddesi oluşturulamadı." };
    }
}

export async function createRecurringAgendaEventsAction(data: {
    title: string;
    type: AgendaEventType;
    startDate: Date;
    monthsToRepeat: number;
    category?: string;
    amount?: number;
    notes?: string;
    assignedTo?: string[];
}) {
    try {
        const shopId = await getShopId();

        const eventsToCreate = [];
        const baseDate = new Date(data.startDate);

        // Generate dates (e.g., repeating for X months)
        for (let i = 0; i < data.monthsToRepeat; i++) {
            const nextDate = new Date(baseDate);
            nextDate.setMonth(baseDate.getMonth() + i);

            eventsToCreate.push({
                title: data.title,
                type: data.type,
                date: nextDate,
                category: data.category,
                amount: data.amount,
                notes: data.notes,
                shopId
            });
        }

        await prisma.agendaEvent.createMany({
            data: eventsToCreate
        });

        revalidatePath("/ajanda");
        return { success: true, count: eventsToCreate.length };
    } catch (error) {
        console.error("Error creating recurring events:", error);
        return { success: false, error: "Tekrarlı kayıtlar oluşturulamadı." };
    }
}

export async function realizeAgendaEventAction(eventId: string, accountId: string) {
    try {
        const shopId = await getShopId();
        const userId = await getUserId();

        const agendaEvent = await prisma.agendaEvent.findUnique({
            where: { id: eventId, shopId }
        });

        if (!agendaEvent || (agendaEvent.type !== 'PAYMENT' && agendaEvent.type !== 'COLLECTION')) {
            return { success: false, error: "Bu etkinlik işlenemez." };
        }

        // Create transaction
        const txType = agendaEvent.type === 'PAYMENT' ? 'EXPENSE' : 'INCOME';

        // Get active session if any
        const activeSession = await prisma.dailySession.findFirst({
            where: { status: "OPEN", shopId }
        });

        await prisma.$transaction(async (tx) => {
            // Create the real transaction
            await tx.transaction.create({
                data: {
                    type: txType,
                    amount: agendaEvent.amount || 0,
                    description: agendaEvent.title,
                    paymentMethod: "CASH", // Default to CASH, can be updated later
                    financeAccountId: accountId,
                    category: agendaEvent.category || "Finans",
                    dailySessionId: activeSession?.id,
                    userId,
                    shopId,
                    createdAt: new Date(),
                }
            });

            // Adjust account balances
            await tx.financeAccount.update({
                where: { id: accountId },
                data: {
                    balance: {
                        [txType === 'INCOME' ? 'increment' : 'decrement']: agendaEvent.amount || 0
                    }
                }
            });

            // Mark as completed instead of deleting
            await tx.agendaEvent.update({
                where: { id: eventId },
                data: { isCompleted: true }
            });
        });

        revalidatePath("/ajanda");
        revalidatePath("/satis/kasa");
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Error realizing event:", error);
        return { success: false, error: "İşlem gerçekleştirilemedi." };
    }
}

export async function getCalendarEventsAction(year: number, month: number) {
    // year = 2024, month = index (0-11)
    try {
        const shopId = await getShopId();

        // Month ranges — month is 1-indexed (e.g. April = 4)
        // In JS Date: month index is 0-based, so month-1 = current, month-2 = previous
        const start = new Date(year, month - 2, 20); // start from ~20th of prev month (covers prev month days shown in grid)
        const end = new Date(year, month, 10);        // end at ~10th of next month (covers next month days shown in grid)

        // Fetch manual agenda events
        const agendaEvents = await prisma.agendaEvent.findMany({
            where: { shopId, date: { gte: start, lte: end } }
        });

        // Fetch service tickets (use estimatedDeliveryDate or createdAt)
        const services = await prisma.serviceTicket.findMany({
            where: { shopId, createdAt: { gte: start, lte: end } },
            select: { id: true, ticketNumber: true, deviceModel: true, estimatedCost: true, createdAt: true, status: true, estimatedDeliveryDate: true }
        });

        // Fetch supplier transactions (payments)
        const supplierTx = await prisma.supplierTransaction.findMany({
            where: { shopId, date: { gte: start, lte: end } },
            select: { id: true, amount: true, description: true, type: true, date: true, supplier: { select: { name: true } } }
        });

        const mappedEvents: any[] = [];

        // Map AgendaEvents
        agendaEvents.forEach((a: any) => {
            mappedEvents.push({
                id: a.id,
                title: a.title,
                type: a.type,
                date: a.date,
                amount: a.amount ? Number(a.amount) : null,
                category: a.category,
                isCompleted: a.isCompleted || false,
                source: 'AGENDA'
            });
        });

        // Map Services
        services.forEach((s: any) => {
            mappedEvents.push({
                id: s.id,
                title: `${s.ticketNumber} - ${s.deviceModel}`,
                type: 'SERVICE',
                date: s.estimatedDeliveryDate || s.createdAt,
                amount: s.estimatedCost ? Number(s.estimatedCost) : null,
                category: `Servis (${s.status})`,
                source: 'SERVICE'
            });
        });

        // Map Supplier Transactions
        supplierTx.forEach((tx: any) => {
            mappedEvents.push({
                id: tx.id,
                title: `${tx.supplier.name} - ${tx.description}`,
                type: tx.type === 'EXPENSE' ? 'PAYMENT' : 'COLLECTION',
                date: tx.date,
                amount: tx.amount ? Number(tx.amount) : null,
                category: 'Tedarikçi İşlemi',
                source: 'SUPPLIER_TX'
            });
        });

        return serializePrisma(mappedEvents);
    } catch (error) {
        console.error("Error fetching agenda events:", error);
        return [];
    }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteAgendaEventAction(eventId: string) {
    try {
        const shopId = await getShopId();
        await prisma.agendaEvent.delete({ where: { id: eventId, shopId } });
        revalidatePath("/ajanda");
        return { success: true };
    } catch (error) {
        console.error("Error deleting agenda event:", error);
        return { success: false, error: "Silme işlemi başarısız." };
    }
}

// ─── Reschedule ───────────────────────────────────────────────────────────────
export async function rescheduleAgendaEventAction(eventId: string, newDate: Date) {
    try {
        const shopId = await getShopId();
        await prisma.agendaEvent.update({
            where: { id: eventId, shopId },
            data: { date: newDate }
        });
        revalidatePath("/ajanda");
        return { success: true };
    } catch (error) {
        console.error("Error rescheduling agenda event:", error);
        return { success: false, error: "Erteleme işlemi başarısız." };
    }
}

// ─── Complete (Task done / Service started badge) ─────────────────────────────
export async function completeAgendaEventAction(eventId: string) {
    try {
        const shopId = await getShopId();
        // Mark the event as completed instead of deleting
        await prisma.agendaEvent.update({
            where: { id: eventId, shopId },
            data: { isCompleted: true }
        });
        revalidatePath("/ajanda");
        return { success: true };
    } catch (error) {
        console.error("Error completing agenda event:", error);
        return { success: false, error: "Tamamlama işlemi başarısız." };
    }
}

// ─── Bulk Delete ─────────────────────────────────────────────────────────────
export async function bulkDeleteAgendaEventsAction(eventIds: string[]) {
    try {
        const shopId = await getShopId();
        await prisma.agendaEvent.deleteMany({
            where: { id: { in: eventIds }, shopId }
        });
        revalidatePath("/ajanda");
        return { success: true };
    } catch (error) {
        console.error("Error bulk deleting agenda events:", error);
        return { success: false, error: "Toplu silme işlemi başarısız." };
    }
}
// ─── Clear All ─────────────────────────────────────────────────────────────
export async function clearAllAgendaEventsAction() {
    try {
        const shopId = await getShopId();
        await prisma.agendaEvent.deleteMany({
            where: { shopId }
        });
        revalidatePath("/ajanda");
        return { success: true };
    } catch (error) {
        console.error("Error clearing agenda events:", error);
        return { success: false, error: "Takvim temizleme işlemi başarısız." };
    }
}
