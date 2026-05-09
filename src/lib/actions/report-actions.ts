"use server";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { getShopId } from "@/lib/auth";

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return [];
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const sales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end }
      }
    });

    const days = eachDayOfInterval({ start, end });
    const trend = days.map(day => {
      const daySales = sales.filter(s =>
        format(new Date(s.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      return {
        date: format(day, 'dd MMM', { locale: tr }),
        total: daySales.reduce((sum, s) => sum + Number(s.finalAmount), 0)
      };
    });

    return serializePrisma(trend);
  } catch (error) {
    return [];
  }
}

export async function getServiceMetrics() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return [];
    const statuses = await prisma.serviceTicket.groupBy({
      by: ['status'],
      where: { shopId },
      _count: true
    });

    const metrics = statuses.map(s => ({
      name: s.status,
      value: s._count
    }));

    return serializePrisma(metrics);
  } catch (error) {
    return [];
  }
}

export async function getDashboardStats() {
  try {
    const shopId = await getShopId(false);
    if (!shopId) return { activeServices: 0, dailySales: 0, totalProducts: 0, lowStock: 0, totalCustomers: 0, completedServicesThisMonth: 0, thisMonthSales: 0, prevMonthSales: 0 };
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const monthStart = startOfMonth(new Date());
    const prevMonthStart = startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const prevMonthEnd = endOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)));

    const [activeServices, dailySales, products, customers, completedServicesThisMonth, thisMonthSales, prevMonthSales] = await Promise.all([
      prisma.serviceTicket.count({ where: { shopId, status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { finalAmount: true }
      }),
      prisma.product.findMany({ where: { shopId } }),
      prisma.customer.count({ where: { shopId } }),
      prisma.serviceTicket.count({ where: { shopId, status: 'DELIVERED', updatedAt: { gte: monthStart } } }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: monthStart, lte: endOfDay(new Date()) } },
        _sum: { finalAmount: true }
      }),
      prisma.sale.aggregate({
        where: { shopId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { finalAmount: true }
      })
    ]);

    const criticalStockCount = products.filter(p => p.stock <= p.criticalStock).length;

    const currentSales = Number(thisMonthSales._sum.finalAmount || 0);
    const prevSales = Number(prevMonthSales._sum.finalAmount || 0);
    let revenueGrowth = 0;
    if (prevSales > 0) {
      revenueGrowth = ((currentSales - prevSales) / prevSales) * 100;
    } else if (currentSales > 0) {
      revenueGrowth = 100;
    }

    return serializePrisma({
      activeServices,
      dailyRevenue: Number(dailySales._sum.finalAmount || 0),
      criticalStockCount,
      totalCustomers: customers,
      completedServicesThisMonth,
      revenueGrowth: Math.round(revenueGrowth),
      currentMonthRevenue: currentSales
    });
  } catch (error) {
    return serializePrisma({ activeServices: 0, dailyRevenue: 0, criticalStockCount: 0, totalCustomers: 0, completedServicesThisMonth: 0, revenueGrowth: 0, currentMonthRevenue: 0 });
  }
}

export async function getTopProductsReport(limit = 6) {
  try {
    const shopId = await getShopId();
    const products = await prisma.product.findMany({
      where: { shopId },
      orderBy: { saleItems: { _count: 'desc' } },
      take: limit,
      include: {
        _count: { select: { saleItems: true } },
        category: true
      }
    });

    const data = products.map(p => ({
      ...p,
      sales: p._count.saleItems,
      price: p.sellPrice,
      categoryName: p.category?.name || "Genel"
    }));
    return serializePrisma(data);
  } catch (error) {
    return [];
  }
}

export async function getDeviceBrandDistribution() {
  try {
    const shopId = await getShopId();
    const tickets = await prisma.serviceTicket.groupBy({
      by: ['deviceBrand'],
      where: { shopId },
      _count: true,
      orderBy: { _count: { deviceBrand: 'desc' } }
    });

    const data = tickets.map(t => ({
      name: t.deviceBrand || "Diğer",
      value: t._count
    }));

    return serializePrisma(data);
  } catch (error) {
    return [];
  }
}

export async function getCashflowReport() {
  try {
    const shopId = await getShopId();
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const transactions = await prisma.transaction.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end }
      }
    });

    const days = eachDayOfInterval({ start, end });
    const trend = days.map(day => {
      const dayTxs = transactions.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
      return {
        date: format(day, 'dd MMM', { locale: tr }),
        income: dayTxs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0),
        expense: dayTxs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });

    return serializePrisma(trend);
  } catch (error) {
    return [];
  }
}

export async function getDetailedExportData() {
  try {
    const shopId = await getShopId();
    const [sales, tickets, inventory] = await Promise.all([
      prisma.sale.findMany({
        where: { shopId },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: 1000
      }),
      prisma.serviceTicket.findMany({
        where: { shopId },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: 1000
      }),
      prisma.product.findMany({
        where: { shopId },
        include: { category: true },
        orderBy: { name: 'asc' }
      })
    ]);

    return serializePrisma({
      sales: sales.map(s => ({
        Tarih: format(new Date(s.createdAt), 'dd.MM.yyyy HH:mm'),
        Müşteri: s.customer?.name || 'Hızlı Satış',
        Açıklama: s.paymentMethod || '-',
        Tutar: Number(s.finalAmount)
      })),
      tickets: tickets.map(t => ({
        İş_Emri_No: t.ticketNumber,
        Tarih: format(new Date(t.createdAt), 'dd.MM.yyyy'),
        Müşteri: t.customer?.name || 'Bilinmiyor',
        Cihaz: `${t.deviceBrand} ${t.deviceModel}`,
        Durum: {
          PENDING: "Beklemede", APPROVED: "Onaylandı", REPAIRING: "Tamirde",
          WAITING_PART: "Parça Bekliyor", READY: "Hazır", DELIVERED: "Teslim Edildi", CANCELLED: "İptal"
        }[t.status] || t.status,
        Maliyet: Number(t.estimatedCost || 0)
      })),
      inventory: inventory.map(i => ({
        Barkod: i.barcode || '-',
        Ürün_Adı: i.name,
        Kategori: i.category?.name || 'Genel',
        Stok_Adedi: i.stock,
        Kritik_Stok: i.criticalStock,
        Satış_Fiyatı: Number(i.sellPrice)
      }))
    });
  } catch (error) {
    return null;
  }
}
