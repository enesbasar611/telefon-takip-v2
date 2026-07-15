export type ServiceAnalyticsPart = {
  quantity: number;
  unitPrice: unknown;
  costPrice: unknown;
};

export type ServiceAnalyticsTicket = {
  estimatedCost: unknown;
  actualCost: unknown;
  overhead?: unknown;
  usedParts: ServiceAnalyticsPart[];
};

export type ServiceProfitAnalytics = {
  serviceCount: number;
  partsQuantity: number;
  laborRevenue: number;
  partsRevenue: number;
  grossRevenue: number;
  partsCost: number;
  overhead: number;
  netProfit: number;
};

export type ServiceAnalyticsDisplayCurrency = "TRY" | "USD" | "EUR";

export type ServiceAnalyticsRates = {
  usd?: number | null;
  eur?: number | null;
};

function toMoney(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateServiceProfitAnalytics(
  tickets: ServiceAnalyticsTicket[]
): ServiceProfitAnalytics {
  const totals = tickets.reduce(
    (acc, ticket) => {
      const laborRevenue = toMoney(ticket.actualCost) || toMoney(ticket.estimatedCost);
      const overhead = toMoney(ticket.overhead);

      const partTotals = ticket.usedParts.reduce(
        (partAcc, part) => {
          const quantity = Number(part.quantity || 0);
          const unitPrice = toMoney(part.unitPrice);
          const costPrice = toMoney(part.costPrice);

          partAcc.partsQuantity += quantity;
          partAcc.partsRevenue += unitPrice * quantity;
          partAcc.partsCost += costPrice * quantity;
          return partAcc;
        },
        { partsQuantity: 0, partsRevenue: 0, partsCost: 0 }
      );

      acc.laborRevenue += laborRevenue;
      acc.partsQuantity += partTotals.partsQuantity;
      acc.partsRevenue += partTotals.partsRevenue;
      acc.partsCost += partTotals.partsCost;
      acc.overhead += overhead;
      return acc;
    },
    {
      laborRevenue: 0,
      partsQuantity: 0,
      partsRevenue: 0,
      partsCost: 0,
      overhead: 0,
    }
  );

  const grossRevenue = totals.laborRevenue + totals.partsRevenue;
  const netProfit = grossRevenue - totals.partsCost - totals.overhead;

  return {
    serviceCount: tickets.length,
    partsQuantity: totals.partsQuantity,
    laborRevenue: roundMoney(totals.laborRevenue),
    partsRevenue: roundMoney(totals.partsRevenue),
    grossRevenue: roundMoney(grossRevenue),
    partsCost: roundMoney(totals.partsCost),
    overhead: roundMoney(totals.overhead),
    netProfit: roundMoney(netProfit),
  };
}

function convertTryAmount(
  amount: number,
  currency: ServiceAnalyticsDisplayCurrency,
  rates: ServiceAnalyticsRates
) {
  const usdRate = Number(rates.usd) > 0 ? Number(rates.usd) : 1;
  const eurRate = Number(rates.eur) > 0 ? Number(rates.eur) : 1;

  if (currency === "USD") return amount / usdRate;
  if (currency === "EUR") return amount / eurRate;
  return amount;
}

export function convertServiceProfitAnalyticsCurrency(
  analytics: ServiceProfitAnalytics,
  currency: ServiceAnalyticsDisplayCurrency,
  rates: ServiceAnalyticsRates
): ServiceProfitAnalytics {
  return {
    ...analytics,
    laborRevenue: roundMoney(convertTryAmount(analytics.laborRevenue, currency, rates)),
    partsRevenue: roundMoney(convertTryAmount(analytics.partsRevenue, currency, rates)),
    grossRevenue: roundMoney(convertTryAmount(analytics.grossRevenue, currency, rates)),
    partsCost: roundMoney(convertTryAmount(analytics.partsCost, currency, rates)),
    overhead: roundMoney(convertTryAmount(analytics.overhead, currency, rates)),
    netProfit: roundMoney(convertTryAmount(analytics.netProfit, currency, rates)),
  };
}
