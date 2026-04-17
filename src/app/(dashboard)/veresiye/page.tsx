import { getDebts, getThisMonthCollected } from "@/lib/actions/debt-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { VeresiyeClient } from "@/components/finance/veresiye-client";

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const [debts, thisMonthCollected, accounts, rates] = await Promise.all([
    getDebts(),
    getThisMonthCollected(),
    getAccounts(),
    import("@/lib/auth").then(m => m.getShopId()).then(id => import("@/lib/actions/currency-actions").then(m => m.getExchangeRates(id)))
  ]);

  return <VeresiyeClient debts={debts} thisMonthCollected={thisMonthCollected} accounts={accounts} rates={rates} />;
}



