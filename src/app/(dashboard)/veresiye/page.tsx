import { getDebts, getThisMonthCollected } from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { VeresiyeClient } from "@/components/finance/veresiye-client";

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const [debts, thisMonthCollected, accounts] = await Promise.all([
    getDebts(),
    getThisMonthCollected(),
    getAccounts(),
  ]);

  return <VeresiyeClient debts={debts} thisMonthCollected={thisMonthCollected} accounts={accounts} />;
}
