"use server";

import prisma from "@/lib/prisma";
import { getShopId } from "@/lib/auth";
import { serializePrisma } from "@/lib/utils";
import { getComputedAccounts } from "@/lib/actions/finance-actions";
import { getExchangeRates } from "@/lib/actions/currency-actions";
import {
  convertTransactionAmount,
  isTransactionCurrency,
  type TransactionCurrency,
} from "@/lib/finance/transaction-currency";
import { addDays, endOfDay, startOfDay, startOfMonth } from "date-fns";

function toCurrency(value: unknown): TransactionCurrency {
  return isTransactionCurrency(value) ? value : "TRY";
}

/**
 * Widget 1: Kasa & Ödeme Kanalları Dağılımı
 * Aktif hesapların (Nakit, Banka, POS, Kredi Kartı, Döviz) güncel bakiyeleri
 * ve bugünkü ödeme kanalı (Nakit / Kart / Havale) giriş-çıkışları.
 */
export async function getDashboardCashChannels(shopIdIn?: string) {
  const shopId = shopIdIn || (await getShopId());
  if (!shopId) return null;

  const todayStart = startOfDay(new Date());

  const [computedAccounts, rates, todayTxs] = await Promise.all([
    getComputedAccounts(shopId, { includeInactive: false }),
    getExchangeRates(shopId),
    prisma.transaction.findMany({
      where: {
        shopId,
        createdAt: { gte: todayStart },
        paymentMethod: { not: "DEBT" },
      },
      select: {
        type: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        financeAccountId: true,
      },
    }),
  ]);

  const accountMap = new Map(computedAccounts.map((acc) => [acc.id, acc]));
  const perAccountToday = new Map<string, { inAmt: number; outAmt: number }>();

  const channelTotals = new Map<
    "CASH" | "CARD" | "TRANSFER",
    { incomeTry: number; expenseTry: number; count: number }
  >([
    ["CASH", { incomeTry: 0, expenseTry: 0, count: 0 }],
    ["CARD", { incomeTry: 0, expenseTry: 0, count: 0 }],
    ["TRANSFER", { incomeTry: 0, expenseTry: 0, count: 0 }],
  ]);

  for (const tx of todayTxs) {
    const txCur = toCurrency(tx.currency);
    const amount = Number(tx.amount || 0);
    const converted = convertTransactionAmount(amount, txCur, rates);

    // Ödeme yöntemi kırılımı (TRY cinsinden)
    const methodKey: "CASH" | "CARD" | "TRANSFER" =
      tx.paymentMethod === "CARD"
        ? "CARD"
        : tx.paymentMethod === "TRANSFER"
          ? "TRANSFER"
          : "CASH";
    const channelEntry = channelTotals.get(methodKey)!;
    if (tx.type === "INCOME") {
      channelEntry.incomeTry += converted.TRY;
    } else {
      channelEntry.expenseTry += converted.TRY;
    }
    channelEntry.count += 1;

    // Hesap bazlı günlük hareket (hesap para birimi cinsinden)
    if (tx.financeAccountId) {
      const acc = accountMap.get(tx.financeAccountId);
      if (acc) {
        const accCur = toCurrency(acc.currency);
        const amountInAccCur =
          txCur === accCur
            ? amount
            : accCur === "USD"
              ? converted.USD
              : accCur === "EUR"
                ? converted.EUR
                : converted.TRY;

        const current = perAccountToday.get(acc.id) || { inAmt: 0, outAmt: 0 };
        if (tx.type === "INCOME") current.inAmt += amountInAccCur;
        else current.outAmt += amountInAccCur;
        perAccountToday.set(acc.id, current);
      }
    }
  }

  let cashTry = 0;
  let bankPosTry = 0;
  let creditCardDebtTry = 0;
  let fxAccountsCount = 0;

  const accounts = computedAccounts.map((acc) => {
    const accCur = toCurrency(acc.currency);
    const balance = Number(acc.balance || 0);
    const tryEquivalent = convertTransactionAmount(balance, accCur, rates).TRY;

    if (accCur !== "TRY") fxAccountsCount += 1;
    if (acc.type === "CASH") cashTry += tryEquivalent;
    else if (acc.type === "BANK" || acc.type === "POS") bankPosTry += tryEquivalent;
    else if (acc.type === "CREDIT_CARD") creditCardDebtTry += tryEquivalent;

    const todayFlow = perAccountToday.get(acc.id) || { inAmt: 0, outAmt: 0 };

    return {
      id: acc.id,
      name: acc.name,
      type: acc.type,
      currency: accCur,
      balance,
      tryEquivalent: Math.round(tryEquivalent * 100) / 100,
      availableBalance: Number(acc.availableBalance ?? balance),
      limit: acc.limit ? Number(acc.limit) : null,
      isDefault: acc.isDefault,
      todayIn: Math.round(todayFlow.inAmt * 100) / 100,
      todayOut: Math.round(todayFlow.outAmt * 100) / 100,
    };
  });

  const paymentMethodsToday = [
    { method: "CASH", label: "Nakit", ...channelTotals.get("CASH")! },
    { method: "CARD", label: "Kart / POS", ...channelTotals.get("CARD")! },
    { method: "TRANSFER", label: "Havale / EFT", ...channelTotals.get("TRANSFER")! },
  ].map((item) => ({
    ...item,
    incomeTry: Math.round(item.incomeTry * 100) / 100,
    expenseTry: Math.round(item.expenseTry * 100) / 100,
  }));

  return serializePrisma({
    accounts,
    paymentMethodsToday,
    totals: {
      cashTry: Math.round(cashTry * 100) / 100,
      bankPosTry: Math.round(bankPosTry * 100) / 100,
      netLiquidTry: Math.round((cashTry + bankPosTry) * 100) / 100,
      creditCardDebtTry: Math.round(creditCardDebtTry * 100) / 100,
      fxAccountsCount,
    },
    rates,
  });
}

/**
 * Widget 2: Tedarikçi Borçları & Ödemeler
 * Tedarikçi bazlı TRY/USD borç bakiyeleri, açık alım faturaları ve son hareketler.
 */
export async function getDashboardSupplierPayables(shopIdIn?: string) {
  const shopId = shopIdIn || (await getShopId());
  if (!shopId) return null;

  const [suppliersRaw, unpaidOrdersGrouped, recentTransactions, rates] = await Promise.all([
    prisma.supplier.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        phone: true,
        category: true,
        balance: true,
        balanceUsd: true,
        trustScore: true,
        updatedAt: true,
      },
    }),
    prisma.purchaseOrder.groupBy({
      by: ["supplierId"],
      where: {
        shopId,
        paymentStatus: { not: "PAID" },
        status: { not: "CANCELLED" },
      },
      _count: { id: true },
      _sum: { remainingAmount: true },
    }),
    prisma.supplierTransaction.findMany({
      where: { shopId },
      orderBy: { date: "desc" },
      take: 15,
      include: {
        supplier: { select: { id: true, name: true } },
      },
    }),
    getExchangeRates(shopId),
  ]);

  const unpaidOrderBySupplier = new Map(
    unpaidOrdersGrouped.map((row) => [
      row.supplierId,
      {
        count: row._count.id,
        remainingTry: Number(row._sum.remainingAmount || 0),
      },
    ])
  );

  let totalDebtTry = 0;
  let totalDebtUsd = 0;
  let totalCreditTry = 0;
  let totalCreditUsd = 0;
  let indebtedCount = 0;
  let unpaidOrdersCount = 0;

  const suppliers = suppliersRaw
    .map((s) => {
      const rawTry = Number(s.balance || 0);
      const rawUsd = Number(s.balanceUsd || 0);
      const debtTry = rawTry > 0 ? rawTry : 0;
      const debtUsd = rawUsd > 0 ? rawUsd : 0;
      const creditTry = rawTry < 0 ? Math.abs(rawTry) : 0;
      const creditUsd = rawUsd < 0 ? Math.abs(rawUsd) : 0;

      totalDebtTry += debtTry;
      totalDebtUsd += debtUsd;
      totalCreditTry += creditTry;
      totalCreditUsd += creditUsd;

      if (debtTry > 0.01 || debtUsd > 0.01) indebtedCount += 1;

      const orderInfo = unpaidOrderBySupplier.get(s.id) || { count: 0, remainingTry: 0 };
      unpaidOrdersCount += orderInfo.count;

      const combinedDebtTry =
        debtTry + convertTransactionAmount(debtUsd, "USD", rates).TRY;

      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        category: s.category,
        balanceTry: rawTry,
        balanceUsd: rawUsd,
        combinedDebtTry: Math.round(combinedDebtTry * 100) / 100,
        unpaidOrdersCount: orderInfo.count,
        trustScore: s.trustScore,
      };
    })
    .sort((a, b) => b.combinedDebtTry - a.combinedDebtTry);

  const totalCombinedTry =
    totalDebtTry + convertTransactionAmount(totalDebtUsd, "USD", rates).TRY;

  return serializePrisma({
    suppliers,
    recentTransactions,
    totals: {
      totalDebtTry: Math.round(totalDebtTry * 100) / 100,
      totalDebtUsd: Math.round(totalDebtUsd * 100) / 100,
      totalCreditTry: Math.round(totalCreditTry * 100) / 100,
      totalCreditUsd: Math.round(totalCreditUsd * 100) / 100,
      totalCombinedTry: Math.round(totalCombinedTry * 100) / 100,
      indebtedCount,
      unpaidOrdersCount,
      supplierCount: suppliersRaw.length,
    },
    rates,
  });
}

/**
 * Widget 3: Bugünün Teslimat & Vade Ajandası
 * Gecikmiş ve bugünkü servis teslimatları, hazır bekleyen cihazlar,
 * vadesi gelen/geçen veresiye borçları ve açık ajanda görevleri.
 */
export async function getDashboardDailyAgenda(shopIdIn?: string) {
  const shopId = shopIdIn || (await getShopId());
  if (!shopId) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));
  const threeDaysEnd = endOfDay(addDays(now, 3));

  const [services, dueDebts, hiddenAgendaRows, agendaEvents, rates] = await Promise.all([
    prisma.serviceTicket.findMany({
      where: {
        shopId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
        OR: [
          { status: "READY" },
          { estimatedDeliveryDate: { lte: tomorrowEnd } },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        technician: { select: { name: true } },
      },
      orderBy: [{ estimatedDeliveryDate: "asc" }, { priority: "desc" }],
      take: 30,
    }),
    prisma.debt.findMany({
      where: {
        shopId,
        isPaid: false,
        remainingAmount: { gt: 0 },
        dueDate: { not: null, lte: threeDaysEnd },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 25,
    }),
    prisma.hiddenAgendaItem.findMany({
      where: { shopId },
      select: { sourceId: true },
    }),
    prisma.agendaEvent.findMany({
      where: {
        shopId,
        isCompleted: false,
        date: { lte: tomorrowEnd },
      },
      orderBy: { date: "asc" },
      take: 20,
    }),
    getExchangeRates(shopId),
  ]);

  const hiddenIds = new Set(hiddenAgendaRows.map((h) => h.sourceId));

  type AgendaUrgency = "OVERDUE" | "TODAY" | "READY" | "UPCOMING";
  type AgendaKind = "DELIVERY" | "DEBT" | "AGENDA";

  interface AgendaItem {
    id: string;
    kind: AgendaKind;
    urgency: AgendaUrgency;
    title: string;
    subtitle: string;
    date: Date;
    amount?: number;
    currency?: string;
    href: string;
    statusLabel: string;
    customerPhone?: string | null;
  }

  const items: AgendaItem[] = [];

  for (const s of services) {
    const due = s.estimatedDeliveryDate || s.createdAt;
    let urgency: AgendaUrgency = "UPCOMING";
    if (s.estimatedDeliveryDate && s.estimatedDeliveryDate < todayStart && s.status !== "READY") {
      urgency = "OVERDUE";
    } else if (s.status === "READY") {
      urgency = "READY";
    } else if (s.estimatedDeliveryDate && s.estimatedDeliveryDate <= todayEnd) {
      urgency = "TODAY";
    }

    items.push({
      id: `srv-${s.id}`,
      kind: "DELIVERY",
      urgency,
      title: `${s.deviceBrand} ${s.deviceModel}`,
      subtitle: `${s.customer?.name || "Müşteri"} · #${s.ticketNumber}`,
      date: due,
      amount: Number(s.estimatedCost || 0) > 0 ? Number(s.estimatedCost) : undefined,
      currency: "TRY",
      href: `/servis/${s.id}`,
      statusLabel:
        s.status === "READY"
          ? "Teslime Hazır"
          : urgency === "OVERDUE"
            ? "Teslim Gecikti"
            : urgency === "TODAY"
              ? "Bugün Teslim"
              : "Yarın Teslim",
      customerPhone: s.customer?.phone,
    });
  }

  for (const d of dueDebts) {
    if (!d.dueDate) continue;
    const urgency: AgendaUrgency =
      d.dueDate < todayStart ? "OVERDUE" : d.dueDate <= todayEnd ? "TODAY" : "UPCOMING";

    items.push({
      id: `debt-${d.id}`,
      kind: "DEBT",
      urgency,
      title: d.customer?.name || "Veresiye Tahsilatı",
      subtitle: d.notes || d.description || "Vadesi gelen tahsilat",
      date: d.dueDate,
      amount: Number(d.remainingAmount || 0),
      currency: d.currency || "TRY",
      href: "/veresiye",
      statusLabel:
        urgency === "OVERDUE"
          ? "Vadesi Geçti"
          : urgency === "TODAY"
            ? "Bugün Vade"
            : "Yaklaşan Vade",
      customerPhone: d.customer?.phone,
    });
  }

  for (const ev of agendaEvents) {
    if (hiddenIds.has(ev.id)) continue;
    const urgency: AgendaUrgency =
      ev.date < todayStart ? "OVERDUE" : ev.date <= todayEnd ? "TODAY" : "UPCOMING";

    items.push({
      id: `ag-${ev.id}`,
      kind: "AGENDA",
      urgency,
      title: ev.title,
      subtitle: ev.notes || ev.category || "Ajanda Görevi",
      date: ev.date,
      amount: ev.amount ? Number(ev.amount) : undefined,
      currency: "TRY",
      href: "/ajanda",
      statusLabel:
        urgency === "OVERDUE"
          ? "Gecikmiş Görev"
          : urgency === "TODAY"
            ? "Bugün"
            : "Planlı",
    });
  }

  const urgencyWeight: Record<AgendaUrgency, number> = {
    OVERDUE: 0,
    TODAY: 1,
    READY: 2,
    UPCOMING: 3,
  };

  items.sort((a, b) => {
    const wDiff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    if (wDiff !== 0) return wDiff;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const dueDebtTotalTry = dueDebts.reduce((sum, d) => {
    const cur = toCurrency(d.currency);
    return sum + convertTransactionAmount(Number(d.remainingAmount || 0), cur, rates).TRY;
  }, 0);

  return serializePrisma({
    items,
    summary: {
      overdueCount: items.filter((i) => i.urgency === "OVERDUE").length,
      todayCount: items.filter((i) => i.urgency === "TODAY").length,
      readyCount: items.filter((i) => i.urgency === "READY").length,
      upcomingCount: items.filter((i) => i.urgency === "UPCOMING").length,
      deliveryCount: items.filter((i) => i.kind === "DELIVERY").length,
      debtCount: items.filter((i) => i.kind === "DEBT").length,
      agendaCount: items.filter((i) => i.kind === "AGENDA").length,
      dueDebtTotalTry: Math.round(dueDebtTotalTry * 100) / 100,
    },
  });
}

/**
 * Widget 4: İade, Değişim & Garanti Özeti
 * Bekleyen iade talepleri, tedarikçideki parçalar, aylık iade/kayıp hacmi
 * ve garantisi yaklaşan / aktif cihaz servisleri.
 */
export async function getDashboardReturnsWarranty(shopIdIn?: string) {
  const shopId = shopIdIn || (await getShopId());
  if (!shopId) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const warrantySoonEnd = endOfDay(addDays(now, 14));

  const [recentReturns, monthReturns, activeWarrantiesCount, expiringWarranties, rates] =
    await Promise.all([
      prisma.returnTicket.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          product: { select: { name: true } },
          customer: { select: { name: true, phone: true } },
          supplier: { select: { name: true } },
          serviceTicket: {
            select: {
              id: true,
              ticketNumber: true,
              deviceBrand: true,
              deviceModel: true,
            },
          },
        },
      }),
      prisma.returnTicket.findMany({
        where: { shopId, createdAt: { gte: monthStart } },
        select: {
          returnStatus: true,
          lossAmount: true,
          refundAmount: true,
          refundCurrency: true,
          quantity: true,
        },
      }),
      prisma.serviceTicket.count({
        where: { shopId, status: "DELIVERED", warrantyExpiry: { gt: now } },
      }),
      prisma.serviceTicket.findMany({
        where: {
          shopId,
          status: "DELIVERED",
          warrantyExpiry: { gt: now, lte: warrantySoonEnd },
        },
        orderBy: { warrantyExpiry: "asc" },
        take: 15,
        select: {
          id: true,
          ticketNumber: true,
          deviceBrand: true,
          deviceModel: true,
          warrantyExpiry: true,
          deliveredAt: true,
          customer: { select: { name: true, phone: true } },
        },
      }),
      getExchangeRates(shopId),
    ]);

  let monthRefundTry = 0;
  let monthLossTry = 0;
  for (const r of monthReturns) {
    if (r.returnStatus === "REJECTED") continue;
    monthLossTry += Number(r.lossAmount || 0);
    if (r.refundAmount && Number(r.refundAmount) > 0) {
      const cur = toCurrency(r.refundCurrency);
      monthRefundTry += convertTransactionAmount(Number(r.refundAmount), cur, rates).TRY;
    }
  }

  const pendingCount = recentReturns.filter(
    (r) => r.returnStatus === "PENDING" || r.returnStatus === "APPROVED"
  ).length;
  const supplierPendingCount = recentReturns.filter(
    (r) => r.returnStatus === "SENT_TO_SUPPLIER"
  ).length;

  return serializePrisma({
    recentReturns,
    expiringWarranties,
    summary: {
      pendingCount,
      supplierPendingCount,
      monthReturnsCount: monthReturns.length,
      monthRefundTry: Math.round(monthRefundTry * 100) / 100,
      monthLossTry: Math.round(monthLossTry * 100) / 100,
      activeWarrantiesCount,
      expiringSoonCount: expiringWarranties.length,
    },
  });
}

