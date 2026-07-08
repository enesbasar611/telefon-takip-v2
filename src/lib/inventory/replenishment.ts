export type ReplenishmentCurrency = "TRY" | "USD";
export type ReplenishmentPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface SupplierCandidate {
  id: string;
  name: string;
  trustScore: number | null;
  category: string | null;
}

export interface ReplenishmentProductInput {
  productId: string;
  productName: string;
  currentStock: number;
  criticalStock: number;
  salesLast30: number;
  salesLast60: number;
  salesLast90: number;
  pendingServiceQty: number;
  pendingShortageQty: number;
  categoryName: string;
  categoryId: string | null;
  buyPrice: number;
  buyPriceUsd: number | null;
  priceCurrency: string | null;
  directSupplierId: string | null;
}

export interface ReplenishmentRecommendation extends ReplenishmentProductInput {
  dailyVelocity: number;
  daysUntilStockout: number | null;
  stockDeficit: number;
  targetStock: number;
  suggestedOrderQty: number;
  priorityScore: number;
  priorityLevel: ReplenishmentPriority;
  costCurrency: ReplenishmentCurrency;
  unitCostSource: number;
  estimatedCostSource: number;
  estimatedCostTry: number | null;
  suggestedSupplierId: string | null;
  suggestedSupplierName: string | null;
}

export interface ReplenishmentSummary {
  totalCount: number;
  counts: Record<ReplenishmentPriority, number>;
  totalTryCost: number;
  totalUsdSourceCost: number;
  hasUnconvertedCost: boolean;
}

export interface QuantityAggregateRow {
  productId: string | null;
  _sum: { quantity: number | null };
}

const EMPTY_COUNTS: Record<ReplenishmentPriority, number> = {
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
};

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function classifySupplierCategory(productCategory: string): string | null {
  const category = normalize(productCategory);
  const accessoryKeywords = ["aksesuar", "kılıf", "kilif", "kulaklık", "kulaklik", "kablo", "adaptör", "adapter"];
  const deviceKeywords = ["cihaz", "telefon", "tablet", "bilgisayar", "laptop", "saat"];
  const partKeywords = [
    "yedek",
    "parça",
    "parca",
    "ekran",
    "batarya",
    "pil",
    "soket",
    "kamera",
    "hoparlör",
    "mikrofon",
    "anakart",
    "entegre",
  ];
  if (accessoryKeywords.some((keyword) => category.includes(keyword))) return "aksesuar";
  if (deviceKeywords.some((keyword) => category.includes(keyword))) return "cihaz";
  if (partKeywords.some((keyword) => category.includes(keyword))) return "yedek parça";
  return null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildSalesWindowMap(
  rows30: QuantityAggregateRow[],
  rows60: QuantityAggregateRow[],
  rows90: QuantityAggregateRow[],
): Map<string, { d30: number; d60: number; d90: number }> {
  const result = new Map<string, { d30: number; d60: number; d90: number }>();
  const apply = (rows: QuantityAggregateRow[], key: "d30" | "d60" | "d90") => {
    for (const row of rows) {
      if (!row.productId) continue;
      const current = result.get(row.productId) ?? { d30: 0, d60: 0, d90: 0 };
      current[key] = Number(row._sum.quantity ?? 0);
      result.set(row.productId, current);
    }
  };
  apply(rows30, "d30");
  apply(rows60, "d60");
  apply(rows90, "d90");
  return result;
}

export function selectSupplier(
  directSupplierId: string | null,
  categoryName: string,
  suppliers: SupplierCandidate[],
): SupplierCandidate | null {
  if (directSupplierId) {
    const direct = suppliers.find((supplier) => supplier.id === directSupplierId);
    if (direct) return direct;
  }

  const ordered = [...suppliers].sort(
    (a, b) =>
      (b.trustScore ?? 0) - (a.trustScore ?? 0) ||
      a.name.localeCompare(b.name, "tr") ||
      a.id.localeCompare(b.id),
  );
  const normalizedCategory = normalize(categoryName);
  const broadCategory = classifySupplierCategory(categoryName);
  return (
    ordered.find((supplier) => normalize(supplier.category) === normalizedCategory) ??
    ordered.find((supplier) => broadCategory !== null && normalize(supplier.category) === broadCategory) ??
    ordered[0] ??
    null
  );
}

export function calculateReplenishmentCost(
  currency: ReplenishmentCurrency,
  unitCost: number,
  quantity: number,
  usdRate: number | null,
): { sourceTotal: number; tryTotal: number | null } {
  const sourceTotal = roundMoney(finiteNonNegative(unitCost) * finiteNonNegative(quantity));
  if (currency === "TRY") return { sourceTotal, tryTotal: sourceTotal };
  const validRate = usdRate !== null && Number.isFinite(usdRate) && usdRate > 0 ? usdRate : null;
  return {
    sourceTotal,
    tryTotal: validRate === null ? null : roundMoney(sourceTotal * validRate),
  };
}

export function buildReplenishmentRecommendation(
  input: ReplenishmentProductInput,
  usdRate: number | null,
): ReplenishmentRecommendation | null {
  const currentStock = finiteNonNegative(input.currentStock);
  const criticalStock = finiteNonNegative(input.criticalStock);
  const salesLast30 = finiteNonNegative(input.salesLast30);
  const salesLast60 = finiteNonNegative(input.salesLast60);
  const salesLast90 = finiteNonNegative(input.salesLast90);
  const pendingServiceQty = finiteNonNegative(input.pendingServiceQty);
  const pendingShortageQty = finiteNonNegative(input.pendingShortageQty);

  const dailyVelocity =
    salesLast30 > 0
      ? salesLast30 / 30
      : salesLast60 > 0
        ? salesLast60 / 60
        : salesLast90 / 90;
  const targetStock =
    Math.ceil(dailyVelocity * 30) +
    pendingServiceQty +
    pendingShortageQty +
    criticalStock;
  const suggestedOrderQty = Math.max(0, Math.ceil(targetStock - currentStock));
  if (suggestedOrderQty === 0) return null;

  const stockDeficit = Math.max(0, criticalStock - currentStock);
  const daysUntilStockout =
    dailyVelocity > 0 && currentStock > 0
      ? Math.floor(currentStock / dailyVelocity)
      : currentStock === 0
        ? 0
        : null;
  const targetGapRatio = suggestedOrderQty / Math.max(1, targetStock);
  let priorityScore = currentStock === 0 ? 50 : Math.round(targetGapRatio * 30);
  if (daysUntilStockout !== null && daysUntilStockout <= 3) priorityScore += 20;
  else if (daysUntilStockout !== null && daysUntilStockout <= 7) priorityScore += 10;
  const pendingDemand = pendingServiceQty + pendingShortageQty;
  if (pendingDemand > 0) priorityScore += Math.min(20, pendingDemand * 5);
  if (dailyVelocity > 1) priorityScore += 10;
  else if (dailyVelocity > 0.5) priorityScore += 5;
  priorityScore = Math.min(100, priorityScore);

  const priorityLevel: ReplenishmentPriority =
    priorityScore >= 70
      ? "CRITICAL"
      : priorityScore >= 45
        ? "HIGH"
        : priorityScore >= 20
          ? "MEDIUM"
          : "LOW";
  const costCurrency: ReplenishmentCurrency =
    input.priceCurrency === "USD" && input.buyPriceUsd !== null ? "USD" : "TRY";
  const unitCostSource =
    costCurrency === "USD" ? finiteNonNegative(input.buyPriceUsd ?? 0) : finiteNonNegative(input.buyPrice);
  const cost = calculateReplenishmentCost(costCurrency, unitCostSource, suggestedOrderQty, usdRate);

  return {
    ...input,
    currentStock,
    criticalStock,
    salesLast30,
    salesLast60,
    salesLast90,
    pendingServiceQty,
    pendingShortageQty,
    dailyVelocity: Math.round(dailyVelocity * 100) / 100,
    daysUntilStockout,
    stockDeficit,
    targetStock,
    suggestedOrderQty,
    priorityScore,
    priorityLevel,
    costCurrency,
    unitCostSource,
    estimatedCostSource: cost.sourceTotal,
    estimatedCostTry: cost.tryTotal,
    suggestedSupplierId: null,
    suggestedSupplierName: null,
  };
}

export function summarizeRecommendations(
  recommendations: ReplenishmentRecommendation[],
): ReplenishmentSummary {
  return recommendations.reduce<ReplenishmentSummary>(
    (summary, item) => {
      summary.totalCount += 1;
      summary.counts[item.priorityLevel] += 1;
      if (item.estimatedCostTry !== null) summary.totalTryCost += item.estimatedCostTry;
      if (item.costCurrency === "USD") summary.totalUsdSourceCost += item.estimatedCostSource;
      if (item.estimatedCostTry === null) summary.hasUnconvertedCost = true;
      return summary;
    },
    {
      totalCount: 0,
      counts: { ...EMPTY_COUNTS },
      totalTryCost: 0,
      totalUsdSourceCost: 0,
      hasUnconvertedCost: false,
    },
  );
}

export function emptyReplenishmentSummary(): ReplenishmentSummary {
  return {
    totalCount: 0,
    counts: { ...EMPTY_COUNTS },
    totalTryCost: 0,
    totalUsdSourceCost: 0,
    hasUnconvertedCost: false,
  };
}
