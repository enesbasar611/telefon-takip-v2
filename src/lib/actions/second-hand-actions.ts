import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getSecondHandDevices() {
  try {
    const products = await prisma.product.findMany({
      where: { isSecondHand: true },
      include: {
        category: true,
        secondHandInfo: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return serializePrisma(products);
  } catch (error) {
    console.error("Error fetching 2nd hand devices:", error);
    return [];
  }
}

export async function updateDeviceTests(deviceId: string, testResults: any) {
  try {
    await prisma.secondHandDevice.update({
      where: { id: deviceId },
      data: {
        testResults,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/ikinci-el");
    return { success: true };
  } catch (error) {
    console.error("Error updating device tests:", error);
    return { success: false, error: "Test sonuçları güncellenirken hata oluştu." };
  }
}
