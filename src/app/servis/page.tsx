import { getServiceTickets } from "@/lib/actions/service-actions";
import { ServiceListTable } from "@/components/service/service-list-table";
import { ServiceStats } from "@/components/service/service-stats";

export const dynamic = 'force-dynamic';

export default async function ServiceListPage() {
  const tickets = await getServiceTickets();

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider">Operasyonel Takip</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">Servis Merkezi</h1>
          <p className="text-sm text-muted-foreground font-medium mt-2">Aktif teknik servis kayıtlarını ve cihaz durumlarını yönetin.</p>
        </div>
      </div>

      <ServiceStats tickets={tickets} />

      <div className="matte-card p-0 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <ServiceListTable data={tickets} />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .matte-card {
            background: rgba(15, 23, 42, 0.4) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        .shadow-orange-sm {
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.2);
        }
      `}} />
    </div>
  );
}
