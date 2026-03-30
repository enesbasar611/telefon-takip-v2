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
    .regex(/^5\d{9}$/, "Geçerli bir Türkiye telefon numarası giriniz (5xxxxxxxxx)"),
  customerEmail: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
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
  downPayment: z.number().optional().default(0),
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
      update: {
        name: validatedData.customerName,
        email: validatedData.customerEmail || null
      },
      create: {
        name: validatedData.customerName,
        phone: validatedData.customerPhone,
        email: validatedData.customerEmail || null
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

    // Handle Down Payment (Kapora) as an INCOME transaction
    if (validatedData.downPayment > 0) {
      await prisma.transaction.create({
        data: {
          type: "INCOME",
          amount: validatedData.downPayment,
          description: `KAPORA ALINDI - ${ticketNumber} (${validatedData.customerName})`,
          paymentMethod: "CASH",
          userId: user.id,
        }
      });
    }

    revalidatePath("/servis");
    revalidatePath("/servis/liste");
    revalidatePath("/finans");
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

export async function updateServiceStatus(ticketId: string, status: ServiceStatus, paymentMethod: string = "CASH", message?: string) {
  try {
    const user = await getOrCreateDevUser();

    // Fetch current ticket to calculate costs if delivering
    const currentTicket = await prisma.serviceTicket.findUnique({
      where: { id: ticketId },
      include: { usedParts: { include: { product: true } } }
    });

    if (!currentTicket) throw new Error("Servis kaydı bulunamadı.");

    const updateData: any = {
      status,
      logs: {
        create: {
          message: message || `Durum güncellendi: ${status}`,
          status: status,
        }
      }
    };

    // Auto-return stock if cancelled
    if (status === ServiceStatus.CANCELLED && currentTicket.status !== ServiceStatus.CANCELLED) {
      for (const part of currentTicket.usedParts) {
        await prisma.product.update({
          where: { id: part.productId },
          data: { stock: { increment: part.quantity } }
        });
      }
    }

    if (status === ServiceStatus.DELIVERED) {
      updateData.deliveredAt = new Date();

      // Default warranty is 1 month unless parts have more
      const defaultWarrantyMonths = 1;
      const partWarrantyMonths = currentTicket.usedParts.reduce((max, part) => {
        return Math.max(max, part.product.warrantyMonths || 0);
      }, 0);

      const finalWarrantyMonths = Math.max(defaultWarrantyMonths, partWarrantyMonths);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + finalWarrantyMonths);
      updateData.warrantyExpiry = expiryDate;

      // Calculate total revenue from this service
      const partsTotal = currentTicket.usedParts.reduce((acc, part) => acc + (Number(part.unitPrice) * part.quantity), 0);
      const laborTotal = Number(currentTicket.actualCost) || Number(currentTicket.estimatedCost);
      const totalRevenue = partsTotal + laborTotal;

      if (totalRevenue > 0) {
        if (paymentMethod === "DEBT") {
          // Create a debt record for the customer
          await prisma.debt.create({
            data: {
              customerId: currentTicket.customerId,
              amount: totalRevenue,
              remainingAmount: totalRevenue,
              notes: `SERVIS BORÇ - ${currentTicket.ticketNumber}`,
              dueDate: new Date(new Date().setDate(new Date().getDate() + 15)) // Default 15 days due date
            }
          });
        } else {
          // Regular income transaction
          await prisma.transaction.create({
            data: {
              type: "INCOME",
              amount: totalRevenue,
              description: `SERVİS TAHSİLAT - ${currentTicket.ticketNumber}`,
              paymentMethod: paymentMethod as any,
              userId: user.id,
            }
          });
        }
      }
    }

    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

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

export async function updateServiceCost(ticketId: string, estimatedCost: number, actualCost: number) {
  try {
    const ticket = await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: {
        estimatedCost: estimatedCost,
        actualCost: actualCost,
      },
    });
    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${ticketId}`);
    return { success: true, data: serializePrisma(ticket) };
  } catch (error) {
    console.error("Error updating service cost:", error);
    return { success: false, error: "Ücret güncellenirken bir hata oluştu." };
  }
}

export async function updateServicePartPrice(partId: string, unitPrice: number) {
  try {
    const part = await prisma.serviceUsedPart.update({
      where: { id: partId },
      data: { unitPrice: unitPrice },
      include: { product: true }
    });

    // Log the price change
    await prisma.serviceLog.create({
      data: {
        ticketId: part.ticketId,
        status: ServiceStatus.REPAIRING,
        message: `Parça fiyatı güncellendi: ${part.product.name} -> ₺${unitPrice.toLocaleString('tr-TR')}`,
      }
    });

    revalidatePath(`/servis/${part.ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating part price:", error);
    return { success: false, error: "Parça ücreti güncellenirken bir hata oluştu." };
  }
}

export async function addServiceLogWithNote(ticketId: string, status: ServiceStatus, message: string) {
  try {
    const log = await prisma.serviceLog.create({
      data: {
        ticketId,
        status,
        message,
      },
    });

    // Also update ticket status if provided
    await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${ticketId}`);
    return { success: true, data: serializePrisma(log) };
  } catch (error) {
    console.error("Error adding service log:", error);
    return { success: false, error: "Not eklenirken bir hata oluştu." };
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
            status: ServiceStatus.PENDING,
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

export async function addPartToService(ticketId: string, productId: string, quantity: number, unitPrice?: number) {
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
          unitPrice: unitPrice !== undefined ? unitPrice : product.sellPrice,
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

      await tx.serviceLog.create({
        data: {
          ticketId,
          status: ServiceStatus.REPAIRING,
          message: `Parça eklendi: ${product.name} (₺${unitPrice !== undefined ? unitPrice : product.sellPrice})`,
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

    revalidatePath(`/servis/liste`);
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
      }),
      prisma.serviceLog.create({
        data: {
          ticketId: part.ticketId,
          status: ServiceStatus.REPAIRING,
          message: `Parça çıkarıldı: ${part.product.name}`,
        }
      })
    ]);

    revalidatePath(`/servis/liste`);
    revalidatePath(`/servis/${part.ticketId}`);
    revalidatePath("/stok");
    return { success: true };
  } catch (error: any) {
    console.error("Error removing part from service:", error);
    return { success: false, error: error.message || "Parça çıkarılırken bir hata oluştu." };
  }
}

export async function getServiceCounts() {
  try {
    const counts = await prisma.serviceTicket.groupBy({
      by: ['status'],
      _count: true
    });

    // Total count for current active statuses (PENDING, APPROVED, REPAIRING, WAITING_PART)
    const activeCount = counts
      .filter(c => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(c.status))
      .reduce((acc, c) => acc + c._count, 0);

    const readyCount = counts.find(c => c.status === "READY")?._count || 0;
    const doneCount = counts
      .filter(c => ["DELIVERED", "CANCELLED"].includes(c.status))
      .reduce((acc, c) => acc + c._count, 0);

    const totalCount = counts.reduce((acc, c) => acc + c._count, 0);

    return {
      active: activeCount,
      ready: readyCount,
      done: doneCount,
      all: totalCount
    };
  } catch (error) {
    console.error("Error fetching service counts:", error);
    return { active: 0, ready: 0, done: 0, all: 0 };
  }
}

export async function getServiceTickets(options: {
  status?: ServiceStatus | ServiceStatus[],
  page?: number,
  pageSize?: number
} = {}) {
  const { status, page = 1, pageSize = 50 } = options;
  const skip = (page - 1) * pageSize;

  try {
    const where: any = {};
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    const tickets = await prisma.serviceTicket.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        customer: true,
        technician: true,
        logs: { orderBy: { createdAt: "desc" } },
        usedParts: { include: { product: true } },
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
