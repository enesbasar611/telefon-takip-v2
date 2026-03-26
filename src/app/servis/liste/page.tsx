import { getServiceTickets } from "@/lib/actions/service-actions";
import { ServiceListTable } from "@/components/service/service-list-table";

export const dynamic = 'force-dynamic';

export default async function ServiceListPage() {
  const tickets = await getServiceTickets();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 shadow-orange-sm" />
            <span className="text-[10px] font-black   text-slate-500">Operasyonel Takip</span>
          </div>
          <h1 className="text-4xl font-black  text-white  italic">SERVİS <span className="text-blue-500">MERKEZİ</span></h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Aktif teknik servis kayıtlarını ve cihaz durumlarını yönetin.</p>
        </div>
      </div>

      <div className="matte-card p-8 rounded-[2.5rem] border-slate-800/50">
        <ServiceListTable data={tickets} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
