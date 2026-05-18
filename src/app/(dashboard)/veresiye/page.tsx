import { VeresiyeClient } from "@/components/finance/veresiye-client";
import { getShopId } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const shopId = await getShopId(false);
  return (
    <VeresiyeClient shopId={shopId} />
  );
}
