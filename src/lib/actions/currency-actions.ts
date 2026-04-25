"use server";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getShopId } from "@/lib/auth";

// 1. syncAllRates fonksiyonu olduğu gibi kalabilir (içindeki getShopId dışarıdan shopId gelirse çalışmıyor zaten)
export async function syncAllRates(providedShopId?: string) {
  try {
    const shopId = providedShopId || await getShopId();
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return { success: false, error: "İşletme bulunamadı." };

    const response = await fetch("https://finans.truncgil.com/today.json", {
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error("API hatası");
    const data = await response.json();
    const parseTR = (val: string) => val ? val.replace(/\./g, '').replace(',', '.') : null;

    const usdRateStr = parseTR(data.USD?.Satış);
    const eurRateStr = parseTR(data.EUR?.Satış);
    const gaRateStr = parseTR(data["gram-altin"]?.Satış);

    if (!usdRateStr || isNaN(Number(usdRateStr)) || Number(usdRateStr) < 10) {
      throw new Error("Invalid rate payload from API");
    }

    const usdRate = usdRateStr;
    const eurRate = eurRateStr || usdRate; // fallback to usd
    const gaRate = gaRateStr || "3000";

    await prisma.$transaction([
      prisma.setting.upsert({ where: { shopId_key: { shopId, key: "exchange_rate_usd" } }, update: { value: usdRate }, create: { shopId, key: "exchange_rate_usd", value: usdRate } }),
      prisma.setting.upsert({ where: { shopId_key: { shopId, key: "exchange_rate_eur" } }, update: { value: eurRate }, create: { shopId, key: "exchange_rate_eur", value: eurRate } }),
      prisma.setting.upsert({ where: { shopId_key: { shopId, key: "exchange_rate_ga" } }, update: { value: gaRate }, create: { shopId, key: "exchange_rate_ga", value: gaRate } }),
      prisma.setting.upsert({ where: { shopId_key: { shopId, key: "currency_last_update" } }, update: { value: new Date().toISOString() }, create: { shopId, key: "currency_last_update", value: new Date().toISOString() } })
    ]);

    // BU SATIR HATA VERDİRİYOR OLABİLİR: Cache içinden çağrıldığında sorun çıkarır.
    // Şimdilik burada kalsın ama cache içinden çağırmayacağız.
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 2. KRİTİK DEĞİŞİKLİK BURADA: Veriyi çekmeyi ve sync etmeyi ayırdık.
export const getExchangeRates = async (shopId: string) => {
  // Önce veriyi cache'den alalım
  const getCachedRates = unstable_cache(
    async (sId: string) => {
      return prisma.setting.findMany({
        where: {
          shopId: sId,
          key: { in: ["exchange_rate_usd", "exchange_rate_eur", "exchange_rate_ga", "currency_last_update", "dealer_profit_tl", "customer_profit_tl"] }
        }
      });
    },
    [`exchange-rates-${shopId}`],
    { tags: [`rates-${shopId}`], revalidate: 3600 }
  );

  let settings = await getCachedRates(shopId);
  const lastUpdateStr = settings.find(s => s.key === "currency_last_update")?.value;
  const lastUpdate = lastUpdateStr ? new Date(lastUpdateStr) : new Date(0);
  const now = new Date();

  // Eğer veri eksikse veya 2 saat geçmişse "Dışarıda" sync yapalım (unstable_cache dışında!)
  if (settings.length < 3 || (now.getTime() - lastUpdate.getTime() > 2 * 60 * 60 * 1000)) {
    await syncAllRates(shopId).catch(() => { });
    // Sync sonrası güncel veriyi tekrar çek (cache'i bypass ederek)
    settings = await prisma.setting.findMany({
      where: { shopId, key: { in: ["exchange_rate_usd", "exchange_rate_eur", "exchange_rate_ga", "currency_last_update", "dealer_profit_tl", "customer_profit_tl"] } }
    });
  }

  return {
    usd: parseFloat(settings.find(s => s.key === "exchange_rate_usd")?.value || "34"),
    eur: parseFloat(settings.find(s => s.key === "exchange_rate_eur")?.value || "37"),
    ga: parseFloat(settings.find(s => s.key === "exchange_rate_ga")?.value || "3000"),
    dealerProfit: parseFloat(settings.find(s => s.key === "dealer_profit_tl")?.value || "200"),
    customerProfit: parseFloat(settings.find(s => s.key === "customer_profit_tl")?.value || "700"),
    lastUpdate
  };
};