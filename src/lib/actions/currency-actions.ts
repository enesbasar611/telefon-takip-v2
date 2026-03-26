"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function syncAllRates() {
  try {
    // Rate limiting check
    const now = new Date();
    const lastRefreshSetting = await prisma.setting.findUnique({ where: { key: "currency_last_refresh" } });
    const refreshCountSetting = await prisma.setting.findUnique({ where: { key: "currency_refresh_count" } });

    const lastRefresh = lastRefreshSetting ? new Date(lastRefreshSetting.value) : new Date(0);
    let refreshCount = refreshCountSetting ? parseInt(refreshCountSetting.value) : 0;

    // Reset count if last refresh was more than 10 mins ago
    if (now.getTime() - lastRefresh.getTime() > 10 * 60 * 1000) {
      refreshCount = 0;
    }

    if (refreshCount >= 3) {
      const remainingTime = Math.ceil((10 * 60 * 1000 - (now.getTime() - lastRefresh.getTime())) / 60000);
      return { success: false, error: `Çok sık güncelleme yapıldı. Lütfen ${remainingTime} dakika sonra tekrar deneyin.` };
    }

    // Parallel fetch with headers to bypass basic bot protection
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Cache-Control": "no-cache"
    };

    const [dovizRes, altinRes] = await Promise.all([
      fetch("https://api.genelpara.com/json/?list=doviz&sembol=USD,EUR", { headers }),
      fetch("https://api.genelpara.com/json/?list=altin&sembol=GA", { headers })
    ]);

    if (!dovizRes.ok || !altinRes.ok) {
        console.error("API Error Status:", dovizRes.status, altinRes.status);
        throw new Error("API sunucusu yanıt vermiyor.");
    }

    const dovizData = await dovizRes.json();
    const altinData = await altinRes.json();

    const usdRate = dovizData.USD?.satis || "1";
    const eurRate = dovizData.EUR?.satis || "1";
    const gaRate = altinData.GA?.satis || "1";

    // Update DB
    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: "exchange_rate_usd" },
        update: { value: usdRate },
        create: { key: "exchange_rate_usd", value: usdRate }
      }),
      prisma.setting.upsert({
        where: { key: "exchange_rate_eur" },
        update: { value: eurRate },
        create: { key: "exchange_rate_eur", value: eurRate }
      }),
      prisma.setting.upsert({
        where: { key: "exchange_rate_ga" },
        update: { value: gaRate },
        create: { key: "exchange_rate_ga", value: gaRate }
      }),
      prisma.setting.upsert({
        where: { key: "currency_last_refresh" },
        update: { value: now.toISOString() },
        create: { key: "currency_last_refresh", value: now.toISOString() }
      }),
      prisma.setting.upsert({
        where: { key: "currency_refresh_count" },
        update: { value: (refreshCount + 1).toString() },
        create: { key: "currency_refresh_count", value: (refreshCount + 1).toString() }
      })
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Currency sync error:", error);
    return { success: false, error: "Kurlar güncellenirken bir hata oluştu." };
  }
}

export async function getExchangeRates() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: [
          "exchange_rate_usd",
          "exchange_rate_eur",
          "exchange_rate_ga",
          "currency_last_refresh",
          "currency_refresh_count"
        ] }
      }
    });

    const now = new Date();
    const lastRefreshStr = settings.find(s => s.key === "currency_last_refresh")?.value;
    const lastRefresh = lastRefreshStr ? new Date(lastRefreshStr) : new Date(0);
    const refreshCount = parseInt(settings.find(s => s.key === "currency_refresh_count")?.value || "0");

    const isLocked = (now.getTime() - lastRefresh.getTime() < 10 * 60 * 1000) && refreshCount >= 3;

    return {
      usd: parseFloat(settings.find(s => s.key === "exchange_rate_usd")?.value || "1"),
      eur: parseFloat(settings.find(s => s.key === "exchange_rate_eur")?.value || "1"),
      ga: parseFloat(settings.find(s => s.key === "exchange_rate_ga")?.value || "1"),
      lastRefresh,
      refreshCount,
      isLocked,
      remainingMinutes: isLocked ? Math.ceil((10 * 60 * 1000 - (now.getTime() - lastRefresh.getTime())) / 60000) : 0
    };
  } catch (error) {
    return {
      usd: 1,
      eur: 1,
      ga: 1,
      lastRefresh: new Date(),
      refreshCount: 0,
      isLocked: false,
      remainingMinutes: 0
    };
  }
}

// Keeping this for backward compatibility if used elsewhere, but updating it to use the new ga field
export async function updateExchangeRates(rates: { usd: number; eur: number; ga?: number }) {
  try {
    const operations = [
      prisma.setting.upsert({
        where: { key: "exchange_rate_usd" },
        update: { value: rates.usd.toString() },
        create: { key: "exchange_rate_usd", value: rates.usd.toString() }
      }),
      prisma.setting.upsert({
        where: { key: "exchange_rate_eur" },
        update: { value: rates.eur.toString() },
        create: { key: "exchange_rate_eur", value: rates.eur.toString() }
      })
    ];

    if (rates.ga) {
      operations.push(
        prisma.setting.upsert({
          where: { key: "exchange_rate_ga" },
          update: { value: rates.ga.toString() },
          create: { key: "exchange_rate_ga", value: rates.ga.toString() }
        })
      );
    }

    await prisma.$transaction(operations);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Kur bilgileri güncellenemedi." };
  }
}
