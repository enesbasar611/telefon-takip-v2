import { getServiceTickets } from "@/lib/actions/service-actions";
import { ServiceListTable } from "@/components/service/service-list-table";

export const dynamic = 'force-dynamic';

export default async function ServiceListPage() {
  const tickets = await getServiceTickets();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teknik Servis Listesi</h1>
          <p className="text-muted-foreground">Tüm teknik servis kayıtlarını filtreleyin ve yönetin.</p>
        </div>
      </div>
      <ServiceListTable data={tickets} />
    </div>
  );
}
