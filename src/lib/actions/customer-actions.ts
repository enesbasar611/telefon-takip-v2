"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { formatProperCase, formatPhoneRaw } from "@/lib/formatters";
import { revalidatePath } from "next/cache";
import { getShopId, getUserId } from "@/lib/auth";
import { customerSchema } from "@/lib/validations/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export async function getCustomers() {
  try {
    const shopId = await getShopId();
    const customers = await prisma.customer.findMany({
      where: { shopId },
      include: {
        tickets: true,
        sales: true,
        debts: true
      },
      orderBy: { updatedAt: "desc" }
    });
    return serializePrisma(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function getCustomersPaginated(params: {
  page?: number,
  limit?: number,
  search?: string,
  typeFilter?: string
}) {
  try {
    const shopId = await getShopId();

    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { shopId };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search } },
        { email: { contains: params.search, mode: "insensitive" } }
      ];
    }

    if (params.typeFilter && params.typeFilter !== "all") {
      if (params.typeFilter === "VIP") {
        where.isVip = true;
      } else {
        where.type = params.typeFilter;
      }
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          secondaryPhone: true,
          email: true,
          type: true,
          isVip: true,
          photo: true,
          loyaltyPoints: true,
          createdAt: true,
          updatedAt: true,
          // Instead of full relations, we just grab their counts
          tickets: { select: { id: true } },
          sales: { select: { id: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip,
      })
    ]);

    return {
      data: serializePrisma(customers),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error("Error fetching paginated customers:", error);
    return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
  }
}

export async function getCustomerById(id: string) {
  try {
    const shopId = await getShopId();
    const customer = await prisma.customer.findUnique({
      where: { id, shopId },
      include: {
        tickets: {
          orderBy: { createdAt: "desc" },
          include: {
            technician: true,
            usedParts: {
              include: {
                product: {
                  include: {
                    supplier: true,
                    category: true
                  }
                }
              }
            }
          }
        },
        sales: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    supplier: true,
                    category: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        debts: { orderBy: { createdAt: "desc" } }
      }
    });

    if (!customer) return null;

    return serializePrisma(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export async function createCustomer(rawData: z.infer<typeof customerSchema>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 20 creations per minute per user
    await checkRateLimit(`createCustomer:${userId}`, 20);

    const data = customerSchema.parse(rawData);

    const customer = await prisma.customer.create({
      data: {
        ...data,
        name: formatProperCase(data.name),
        phone: data.phone ? formatPhoneRaw(data.phone) : undefined,
        secondaryPhone: data.secondaryPhone ? formatPhoneRaw(data.secondaryPhone) : undefined,
        shopId,
      }
    });
    revalidatePath("/musteriler");
    return { success: true, customer: serializePrisma(customer) };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Müşteri oluşturulurken hata oluştu." };
  }
}

export async function createCustomerMuted(data: {
  name: string;
  phone?: string;
  email?: string;
}) {
  try {
    const shopId = await getShopId();
    const customer = await prisma.customer.create({
      data: {
        ...data,
        name: formatProperCase(data.name),
        phone: formatPhoneRaw(data.phone || ""),
        shopId,
      }
    });
    // No revalidatePath to prevent router cache purge and silent page reload
    return { success: true, customer: serializePrisma(customer) };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Müşteri oluşturulurken hata oluştu." };
  }
}

export async function updateCustomer(id: string, rawData: Partial<z.infer<typeof customerSchema>>) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 50 updates per minute per user
    await checkRateLimit(`updateCustomer:${userId}`, 50);

    const data = customerSchema.partial().parse(rawData);

    const customer = await prisma.customer.update({
      where: { id, shopId },
      data: {
        ...data,
        ...(data.name ? { name: formatProperCase(data.name) } : {}),
        ...(data.phone ? { phone: formatPhoneRaw(data.phone) } : {}),
        ...(data.secondaryPhone ? { secondaryPhone: formatPhoneRaw(data.secondaryPhone) } : {})
      }
    });
    revalidatePath("/musteriler");
    revalidatePath(`/musteriler/${id}`);
    return { success: true, customer: serializePrisma(customer) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Error updating customer:", error);
    return { success: false, error: error instanceof Error ? error.message : "Müşteri güncellenirken hata oluştu." };
  }
}

export async function deleteCustomer(id: string, options?: {
  deleteRecords: boolean;
  revertStock: boolean;
  clearBalance: boolean;
}) {
  try {
    const shopId = await getShopId();
    const userId = await getUserId();

    // Rate limit: 10 deletions per minute per user
    await checkRateLimit(`deleteCustomer:${userId}`, 10);

    return await prisma.$transaction(async (tx) => {
      // 1. Handle Sales
      const sales = await tx.sale.findMany({
        where: { customerId: id, shopId },
        include: { items: true }
      });

      if (options?.deleteRecords) {
        for (const sale of sales) {
          if (options.revertStock) {
            // Increment stock back for each item
            for (const item of sale.items) {
              await tx.product.update({
                where: { id: item.productId, shopId },
                data: { stock: { increment: item.quantity } }
              });
            }
          }
          // Delete related movements and items
          await tx.inventoryMovement.deleteMany({ where: { saleId: sale.id, shopId } });
          await tx.saleItem.deleteMany({ where: { saleId: sale.id, shopId } });
          await tx.transaction.deleteMany({ where: { saleId: sale.id, shopId } });
          await tx.sale.delete({ where: { id: sale.id, shopId } });
        }
      } else {
        // Just detach customer from sales
        await tx.sale.updateMany({
          where: { customerId: id, shopId },
          data: { customerId: null }
        });
      }

      // 2. Handle Service Tickets
      if (options?.deleteRecords) {
        const tickets = await tx.serviceTicket.findMany({ where: { customerId: id, shopId } });
        for (const ticket of tickets) {
          await tx.serviceUsedPart.deleteMany({ where: { ticketId: ticket.id, shopId } });
          await tx.serviceLog.deleteMany({ where: { ticketId: ticket.id, shopId } });
          await tx.returnTicket.deleteMany({ where: { serviceTicketId: ticket.id, shopId } });
          await tx.inventoryMovement.deleteMany({ where: { serviceTicketId: ticket.id, shopId } });
          await tx.serviceTicket.delete({ where: { id: ticket.id, shopId } });
        }
      } else {
        // ServiceTicket.customerId is non-nullable. We must reassign or delete.
        // We'll look for or create an 'Anonim' customer for this shop
        let anonCustomer = await tx.customer.findFirst({
          where: { shopId, name: "Anonim Müşteri", type: "ANONIM" }
        });

        if (!anonCustomer) {
          anonCustomer = await tx.customer.create({
            data: {
              name: "Anonim Müşteri",
              type: "ANONIM",
              shopId,
              phone: `0000000000-${Date.now()}` // Bypass unique constraint
            }
          });
        }

        await tx.serviceTicket.updateMany({
          where: { customerId: id, shopId },
          data: { customerId: anonCustomer.id }
        });
      }

      // 3. Handle Balances (Debts)
      if (options?.clearBalance) {
        await tx.debt.deleteMany({ where: { customerId: id, shopId } });
      } else {
        // If not clearing balance, we must reassign debts if the customer is being deleted
        // but that's logically difficult. We'll stick to 'clearBalance' true as recommended.
        await tx.debt.deleteMany({ where: { customerId: id, shopId } });
      }

      // 4. Finally delete customer
      await tx.customer.delete({ where: { id, shopId } });

      revalidatePath("/musteriler");
      return { success: true };
    });
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return { success: false, error: error.message || "Müşteri silinemedi." };
  }
}
