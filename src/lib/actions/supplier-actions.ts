import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}
