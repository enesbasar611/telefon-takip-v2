import { Suspense } from "react";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { getWarrantyStats } from "@/lib/actions/warranty-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryLabel } from "@/lib/industry-utils";
import { ServiceTabsController } from "@/components/service/service-tabs-controller";
import { Zap, Sparkles, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TechnicalServiceAnalysisModal } from "@/components/service/technical-service-analysis-modal";

export const dynamic = 'force-dynamic';

async function ServiceData() {
  const shop = await getShop();
  const [tickets, warrantyStats] = await Promise.all([
    getServiceTickets(),
    getWarrantyStats()
  ]);

  const activeCount = tickets.filter((t: any) => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)).length;
  const serviceLabel = getIndustryLabel(shop, "serviceTicket");
  const assetLabel = getIndustryLabel(shop, "customerAsset");

  return (
    <>
      <PageHeader
        title={`${serviceLabel} Merkezi`}
        description={`Dükkandaki tüm ${serviceLabel.toLowerCase()} süreçlerini, iadeleri ve teslimatları tek bir ekrandan yönetin.`}
        icon={Zap}
        badge={
          <div className="flex items-center gap-3">
            <TechnicalServiceAnalysisModal />
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px]  text-emerald-500 uppercase tracking-wider">{activeCount} Aktif İşlem</span>
            </div>

            <button className="flex items-center gap-2 bg-[#111111] hover:bg-[#18181A] px-3 py-1 rounded-full border border-[#333333] transition-colors group">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-[10px]  text-white uppercase tracking-wider">BAŞAR AI İLE {assetLabel.toLocaleUpperCase('tr-TR')} GİRİŞİ</span>
            </button>
          </div>
        }
      />

      <ServiceTabsController tickets={tickets} warrantyStats={warrantyStats} shop={shop} />
    </>
  );
}

function ServiceLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="h-[500px] w-full bg-muted/20 animate-pulse rounded-[2rem] border border-border/40 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    </div>
  );
}

export default function ServisMerkeziPage() {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
      <Suspense fallback={<ServiceLoading />}>
        <ServiceData />
      </Suspense>
    </div>
  );
}



