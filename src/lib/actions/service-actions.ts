import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ServiceStatus } from "@prisma/client";

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

export async function createServiceTicket(data: {
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  imei?: string;
  problemDesc: string;
  estimatedCost: number;
}) {
  const user = await getOrCreateDevUser();

  // Find or create customer
  const customer = await prisma.customer.upsert({
    where: { phone: data.customerPhone },
    update: { name: data.customerName },
    create: {
      name: data.customerName,
      phone: data.customerPhone,
    },
  });

  const ticketCount = await prisma.serviceTicket.count();
  const ticketNumber = `SRV-${1000 + ticketCount + 1}`;

  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketNumber,
      customerId: customer.id,
      deviceBrand: data.deviceBrand,
      deviceModel: data.deviceModel,
      imei: data.imei,
      problemDesc: data.problemDesc,
      estimatedCost: data.estimatedCost,
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
  return ticket;
}

export async function updateServiceStatus(ticketId: string, status: ServiceStatus) {
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
  return ticket;
}

export async function deleteServiceTicket(id: string) {
  await prisma.serviceLog.deleteMany({ where: { ticketId: id } });
  await prisma.serviceUsedPart.deleteMany({ where: { ticketId: id } });
  await prisma.serviceTicket.delete({ where: { id } });
  revalidatePath("/servis");
}

export async function getServiceTickets() {
  try {
    return await prisma.serviceTicket.findMany({
      include: {
        customer: true,
        technician: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching service tickets:", error);
    return [];
  }
}
