import { getServiceTickets } from "@/lib/actions/service-actions";
import { getWarrantyStats } from "@/lib/actions/warranty-actions";
import { ServiceTabsController } from "@/components/service/service-tabs-controller";
import { Zap, Activity } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ServisMerkeziPage() {
  const [tickets, warrantyStats] = await Promise.all([
    getServiceTickets(),
    getWarrantyStats()
  ]);

  const activeCount = tickets.filter((t: any) => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)).length;

  return (
    <div className="flex flex-col gap-8 bg-background text-foreground min-h-screen lg:p-14 p-8 animate-in fade-in duration-500 pb-20">

      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] mt-1">
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{activeCount} Aktif İşlem</span>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">Servis Merkezi</h1>
            <p className="text-sm text-slate-400 font-medium mt-2">Dükkandaki tüm teknik servis süreçlerini, iadeleri ve teslimatları tek bir ekrandan yönetin.</p>
          </div>
        </div>
      </div>

      {/* Main Controller component integrating Tabs, Modals and Views */}
      <ServiceTabsController tickets={tickets} warrantyStats={warrantyStats} />

    </div>
  );
}
