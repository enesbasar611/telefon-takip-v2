import {
  calculateServiceProfitAnalytics,
  convertServiceProfitAnalyticsCurrency,
} from "../src/lib/service/service-profit-analytics";

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    console.error("FAILED:", message);
    console.error("Expected:", expected);
    console.error("Actual:", actual);
    process.exit(1);
  }
}

console.log("Running service profit analytics tests...");

const analytics = calculateServiceProfitAnalytics([
  {
    estimatedCost: 500,
    actualCost: 650,
    overhead: 50,
    usedParts: [
      { quantity: 2, unitPrice: 150, costPrice: 80 },
      { quantity: 1, unitPrice: 200, costPrice: 120 },
    ],
  },
  {
    estimatedCost: 300,
    actualCost: 0,
    overhead: 25,
    usedParts: [{ quantity: 1, unitPrice: 100, costPrice: 60 }],
  },
]);

assertEqual(analytics.serviceCount, 2, "should count delivered services");
assertEqual(analytics.partsQuantity, 4, "should sum used part quantity");
assertEqual(analytics.laborRevenue, 950, "should use actual cost and fall back to estimated cost");
assertEqual(analytics.partsRevenue, 600, "should sum part sales");
assertEqual(analytics.grossRevenue, 1550, "should calculate gross revenue");
assertEqual(analytics.partsCost, 340, "should sum part costs");
assertEqual(analytics.overhead, 75, "should sum overhead");
assertEqual(analytics.netProfit, 1135, "should subtract part costs and overhead from revenue");

const usdAnalytics = convertServiceProfitAnalyticsCurrency(analytics, "USD", { usd: 50 });

assertEqual(usdAnalytics.serviceCount, 2, "should not convert service count");
assertEqual(usdAnalytics.partsQuantity, 4, "should not convert part quantity");
assertEqual(usdAnalytics.grossRevenue, 31, "should convert gross revenue to USD");
assertEqual(usdAnalytics.netProfit, 22.7, "should convert net profit to USD");

console.log("Service profit analytics tests passed.");
