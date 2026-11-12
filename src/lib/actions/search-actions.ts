"use server";

import prisma from "@/lib/prisma";
import { getProductCompatibility, serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";
import { buildProductSearchOrConditions } from "@/lib/inventory/product-search";

export async function globalSearchAction(query: string) {
  if (!query || query.trim().length < 2) return [];

  try {
    const shopId = await getShopId();
    if (!shopId) return [];

    const productOrConditions = await buildProductSearchOrConditions(shopId, query, { minLength: 2 });

    const [products, customers, suppliers, serviceTickets, settings] = await Promise.all([
      // Search Products
      prisma.product.findMany({
        where: {
          shopId,
          isDeleted: false,
          OR:
            productOrConditions.length > 0
              ? productOrConditions
              : [
                  { name: { contains: query, mode: "insensitive" } },
                  { sku: { contains: query, mode: "insensitive" } },
                ],
        },
        select: {
          id: true,
          name: true,
          stock: true,
          sellPrice: true,
          sellPriceUsd: true,
          attributes: true,
        },
        take: 5
      }),
      // ... (other queries)
      prisma.customer.findMany({
        where: {
          shopId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 5
      }),
      prisma.supplier.findMany({
        where: {
          shopId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 5
      }),
      prisma.serviceTicket.findMany({
        where: {
          shopId,
          OR: [
            { ticketNumber: { contains: query, mode: 'insensitive' } },
            { deviceModel: { contains: query, mode: 'insensitive' } },
            { deviceBrand: { contains: query, mode: 'insensitive' } },
            { imei: { contains: query, mode: 'insensitive' } },
            { customer: { name: { contains: query, mode: 'insensitive' } } },
            { customer: { phone: { contains: query, mode: 'insensitive' } } },
          ]
        },
        include: { customer: true },
        take: 8
      }),
      // Fetch settings for currency
      prisma.setting.findMany({
        where: { shopId, key: { in: ['exchange_rate_usd', 'defaultCurrency'] } }
      })
    ]);

    const usdRateSetting = settings.find(s => s.key === 'exchange_rate_usd');
    const defaultCurrencySetting = settings.find(s => s.key === 'defaultCurrency');

    const usdRate = parseFloat(usdRateSetting?.value || '34');
    const isUsdDefault = (defaultCurrencySetting?.value || 'TRY') === 'USD';

    const results: any[] = [];

    products.forEach((p: any) => {
      const priceTl = Number(p.sellPrice);
      const priceUsd = p.sellPriceUsd && Number(p.sellPriceUsd) > 0
        ? Number(p.sellPriceUsd)
        : priceTl / usdRate;

      const tlStr = `₺${priceTl.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      const usdStr = `$${priceUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

      // Varsayılan para birimine göre sıralama
      const priceSubtitle = isUsdDefault
        ? `${usdStr} (${tlStr})`
        : `${tlStr} (${usdStr})`;

      const compatibility = getProductCompatibility(p);
      results.push({
        id: p.id,
        title: p.name,
        subtitle: compatibility
          ? `${p.stock} Adet • ${priceSubtitle} • Uyumlu: ${compatibility}`
          : `${p.stock} Adet • ${priceSubtitle}`,
        type: 'Ürün',
        href: `/stok?q=${encodeURIComponent(p.name)}`,
        breadcrumb: 'Envanter > Ürünler'
      });
    });

    customers.forEach((c: any) => results.push({
      id: c.id,
      title: c.name,
      subtitle: `${c.phone || 'Telefon Yok'} • ${c.email || 'E-posta Yok'}`,
      type: 'Müşteri',
      href: `/musteriler/${c.id}`,
      breadcrumb: 'Müşteriler > Müşteri Profili'
    }));

    suppliers.forEach((s: any) => results.push({
      id: s.id,
      title: s.name,
      subtitle: `${s.phone || 'Telefon Yok'} • Bakiye: ₺${Number(s.balance).toLocaleString("tr-TR")}`,
      type: 'Tedarikçi',
      href: `/tedarikciler?id=${s.id}`,
      breadcrumb: 'Tedarikçiler > Profil'
    }));

    const statusLabels: Record<string, string> = {
      PENDING: 'Beklemede', APPROVED: 'Onaylandı', REPAIRING: 'Tamirde',
      WAITING_PART: 'Parça Bekliyor', READY: 'Hazır', DELIVERED: 'Teslim Edildi', CANCELLED: 'İptal'
    };

    serviceTickets.forEach((t: any) => results.push({
      id: t.id,
      title: t.ticketNumber,
      subtitle: `${t.customer?.name || 'Bilinmiyor'} • ${t.deviceBrand || ''} ${t.deviceModel} • ${statusLabels[t.status] || t.status}`,
      type: 'Servis',
      href: `/servis/${t.id}`,
      breadcrumb: `Servis > ${t.customer?.name || 'Teknik Servis'}`,
      customerHref: `/musteriler/${t.customerId}`,
    }));

    return serializePrisma(results);
  } catch (error) {
    console.error("Global Search Error:", error);
    return [];
  }
}
