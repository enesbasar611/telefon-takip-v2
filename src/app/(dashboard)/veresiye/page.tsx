import { VeresiyeClient } from "@/components/finance/veresiye-client";
import { getShopId } from "@/lib/auth";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veresiye & Cari Takip | Başar Teknik",
  description: "Müşteri veresiye defteri, borç ve alacak takibi.",
};

export const dynamic = 'force-dynamic';

export default async function VeresiyePage() {
  const shopId = await getShopId(false);
  return (
    <VeresiyeClient shopId={shopId} />
  );
}
