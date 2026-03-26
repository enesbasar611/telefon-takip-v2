import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceTable } from "@/components/service/service-table";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { ServiceStatus } from "@prisma/client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function ServicePage() {
  const tickets = await getServiceTickets();

  const filterByStatus = (status?: ServiceStatus) => {
    if (!status) return tickets;
    return tickets.filter((t: any) => t.status === status);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ">Servis Yönetimi</h1>
          <p className="text-muted-foreground">Aktif ve geçmiş servis kayıtlarını yönetin.</p>
        </div>
        <CreateServiceModal />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-7 overflow-x-auto">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="PENDING">Beklemede</TabsTrigger>
          <TabsTrigger value="APPROVED">Onay Bekliyor</TabsTrigger>
          <TabsTrigger value="REPAIRING">Tamirde</TabsTrigger>
          <TabsTrigger value="WAITING_PART">Parça Bekliyor</TabsTrigger>
          <TabsTrigger value="READY">Hazır</TabsTrigger>
          <TabsTrigger value="DELIVERED">Teslim Edildi</TabsTrigger>
        </TabsList>
        <Suspense fallback={<ServiceTableSkeleton />}>
          <TabsContent value="all" className="mt-4">
            <ServiceTable data={tickets} />
          </TabsContent>
          <TabsContent value="PENDING" className="mt-4">
            <ServiceTable data={filterByStatus(ServiceStatus.PENDING)} />
          </TabsContent>
          <TabsContent value="APPROVED" className="mt-4">
            <ServiceTable data={filterByStatus(ServiceStatus.APPROVED)} />
          </TabsContent>
          <TabsContent value="REPAIRING" className="mt-4">
            <ServiceTable data={filterByStatus(ServiceStatus.REPAIRING)} />
          </TabsContent>
          <TabsContent value="WAITING_PART" className="mt-4">
            <ServiceTable data={filterByStatus(ServiceStatus.WAITING_PART)} />
          </TabsContent>
          <TabsContent value="READY" className="mt-4">
            <ServiceTable data={filterByStatus(ServiceStatus.READY)} />
          </TabsContent>
          <TabsContent value="DELIVERED" className="mt-4">
            <ServiceTable data={filterByStatus(ServiceStatus.DELIVERED)} />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}

function ServiceTableSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
