"use server";
import prisma from "@/lib/prisma";
import { serializePrisma, formatName } from "@/lib/utils";
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
        name: formatName(data.name),
        shopId,
        phone: data.phone || "" // Safety fallback
      }
    });
    revalidatePath("/musteriler");
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
        ...(data.name ? { name: formatName(data.name) } : {})
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
