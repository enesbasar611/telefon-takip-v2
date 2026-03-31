"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { ReturnReason, ServiceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function getWarrantyStats() {
    try {
        const shopId = await getShopId();
        const now = new Date();

        const [activeWarranties, expiredWarranties, returnRequests, recentReturns] = await Promise.all([
            prisma.serviceTicket.count({
                where: { shopId, warrantyExpiry: { gt: now } }
            }),
            prisma.serviceTicket.count({
                where: { shopId, warrantyExpiry: { lte: now } }
            }),
            prisma.returnTicket.count({
                where: { shopId }
            }),
            prisma.returnTicket.findMany({
                where: { shopId },
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                    serviceTicket: {
                        include: { customer: true }
                    },
                    product: true,
                }
            })
        ]);

        return {
            activeWarranties,
            expiredWarranties,
            returnRequests,
            recentReturns: serializePrisma(recentReturns)
        };
    } catch (error) {
        console.error("Error fetching warranty stats:", error);
        return {
            activeWarranties: 0,
            expiredWarranties: 0,
            returnRequests: 0,
            recentReturns: []
        };
    }
}

export async function getTicketForWarranty(searchTerm: string) {
    try {
        const shopId = await getShopId();
        if (!searchTerm || searchTerm.length < 3) return null;

        const term = searchTerm.trim().toUpperCase();

        // Aramayı Fiş Numarası (SRV-...) veya Telefon Numarası üzerinden yap
        const tickets = await prisma.serviceTicket.findMany({
            where: {
                shopId,
                OR: [
                    { ticketNumber: { contains: term } },
                    { customer: { phone: { contains: term.replace(/\s+/g, '') } } }
                ]
            },
            include: {
                customer: true,
                usedParts: {
                    include: { product: true }
                },
                returns: true
            },
            orderBy: { createdAt: "desc" },
            take: 5
        });

        return serializePrisma(tickets);
    } catch (error) {
        console.error("Error fetching ticket for warranty:", error);
        return [];
    }
}

export async function createReturnTicket(data: {
    serviceTicketId: string;
    productId: string;
    returnReason: ReturnReason;
    notes?: string;
    createZeroFeeService?: boolean;
}) {
    try {
        const shopId = await getShopId();
        // Get the first admin user for logging (or technician)
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN", shopId } });
        if (!admin) throw new Error("Kullanıcı bulunamadı");

        const serviceTicket = await prisma.serviceTicket.findUnique({
            where: { id: data.serviceTicketId, shopId },
            include: { usedParts: { where: { productId: data.productId, shopId } }, customer: true }
        });

        if (!serviceTicket) throw new Error("Servis fişi bulunamadı");
        if (serviceTicket.usedParts.length === 0) throw new Error("Bu parça bu serviste kullanılmamış");

        const usedPart = serviceTicket.usedParts[0];

        // Transaction to create ReturnTicket and optionally a new ServiceTicket
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Return Ticket
            const returnCount = await tx.returnTicket.count();
            const ticketNumber = `RET-${1000 + returnCount + 1}`;

            const returnTicket = await tx.returnTicket.create({
                data: {
                    ticketNumber,
                    serviceTicketId: data.serviceTicketId,
                    productId: data.productId,
                    userId: admin.id,
                    returnReason: data.returnReason,
                    notes: data.notes,
                    lossAmount: usedPart.costPrice, // The shop lost the buy price of the part
                    shopId
                }
            });

            // 2. Optionally create a new ZERO-FEE service ticket for the rework
            if (data.createZeroFeeService) {
                const srvCount = await tx.serviceTicket.count({ where: { shopId } });
                const newSrvNumber = `SRV-${1000 + srvCount + 1}`;

                await tx.serviceTicket.create({
                    data: {
                        ticketNumber: newSrvNumber,
                        customerId: serviceTicket.customerId,
                        deviceBrand: serviceTicket.deviceBrand,
                        deviceModel: serviceTicket.deviceModel,
                        imei: serviceTicket.imei,
                        serialNumber: serviceTicket.serialNumber,
                        problemDesc: `GARANTİ KAPSAMINDA İŞLEM (Eski Fiş: ${serviceTicket.ticketNumber}). Müşteri Notu: ${data.notes || ''}`,
                        estimatedCost: 0,
                        status: ServiceStatus.PENDING,
                        createdById: admin.id,
                        shopId,
                        logs: {
                            create: {
                                message: `Garanti iadesi nedeniyle yeni fiş açıldı (Bağlı olduğu fiş: ${serviceTicket.ticketNumber})`,
                                status: ServiceStatus.PENDING,
                                shopId
                            }
                        }
                    }
                });
            }

            return returnTicket;
        });


        revalidatePath("/servis/liste");
        return { success: true, data: serializePrisma(result) };
    } catch (error: any) {
        console.error("Error creating return ticket:", error);
        return { success: false, error: error.message || "İade talebi oluşturulurken hata oluştu." };
    }
}
