"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ServiceStatus } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";
import * as z from "zod";

const serviceSchema = z.object({
  customerName: z.string()
    .min(2, "Müşteri adı en az 2 karakter olmalıdır")
    .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Müşteri adı sadece harflerden oluşmalıdır"),
  customerPhone: z.string()
    .regex(/^5\d{9}$/, "Geçerli bir Türkiye telefon numarası giriniz (5xx...)"),
  deviceBrand: z.string().min(1, "Marka gereklidir"),
  deviceModel: z.string().min(1, "Model gereklidir"),
  imei: z.string()
    .length(15, "IMEI numarası tam olarak 15 haneli olmalıdır")
    .regex(/^\d+$/, "IMEI sadece rakamlardan oluşmalıdır")
    .optional()
    .or(z.literal("")),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  estimatedCost: z.number().min(0, "Geçerli bir ücret giriniz"),
});

async function getOrCreateDevUser() {
  return await prisma.user.upsert({
    where: { email: "admin@takipv2.com" },
    update: {},
    create: {
      email: "admin@takipv2.com",
      name: "Admin",
      password: "hashed_password",
      role: "ADMIN",
    },
  });
}

export async function createServiceTicket(rawData: any) {
  try {
    const validatedData = serviceSchema.parse(rawData);
    const user = await getOrCreateDevUser();

    // Find or create customer
    const customer = await prisma.customer.upsert({
      where: { phone: validatedData.customerPhone },
      update: { name: validatedData.customerName },
      create: {
        name: validatedData.customerName,
        phone: validatedData.customerPhone,
      },
    });

    const ticketCount = await prisma.serviceTicket.count();
    const ticketNumber = `SRV-${1000 + ticketCount + 1}`;

    const ticket = await prisma.serviceTicket.create({
      data: {
        ticketNumber,
        customerId: customer.id,
        deviceBrand: validatedData.deviceBrand,
        deviceModel: validatedData.deviceModel,
        imei: validatedData.imei || null,
        problemDesc: validatedData.problemDesc,
        estimatedCost: validatedData.estimatedCost,
        createdById: user.id,
        status: ServiceStatus.PENDING,
        logs: {
          create: {
            message: "Yeni servis kaydı oluşturuldu.",
            status: ServiceStatus.PENDING,
          }
        }
      },
    });

    revalidatePath("/servis");
    revalidatePath("/");
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Error creating service ticket:", error);
    return { success: false, error: "Servis kaydı oluşturulurken bir hata oluştu." };
  }
}

export async function updateServiceStatus(ticketId: string, status: ServiceStatus) {
  try {
    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        status,
        logs: {
          create: {
            message: `Durum güncellendi: ${status}`,
            status: status,
          }
        }
      },
    });

    revalidatePath("/servis");
    revalidatePath("/");
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    console.error("Error updating service status:", error);
    return { success: false, error: "Durum güncellenirken bir hata oluştu." };
  }
}

export async function deleteServiceTicket(id: string) {
  await prisma.serviceLog.deleteMany({ where: { ticketId: id } });
  await prisma.serviceUsedPart.deleteMany({ where: { ticketId: id } });
  await prisma.serviceTicket.delete({ where: { id } });
  revalidatePath("/servis");
}

export async function getServiceTickets() {
  try {
    const tickets = await prisma.serviceTicket.findMany({
      include: {
        customer: true,
        technician: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return serializePrisma(tickets);
  } catch (error) {
    console.error("Error fetching service tickets:", error);
    return [];
  }
}

export async function getServiceTicketById(id: string) {
  try {
    const ticket = await prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
        logs: { orderBy: { createdAt: "desc" } },
        usedParts: { include: { product: true } },
      },
    });
    return serializePrisma(ticket);
  } catch (error) {
    console.error("Error fetching service ticket by id:", error);
    return null;
  }
}
