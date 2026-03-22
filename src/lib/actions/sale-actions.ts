import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { PaymentMethod, TransactionType } from "@prisma/client";

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

export async function createSale(data: {
  customerId?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  paymentMethod: string;
}) {
  try {
    const user = await getOrCreateDevUser();
    const saleCount = await prisma.sale.count();
    const saleNumber = `SALE-${1000 + saleCount + 1}`;

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: data.customerId,
        userId: user.id,
        totalAmount: data.totalAmount,
        finalAmount: data.totalAmount,
        paymentMethod: (data.paymentMethod === "CASH" ? PaymentMethod.CASH :
                        data.paymentMethod === "CREDIT_CARD" ? PaymentMethod.CARD :
                        PaymentMethod.TRANSFER) as PaymentMethod,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
    });

    // Update stock and create movements
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          type: "SALE",
          notes: `SATIŞ - ${sale.saleNumber}`,
        },
      });
    }

    // Create financial transaction
    await prisma.transaction.create({
      data: {
        amount: data.totalAmount,
        type: TransactionType.INCOME,
        description: `SATIŞ - ${sale.saleNumber}`,
        paymentMethod: sale.paymentMethod,
        userId: user.id,
        saleId: sale.id,
      },
    });

    revalidatePath("/satis");
    revalidatePath("/stok");
    revalidatePath("/finans");

    return { success: true, data: serializePrisma(sale) };
  } catch (error) {
    console.error("Sale creation error:", error);
    return { success: false, error: "Satış işlemi sırasında bir hata oluştu." };
  }
}

export async function getSales() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(sales);
  } catch (error) {
    console.error("Fetch sales error:", error);
    return [];
  }
}
