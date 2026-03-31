import { getDebts, getThisMonthCollected } from "@/lib/actions/debt-actions";
import { VeresiyeClient } from "@/components/finance/veresiye-client";

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const [debts, thisMonthCollected] = await Promise.all([
    getDebts(),
    getThisMonthCollected(),
  ]);

  return <VeresiyeClient debts={debts} thisMonthCollected={thisMonthCollected} />;
}
