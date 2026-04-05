import { getServiceTickets } from "@/lib/actions/service-actions";
import { getWarrantyStats } from "@/lib/actions/warranty-actions";
import { ServiceTabsController } from "@/components/service/service-tabs-controller";
import { Zap, Activity, Sparkles, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

export default async function ServisMerkeziPage() {
  const [tickets, warrantyStats] = await Promise.all([
    getServiceTickets(),
    getWarrantyStats()
  ]);

  const activeCount = tickets.filter((t: any) => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)).length;

  return (
    <div className="flex flex-col gap-8 bg-background text-foreground min-h-screen lg:p-14 p-8 animate-in fade-in duration-500 pb-20">

      <PageHeader
        title="Servis Merkezi"
        description="Dükkandaki tüm teknik servis süreçlerini, iadeleri ve teslimatları tek bir ekrandan yönetin."
        icon={Zap}
        badge={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{activeCount} Aktif İşlem</span>
            </div>

            <button className="flex items-center gap-2 bg-[#111111] hover:bg-[#18181A] px-3 py-1 rounded-full border border-[#333333] transition-colors group">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 group-hover:animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">BAŞAR AI İLE CİHAZ GİRİŞİ</span>
            </button>
          </div>
        }
      />

      {/* Main Controller component integrating Tabs, Modals and Views */}
      <ServiceTabsController tickets={tickets} warrantyStats={warrantyStats} />

    </div>
  );
}
