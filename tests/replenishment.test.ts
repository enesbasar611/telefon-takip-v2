import {
  buildReplenishmentRecommendation,
  buildSalesWindowMap,
  calculateReplenishmentCost,
  selectSupplier,
  summarizeRecommendations,
  type ReplenishmentProductInput,
  type ReplenishmentRecommendation,
} from "../src/lib/inventory/replenishment";
import { getSmartReplenishmentTag } from "../src/lib/inventory/replenishment-cache";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const fastSeller: ReplenishmentProductInput = {
  productId: "p1",
  productName: "Hızlı Ürün",
  currentStock: 20,
  criticalStock: 5,
  salesLast30: 30,
  salesLast60: 40,
  salesLast90: 50,
  pendingServiceQty: 2,
  pendingShortageQty: 3,
  categoryName: "Ekran",
  categoryId: "cat-screen",
  buyPrice: 100,
  buyPriceUsd: null,
  priceCurrency: "TRY",
  directSupplierId: null,
};

const recommendation = buildReplenishmentRecommendation(fastSeller, 40);
assert(recommendation !== null, "Fast seller above critical stock should be recommended.");
assert(recommendation?.targetStock === 40, "Target should include 30-day demand, open demand and critical buffer.");
assert(recommendation?.suggestedOrderQty === 20, "Order quantity should close the target-stock gap.");
assert(recommendation?.pendingServiceQty === 2, "Service demand should remain separate.");
assert(recommendation?.pendingShortageQty === 3, "Shortage demand should remain separate.");

const sufficientlyStocked = buildReplenishmentRecommendation(
  {
    ...fastSeller,
    productId: "p2",
    currentStock: 50,
    salesLast30: 0,
    salesLast60: 0,
    salesLast90: 0,
    pendingServiceQty: 0,
    pendingShortageQty: 0,
  },
  40,
);
assert(sufficientlyStocked === null, "A product meeting its target should not be recommended.");

const suppliers = [
  { id: "general", name: "Genel", trustScore: 100, category: "Batarya" },
  { id: "screen", name: "Ekran A", trustScore: 80, category: "Ekran" },
  { id: "direct", name: "Bağlı", trustScore: 10, category: "Kılıf" },
];
assert(selectSupplier("direct", "Ekran", suppliers)?.id === "direct", "Direct supplier should win.");
assert(selectSupplier(null, "Ekran", suppliers)?.id === "screen", "Category match should win over global trust.");
assert(selectSupplier(null, "Kılıf", suppliers)?.id === "direct", "A category match should beat global trust.");
assert(selectSupplier(null, "Kulaklık", suppliers)?.id === "general", "Global trust should be fallback.");
const broadCategorySuppliers = [
  { id: "other", name: "Genel", trustScore: 100, category: "Diğer" },
  { id: "parts", name: "Parçacı", trustScore: 70, category: "Yedek Parça" },
];
assert(
  selectSupplier(null, "Ekran", broadCategorySuppliers)?.id === "parts",
  "Detailed product categories should map to the broad supplier category.",
);

const usd = calculateReplenishmentCost("USD", 10, 3, 40);
assert(usd.sourceTotal === 30 && usd.tryTotal === 1200, "USD should retain source total and convert to TRY.");
const missingRate = calculateReplenishmentCost("USD", 10, 3, null);
assert(missingRate.tryTotal === null, "Missing USD rate must not create a false TRY total.");
const tr = calculateReplenishmentCost("TRY", 100, 3, 40);
assert(tr.sourceTotal === 300 && tr.tryTotal === 300, "TRY cost should remain TRY.");

const criticalItem = {
  ...recommendation!,
  priorityLevel: "CRITICAL" as const,
  estimatedCostTry: 100,
  estimatedCostSource: 100,
  costCurrency: "TRY" as const,
} satisfies ReplenishmentRecommendation;
const lowUsdItem = {
  ...recommendation!,
  productId: "p3",
  priorityLevel: "LOW" as const,
  estimatedCostTry: null,
  estimatedCostSource: 25,
  costCurrency: "USD" as const,
} satisfies ReplenishmentRecommendation;
const summary = summarizeRecommendations([criticalItem, lowUsdItem]);
assert(summary.totalCount === 2, "Summary must include the complete recommendation set.");
assert(summary.counts.CRITICAL === 1 && summary.counts.LOW === 1, "Summary should count every priority.");
assert(summary.totalTryCost === 100, "Summary should include converted TRY costs.");
assert(summary.totalUsdSourceCost === 25, "Summary should retain source USD costs.");
assert(summary.hasUnconvertedCost, "Summary should flag costs without a TRY conversion.");

const salesWindows = buildSalesWindowMap(
  [{ productId: "p1", _sum: { quantity: 4 } }],
  [{ productId: "p1", _sum: { quantity: 7 } }],
  [
    { productId: "p1", _sum: { quantity: 10 } },
    { productId: "p2", _sum: { quantity: null } },
  ],
);
assert(salesWindows.get("p1")?.d30 === 4, "30-day aggregate should be mapped.");
assert(salesWindows.get("p1")?.d90 === 10, "90-day aggregate should be mapped.");
assert(salesWindows.get("p2")?.d90 === 0, "Null aggregate sums should become zero.");
assert(
  getSmartReplenishmentTag("shop-1") === "smart-replenishment-shop-1",
  "Cache tag should be scoped to the shop.",
);

console.log("replenishment tests passed");
