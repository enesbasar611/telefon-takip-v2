"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateExchangeRates(rates: { usd: number; eur: number }) {
  try {
    await prisma.setting.upsert({
      where: { key: "exchange_rate_usd" },
      update: { value: rates.usd.toString() },
      create: { key: "exchange_rate_usd", value: rates.usd.toString() }
    });
    await prisma.setting.upsert({
      where: { key: "exchange_rate_eur" },
      update: { value: rates.eur.toString() },
      create: { key: "exchange_rate_eur", value: rates.eur.toString() }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Kur bilgileri güncellenemedi." };
  }
}

export async function getExchangeRates() {
    const settings = await prisma.setting.findMany({
        where: {
            key: { in: ["exchange_rate_usd", "exchange_rate_eur"] }
        }
    });

    return {
        usd: parseFloat(settings.find(s => s.key === "exchange_rate_usd")?.value || "1"),
        eur: parseFloat(settings.find(s => s.key === "exchange_rate_eur")?.value || "1"),
    };
}
