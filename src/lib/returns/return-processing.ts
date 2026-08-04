export interface ReturnProcessingInput {
  productId?: string | null;
  restockProduct?: boolean | null;
  immediateRestock?: boolean | null;
  processImmediately?: boolean | null;
  action?: ReturnProcessingAction | null;
}

export type ReturnProcessingAction = "RESTOCK" | "DEBT_DEDUCT" | "SEND_SUPPLIER" | "DISCARD" | "WAIT";
export type ReturnStockMovement = "IN" | "OUT" | "NONE";

export function shouldProcessReturnImmediately(input: ReturnProcessingInput) {
  if (input.action) return input.action !== "WAIT";
  if (input.processImmediately) return true;
  return !!(input.productId && input.restockProduct && input.immediateRestock);
}

export function getReturnProcessingPlan(input: ReturnProcessingInput) {
  switch (input.action) {
    case "RESTOCK":
      return { status: "RESTOCKED" as const, reduceDebt: true, stockMovement: input.productId ? "IN" as ReturnStockMovement : "NONE" as ReturnStockMovement };
    case "WAIT":
      return { status: "PENDING" as const, reduceDebt: false, stockMovement: "NONE" as ReturnStockMovement };
    case "SEND_SUPPLIER":
      return { status: "SENT_TO_SUPPLIER" as const, reduceDebt: true, stockMovement: input.productId ? "OUT" as ReturnStockMovement : "NONE" as ReturnStockMovement };
    case "DISCARD":
      return { status: "REFUNDED" as const, reduceDebt: true, stockMovement: input.productId ? "OUT" as ReturnStockMovement : "NONE" as ReturnStockMovement };
    case "DEBT_DEDUCT":
      return { status: "REFUNDED" as const, reduceDebt: true, stockMovement: "NONE" as ReturnStockMovement };
    default:
      if (shouldProcessReturnImmediately(input)) {
        return { status: "RESTOCKED" as const, reduceDebt: true, stockMovement: input.productId && input.restockProduct ? "IN" as ReturnStockMovement : "NONE" as ReturnStockMovement };
      }
      return { status: "PENDING" as const, reduceDebt: false, stockMovement: "NONE" as ReturnStockMovement };
  }
}
