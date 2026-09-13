export interface PaymentAllocation {
  debtId: string;
  debtDescription: string;
  debtCreatedAt: Date;
  allocatedAmountTRY: number;
  allocatedAmountUSD: number;
}

export function calculatePaymentAllocations(
  paymentId: string,
  debts: any[],
  transactions: any[],
  usdRate: number
): PaymentAllocation[] {
  // Sort debts and transactions chronologically
  const sortedDebts = [...debts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sortedTransactions = [...transactions]
    .filter(t => t.type === 'PAYMENT' || t.type === 'INCOME')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Initialize remaining amounts for all debts (we need their ORIGINAL amounts)
  const debtBalances = sortedDebts.map(d => ({
    id: d.id,
    description: d.description || d.notes || d.productName || (d.sale?.items?.[0]?.product?.name) || "Veresiye Kaydı",
    createdAt: new Date(d.createdAt),
    currency: d.currency || "TRY",
    originalAmount: Number(d.amount || 0),
    remainingAmount: Number(d.amount || 0), // Start fully unpaid
  }));

  const allocations: PaymentAllocation[] = [];
  const safeRate = usdRate || 1;

  for (const tx of sortedTransactions) {
    let txRemaining = Number(tx.amount || 0);
    const txCurrency = tx.currency || "TRY";

    for (const debt of debtBalances) {
      if (txRemaining <= 0) break;
      if (debt.remainingAmount <= 0) continue;

      let appliedToDebt = 0;
      let appliedFromTx = 0;

      if (debt.currency === txCurrency) {
        appliedToDebt = Math.min(debt.remainingAmount, txRemaining);
        appliedFromTx = appliedToDebt;
      } else if (debt.currency === "USD" && txCurrency === "TRY") {
        // Debt is USD, Payment is TRY
        const debtRemainingInTRY = debt.remainingAmount * safeRate;
        appliedFromTx = Math.min(txRemaining, debtRemainingInTRY);
        appliedToDebt = appliedFromTx / safeRate;
      } else if (debt.currency === "TRY" && txCurrency === "USD") {
        // Debt is TRY, Payment is USD
        const debtRemainingInUSD = debt.remainingAmount / safeRate;
        appliedFromTx = Math.min(txRemaining, debtRemainingInUSD);
        appliedToDebt = appliedFromTx * safeRate;
      }

      debt.remainingAmount -= appliedToDebt;
      txRemaining -= appliedFromTx;

      if (tx.id === paymentId && appliedFromTx > 0) {
        allocations.push({
          debtId: debt.id,
          debtDescription: debt.description,
          debtCreatedAt: debt.createdAt,
          allocatedAmountTRY: txCurrency === "TRY" ? appliedFromTx : (txCurrency === "USD" && debt.currency === "TRY" ? appliedToDebt : appliedFromTx * safeRate),
          allocatedAmountUSD: txCurrency === "USD" ? appliedFromTx : (txCurrency === "TRY" && debt.currency === "USD" ? appliedToDebt : appliedFromTx / safeRate),
        });
      }
    }

    if (tx.id === paymentId) {
      break;
    }
  }

  return allocations;
}
