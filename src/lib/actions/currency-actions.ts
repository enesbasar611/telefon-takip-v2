"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

export async function syncAllRates() {
  try {
    const shopId = await getShopId();
    // Rate limiting check
    const now = new Date();
    const lastRefreshSetting = await prisma.setting.findUnique({ where: { shopId_key: { shopId, key: "currency_last_refresh" } } });
    const refreshCountSetting = await prisma.setting.findUnique({ where: { shopId_key: { shopId, key: "currency_refresh_count" } } });

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

    // Fetch from a more stable TR financial API
    const response = await fetch("https://finans.truncgil.com/today.json", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error("Currency API Error Status:", response.status);
      throw new Error("Kur servisi şu an kullanılamıyor.");
    }

    const data = await response.json();

    // Helper to parse TR format (e.g. "44,3705" or "6.315,82")
    const parseTR = (val: string) => val ? val.replace(/\./g, '').replace(',', '.') : "1";

    const usdRate = parseTR(data.USD?.Satış);
    const eurRate = parseTR(data.EUR?.Satış);
    const gaRate = parseTR(data["gram-altin"]?.Satış);

    // Update DB
    await prisma.$transaction([
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "exchange_rate_usd" } },
        update: { value: usdRate },
        create: { shopId, key: "exchange_rate_usd", value: usdRate }
      }),
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "exchange_rate_eur" } },
        update: { value: eurRate },
        create: { shopId, key: "exchange_rate_eur", value: eurRate }
      }),
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "exchange_rate_ga" } },
        update: { value: gaRate },
        create: { shopId, key: "exchange_rate_ga", value: gaRate }
      }),
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "currency_last_refresh" } },
        update: { value: now.toISOString() },
        create: { shopId, key: "currency_last_refresh", value: now.toISOString() }
      }),
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "currency_refresh_count" } },
        update: { value: (refreshCount + 1).toString() },
        create: { shopId, key: "currency_refresh_count", value: (refreshCount + 1).toString() }
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
    const shopId = await getShopId();
    let settings = await prisma.setting.findMany({
      where: {
        shopId,
        key: {
          in: [
            "exchange_rate_usd",
            "exchange_rate_eur",
            "exchange_rate_ga",
            "currency_last_refresh",
            "currency_refresh_count"
          ]
        }
      }
    });

    const now = new Date();
    const lastRefreshStr = settings.find(s => s.key === "currency_last_refresh")?.value;
    const lastRefresh = lastRefreshStr ? new Date(lastRefreshStr) : new Date(0);
    const refreshCount = parseInt(settings.find(s => s.key === "currency_refresh_count")?.value || "0");

    // Auto-sync if rates are completely missing or older than 12 hours
    if (settings.length === 0 || (now.getTime() - lastRefresh.getTime() > 12 * 60 * 60 * 1000)) {
      // Don't block the UI if API is down, just ignore failures
      await syncAllRates().catch(() => { });
      // Re-fetch the updated settings silently
      settings = await prisma.setting.findMany({
        where: { shopId, key: { in: ["exchange_rate_usd", "exchange_rate_eur", "exchange_rate_ga", "currency_last_refresh", "currency_refresh_count"] } }
      });
    }

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
    const shopId = await getShopId();
    const operations = [
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "exchange_rate_usd" } },
        update: { value: rates.usd.toString() },
        create: { shopId, key: "exchange_rate_usd", value: rates.usd.toString() }
      }),
      prisma.setting.upsert({
        where: { shopId_key: { shopId, key: "exchange_rate_eur" } },
        update: { value: rates.eur.toString() },
        create: { shopId, key: "exchange_rate_eur", value: rates.eur.toString() }
      })
    ];

    if (rates.ga) {
      operations.push(
        prisma.setting.upsert({
          where: { shopId_key: { shopId, key: "exchange_rate_ga" } },
          update: { value: rates.ga.toString() },
          create: { shopId, key: "exchange_rate_ga", value: rates.ga.toString() }
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
