"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function globalSearchAction(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const [products, customers, suppliers, serviceTickets] = await Promise.all([
      // Search Products
      prisma.product.findMany({
        where: {
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
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 5
      }),
      // Search Service Tickets
      prisma.serviceTicket.findMany({
        where: {
          OR: [
            { ticketNumber: { contains: query, mode: 'insensitive' } },
            { deviceModel: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 5
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
      href: `/musteriler?id=${c.id}`,
      breadcrumb: 'Müşteriler > Profil'
    }));

    suppliers.forEach((s: any) => results.push({
      id: s.id,
      title: s.name,
      subtitle: `${s.phone || 'Telefon Yok'} • Bakiye: ₺${Number(s.balance).toLocaleString("tr-TR")}`,
      type: 'Tedarikçi',
      href: `/tedarikciler?id=${s.id}`,
      breadcrumb: 'Tedarikçiler > Profil'
    }));

    serviceTickets.forEach((t: any) => results.push({
      id: t.id,
      title: t.ticketNumber,
      subtitle: `${t.deviceModel} • ${t.status}`,
      type: 'Servis',
      href: `/servis?id=${t.id}`,
      breadcrumb: 'Servis > Teknik Servis Takibi'
    }));

    return serializePrisma(results);
  } catch (error) {
    console.error("Global Search Error:", error);
    return [];
  }
}
