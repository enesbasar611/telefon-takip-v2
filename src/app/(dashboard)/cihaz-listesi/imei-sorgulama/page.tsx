import { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ShieldCheck } from "lucide-react";
import { getShopId } from "@/lib/auth";
import { getImeiLookupHistory } from "@/lib/imei-history";
import { ImeiLookupCenterClient } from "@/components/imei/ImeiLookupCenterClient";

export const metadata: Metadata = {
  title: "IMEI & BTK Sorgulama | Başar Teknik",
  description: "Canlı e-Devlet BTK IMEI sorgulama, geçmiş kayıtlar ve hızlı tekrar sorgulama merkezi.",
};

export const dynamic = "force-dynamic";

export default async function ImeiLookupCenterPage() {
  const shopId = await getShopId(false);
  const initialHistory = shopId ? await getImeiLookupHistory(shopId) : [];

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto px-3.5 py-4 sm:p-8">
      <PageHeader
        title="IMEI & BTK Sorgulama Merkezi"
        description="Canlı e-Devlet BTK kayıt sorgulama, cihaz kimlik tespiti ve önceki sorgularda tek tıkla tekrar kontrol."
        icon={ShieldCheck}
      />
      <ImeiLookupCenterClient initialHistory={initialHistory} />
    </div>
  );
}

