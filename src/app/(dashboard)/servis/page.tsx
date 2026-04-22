import { getServiceTickets } from "@/lib/actions/service-actions";
import { getWarrantyStats } from "@/lib/actions/warranty-actions";
import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryLabel } from "@/lib/industry-utils";
import { ServiceTabsController } from "@/components/service/service-tabs-controller";
import { Zap, Activity, Sparkles, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TechnicalServiceAnalysisModal } from "@/components/service/technical-service-analysis-modal";

export const dynamic = 'force-dynamic';

export default async function ServisMerkeziPage() {
  const shop = await getShop();
  const [tickets, warrantyStats] = await Promise.all([
    getServiceTickets(),
    getWarrantyStats()
  ]);

  const activeCount = tickets.filter((t: any) => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)).length;
  const serviceLabel = getIndustryLabel(shop, "serviceTicket");
  const assetLabel = getIndustryLabel(shop, "customerAsset");

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">

      <PageHeader
        title={`${serviceLabel} Merkezi`}
        description={`Dükkandaki tüm ${serviceLabel.toLowerCase()} süreçlerini, iadeleri ve teslimatları tek bir ekrandan yönetin.`}
        icon={Zap}
        badge={
          <div className="flex items-center gap-3">
            <TechnicalServiceAnalysisModal />
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px]  text-emerald-500 uppercase tracking-wider">{activeCount} Aktif İşlem</span>
            </div>

            <button className="flex items-center gap-2 bg-[#111111] hover:bg-[#18181A] px-3 py-1 rounded-full border border-[#333333] transition-colors group">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover:animate-pulse" />
              <span className="text-[10px]  text-white uppercase tracking-wider">BAŞAR AI İLE {assetLabel.toLocaleUpperCase('tr-TR')} GİRİŞİ</span>
            </button>
          </div>
        }
      />

      {/* Main Controller component integrating Tabs, Modals and Views */}
      <ServiceTabsController tickets={tickets} warrantyStats={warrantyStats} shop={shop} />

    </div>
  );
}



