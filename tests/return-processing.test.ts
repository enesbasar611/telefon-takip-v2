import { getReturnProcessingPlan, shouldProcessReturnImmediately } from "../src/lib/returns/return-processing";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  shouldProcessReturnImmediately({ processImmediately: true, productId: undefined, restockProduct: false, immediateRestock: false }) === true,
  "Stockless debt returns should process immediately when requested."
);

assert(
  shouldProcessReturnImmediately({ processImmediately: false, productId: undefined, restockProduct: false, immediateRestock: false }) === false,
  "Stockless debt returns should remain pending when not requested."
);

assert(
  shouldProcessReturnImmediately({ productId: "prd_1", restockProduct: true, immediateRestock: true }) === true,
  "Product returns with quick restock should process immediately."
);

assert(
  shouldProcessReturnImmediately({ productId: "prd_1", restockProduct: true, immediateRestock: false }) === false,
  "Product returns without quick restock should remain pending."
);

const debtPlan = getReturnProcessingPlan({ action: "DEBT_DEDUCT", productId: "prd_1" });
assert(debtPlan.status === "REFUNDED", "Debt deduction should complete the return.");
assert(debtPlan.reduceDebt === true, "Debt deduction should reduce debt.");
assert(debtPlan.stockMovement === "NONE", "Debt deduction should not move stock.");

const supplierPlan = getReturnProcessingPlan({ action: "SEND_SUPPLIER", productId: "prd_1" });
assert(supplierPlan.status === "SENT_TO_SUPPLIER", "Supplier action should mark sent to supplier.");
assert(supplierPlan.reduceDebt === true, "Supplier action should reduce customer debt.");
assert(supplierPlan.stockMovement === "OUT", "Supplier action should move the item out of stock.");

const discardPlan = getReturnProcessingPlan({ action: "DISCARD", productId: "prd_1" });
assert(discardPlan.status === "REFUNDED", "Discard action should complete the return.");
assert(discardPlan.reduceDebt === true, "Discard action should reduce customer debt.");
assert(discardPlan.stockMovement === "OUT", "Discard action should move the item out of stock.");

const waitPlan = getReturnProcessingPlan({ action: "WAIT", productId: "prd_1" });
assert(waitPlan.status === "PENDING", "Wait action should keep return pending.");
assert(waitPlan.reduceDebt === false, "Wait action should not reduce debt.");
assert(waitPlan.stockMovement === "NONE", "Wait action should not move stock.");

console.log("return-processing tests passed");
