import { ServiceTable } from "@/components/service/service-table";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { ServiceStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function ServiceTeslimatlarPage() {
  const tickets = await getServiceTickets();

  const readyTickets = tickets.filter((t: any) => t.status === ServiceStatus.READY);
  const deliveredTickets = tickets.filter((t: any) => t.status === ServiceStatus.DELIVERED);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold ">Teslimatlar</h1>
        <p className="text-muted-foreground">Teslim edilmeye hazır ve teslim edilmiş cihazların takibi.</p>
      </div>

      <Tabs defaultValue="ready" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="ready">Hazır Bekleyenler</TabsTrigger>
          <TabsTrigger value="delivered">Teslim Edilenler</TabsTrigger>
        </TabsList>
        <Suspense fallback={<ServiceTableSkeleton />}>
          <TabsContent value="ready" className="mt-4">
            <ServiceTable data={readyTickets} />
          </TabsContent>
          <TabsContent value="delivered" className="mt-4">
            <ServiceTable data={deliveredTickets} />
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
    </div>
  );
}
