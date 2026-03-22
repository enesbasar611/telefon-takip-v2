import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function getStaff() {
  try {
    const staff = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}
