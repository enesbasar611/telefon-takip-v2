import { getTransactions, getFinancialSummary, getDailySession } from "@/lib/actions/finance-actions";
import { FinansClient } from "@/components/finance/finans-client";

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const [transactions, summary, session] = await Promise.all([
    getTransactions(),
    getFinancialSummary(),
    getDailySession(),
  ]);

  return (
    <FinansClient
      transactions={transactions}
      summary={summary}
      session={session}
    />
  );
}
