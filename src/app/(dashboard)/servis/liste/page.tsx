import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { getServiceCounts } from "@/lib/actions/service-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { ServiceTableStream } from "@/components/service/streamed/service-table-stream";
import { ServiceStatus } from "@prisma/client";
import { getShop } from "@/lib/actions/setting-actions";
import { getIndustryConfig, getIndustryLabel } from "@/lib/industry-utils";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default async function ServisListePage() {
  const counts = await getServiceCounts();
  const shop = await getShop();
  const industryConfig = getIndustryConfig(shop?.industry);
  const Icon = industryConfig.icon || Wrench;

  const activeStatuses: ServiceStatus[] = ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"];
  const readyStatus: ServiceStatus = "READY";
  const doneStatuses: ServiceStatus[] = ["DELIVERED", "CANCELLED"];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title={`${getIndustryLabel(shop, "serviceTicket")} Listesi`}
        description={`Toplam ${counts.all} kayıt üzerinden operasyonel takip ve yönetim.`}
        icon={Icon}
        actions={
          <CreateServiceModal
            shop={shop}
            trigger={
              <Button className="gap-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                Yeni Kayıt
              </Button>
            }
          />
        }
      />

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/30 border border-border/40 rounded-2xl p-1.5 gap-1 h-auto mb-4 overflow-x-auto overflow-y-hidden max-w-full no-scrollbar">
          <TabsTrigger value="active" className="rounded-xl text-xs  data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5 transition-all">
            Aktif ({counts.active})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-xl text-xs  data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5 transition-all">
            Hazır ({counts.ready})
          </TabsTrigger>
          <TabsTrigger value="done" className="rounded-xl text-xs  data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5 transition-all">
            Geçmiş ({counts.done})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-xl text-xs  data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5 transition-all">
            Tümü ({counts.all})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0 ring-offset-background focus-visible:outline-none">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTableStream status={activeStatuses} shop={shop} />
          </Suspense>
        </TabsContent>

        <TabsContent value="ready" className="mt-0 ring-offset-background focus-visible:outline-none">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTableStream status={readyStatus} shop={shop} />
          </Suspense>
        </TabsContent>

        <TabsContent value="done" className="mt-0 ring-offset-background focus-visible:outline-none">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTableStream status={doneStatuses} shop={shop} />
          </Suspense>
        </TabsContent>

        <TabsContent value="all" className="mt-0 ring-offset-background focus-visible:outline-none">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTableStream shop={shop} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}




