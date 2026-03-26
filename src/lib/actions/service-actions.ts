"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ServiceStatus } from "@prisma/client";
import { serializePrisma } from "@/lib/utils";
import * as z from "zod";
import { addShortageItem } from "./shortage-actions";

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
  serialNumber: z.string().optional().or(z.literal("")),
  problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
  cosmeticCondition: z.string().optional(),
  estimatedCost: z.number().min(0, "Geçerli bir ücret giriniz"),
  notes: z.string().optional(),
  technicianId: z.string().optional().or(z.literal("")),
  estimatedDeliveryDate: z.string().optional().or(z.literal("")),
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
        serialNumber: validatedData.serialNumber || null,
        problemDesc: validatedData.problemDesc,
        cosmeticCondition: validatedData.cosmeticCondition || null,
        notes: validatedData.notes || null,
        estimatedCost: validatedData.estimatedCost,
        technicianId: validatedData.technicianId || null,
        estimatedDeliveryDate: validatedData.estimatedDeliveryDate ? new Date(validatedData.estimatedDeliveryDate) : null,
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
    revalidatePath("/servis/liste");
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

    // Logic for double-deduction and redundant transaction creation removed.
    // Stock is already deducted in addPartToService.
    // Transactions should be recorded via a dedicated payment/checkout flow or explicitly on DELIVERED if not already present.

    // For now, let's keep it simple and only log the status change.

    revalidatePath("/servis");
    revalidatePath("/stok");
    revalidatePath("/finans");
    revalidatePath("/");
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    console.error("Error updating service status:", error);
    return { success: false, error: "Durum güncellenirken bir hata oluştu." };
  }
}

export async function assignTechnician(ticketId: string, technicianId: string) {
  try {
    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        technicianId,
        logs: {
          create: {
            message: `Teknisyen atandı.`,
            status: ServiceStatus.PENDING, // Keeping current status or fetching it
          }
        }
      },
    });

    revalidatePath("/servis/liste");
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    console.error("Error assigning technician:", error);
    return { success: false, error: "Teknisyen atanırken bir hata oluştu." };
  }
}

export async function deleteServiceTicket(id: string) {
  const usedParts = await prisma.serviceUsedPart.findMany({ where: { ticketId: id } });

  // Restore stock before deletion
  for (const part of usedParts) {
    await prisma.product.update({
      where: { id: part.productId },
      data: {
        stock: { increment: part.quantity },
        movements: {
          create: {
            quantity: part.quantity,
            type: "ADJUSTMENT",
            notes: `Servis silindiği için stok iade edildi: ${id}`,
            serviceTicketId: id
          }
        }
      }
    });
  }

  await prisma.serviceLog.deleteMany({ where: { ticketId: id } });
  await prisma.serviceUsedPart.deleteMany({ where: { ticketId: id } });
  await prisma.inventoryMovement.deleteMany({ where: { serviceTicketId: id } });
  await prisma.serviceTicket.delete({ where: { id } });

  revalidatePath("/servis");
  revalidatePath("/stok");
  revalidatePath("/");
}

export async function addPartToService(ticketId: string, productId: string, quantity: number) {
  try {
    const user = await getOrCreateDevUser();
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Ürün bulunamadı");
    if (product.stock < quantity) throw new Error("Yetersiz stok.");

    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.serviceUsedPart.create({
        data: {
          ticketId,
          productId,
          quantity,
          unitPrice: product.sellPrice,
          costPrice: product.buyPrice,
        }
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          movements: {
            create: {
              quantity: -quantity,
              type: "SERVICE_USE",
              notes: `Servis kullanımı: ${ticketId}`,
              serviceTicketId: ticketId
            }
          },
          inventoryLogs: {
            create: {
              userId: user.id,
              quantity: -quantity,
              type: "SERVICE_USE",
              notes: `Servis kaydına parça eklendi: ${ticketId}`
            }
          }
        }
      });

      return { part, updatedProduct };
    });

    if (result.updatedProduct.stock <= 0) {
      await addShortageItem({
        productId: productId,
        name: product.name,
        quantity: 1,
        notes: `Servis kullanımı sonucu stok tükendi: ${ticketId}`
      });
    }

    revalidatePath(`/servis/${ticketId}`);
    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding part to service:", error);
    return { success: false, error: error.message || "Parça eklenirken bir hata oluştu." };
  }
}

export async function removePartFromService(partId: string) {
  try {
    const part = await prisma.serviceUsedPart.findUnique({
      where: { id: partId },
      include: { product: true }
    });

    if (!part) throw new Error("Kayıt bulunamadı.");

    await prisma.$transaction([
      prisma.product.update({
        where: { id: part.productId },
        data: {
          stock: { increment: part.quantity },
          movements: {
            create: {
              quantity: part.quantity,
              type: "ADJUSTMENT",
              notes: `Servisten parça çıkarıldı: ${part.ticketId}`,
              serviceTicketId: part.ticketId
            }
          }
        }
      }),
      prisma.serviceUsedPart.delete({
        where: { id: partId }
      })
    ]);

    revalidatePath(`/servis/${part.ticketId}`);
    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Error removing part from service:", error);
    return { success: false, error: error.message || "Parça çıkarılırken bir hata oluştu." };
  }
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

export async function queryServiceStatus(ticketNumber: string, phone: string) {
  try {
    const ticket = await prisma.serviceTicket.findFirst({
      where: {
        ticketNumber: ticketNumber.toUpperCase(),
        customer: {
          phone: phone.replace(/\s+/g, '')
        }
      },
      include: {
        customer: true,
        logs: { orderBy: { createdAt: "desc" } },
      }
    });
    return serializePrisma(ticket);
  } catch (error) {
    console.error("Query service status error:", error);
    return null;
  }
}
