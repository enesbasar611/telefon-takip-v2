"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { getShopId } from "@/lib/auth";

export async function globalSearchAction(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const shopId = await getShopId();
    const [products, customers, suppliers, serviceTickets] = await Promise.all([
      // Search Products
      prisma.product.findMany({
        where: {
          shopId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 5
      }),
      // Search Customers
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
      // Search Suppliers
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
      // Search Service Tickets (with customer included)
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
      })
    ]);

    const results: any[] = [];

    products.forEach((p: any) => results.push({
      id: p.id,
      title: p.name,
      subtitle: `${p.stock} Adet • ₺${Number(p.sellPrice).toLocaleString("tr-TR")}`,
      type: 'Ürün',
      href: `/envanter?search=${encodeURIComponent(p.name)}`,
      breadcrumb: 'Envanter > Ürünler'
    }));

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
