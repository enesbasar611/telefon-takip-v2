import { getTransactions, getFinancialSummary } from "@/lib/actions/finance-actions";
import { FinansClient } from "@/components/finance/finans-client";

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const [transactions, summary] = await Promise.all([
    getTransactions(),
    getFinancialSummary(),
  ]);

  return <FinansClient transactions={transactions} summary={summary} />;
}
