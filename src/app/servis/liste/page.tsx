import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceTable } from "@/components/service/service-table";
import { CreateServiceModal } from "@/components/service/create-service-modal";
import { getServiceTickets } from "@/lib/actions/service-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

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
  let tickets: any[] = [];
  try {
    tickets = await getServiceTickets();
  } catch (err) {
    console.error("Servis liste: DB bağlantı hatası");
  }

  const active = tickets.filter((t: any) =>
    ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)
  );
  const ready = tickets.filter((t: any) => t.status === "READY");
  const done = tickets.filter((t: any) =>
    ["DELIVERED", "CANCELLED"].includes(t.status)
  );

  return (
    <div className="flex flex-col gap-6 bg-background text-foreground min-h-screen lg:p-10 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center border border-primary/20">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Servis Listesi</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Toplam {tickets.length} kayıt</p>
          </div>
        </div>
        <CreateServiceModal
          trigger={
            <Button className="gap-2 rounded-xl font-bold">
              <Plus className="h-4 w-4" />
              Yeni Servis
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/30 border border-border/40 rounded-2xl p-1.5 gap-1 h-auto">
          <TabsTrigger value="active" className="rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
            Aktif ({active.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
            Hazır ({ready.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
            Geçmiş ({done.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-xl text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5">
            Tümü ({tickets.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTable data={active} />
          </Suspense>
        </TabsContent>
        <TabsContent value="ready" className="mt-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTable data={ready} />
          </Suspense>
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTable data={done} />
          </Suspense>
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <Suspense fallback={<LoadingSkeleton />}>
            <ServiceTable data={tickets} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
