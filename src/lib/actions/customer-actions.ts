"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { formatProperCase, formatPhoneRaw } from "@/lib/formatters";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

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

export async function createCustomer(data: {
  name: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  type?: string;
  isVip?: boolean;
  photo?: string;
}) {
  try {
    const shopId = await getShopId();
    const customer = await prisma.customer.create({
      data: {
        ...data,
        name: formatProperCase(data.name),
        phone: formatPhoneRaw(data.phone || ""),
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

export async function updateCustomer(id: string, data: {
  name?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  type?: string;
  isVip?: boolean;
  photo?: string;
}) {
  try {
    const shopId = await getShopId();
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
    console.error("Error updating customer:", error);
    return { success: false, error: "Müşteri güncellenirken hata oluştu." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const shopId = await getShopId();
    await prisma.customer.delete({ where: { id, shopId } });
    revalidatePath("/musteriler");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Müşteri silinemedi. Aktif kayıtları olabilir." };
  }
}
