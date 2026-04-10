import { FinancialSummaryStream } from "@/components/finance/streamed/financial-summary-stream";
import { DailySessionStream } from "@/components/finance/streamed/daily-session-stream";
import { TransactionListStream } from "@/components/finance/streamed/transaction-list-stream";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, PlusCircle } from "lucide-react";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

function SummarySkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-3xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}

function HistorySkeleton() {
    return (
        <div className="space-y-4 bg-card p-8 rounded-[2rem]">
            <Skeleton className="h-8 w-48 mb-6" />
            {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
        </div>
    );
}

export default async function KasaRaporuPage() {
    return (
        <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
            <PageHeader
                title="Kasa & Finans"
                description="Nakit akışını, günlük raporları ve finansal seansları tek bir merkezden yönetin."
                icon={Wallet}
                iconColor="text-indigo-500"
                iconBgColor="bg-indigo-500/10"
                badge={
                    <div className="flex items-center gap-4">
                        <Suspense fallback={<Skeleton className="h-10 w-48 rounded-full" />}>
                            <DailySessionStream />
                        </Suspense>
                    </div>
                }
                actions={
                    <CreateTransactionModal
                        trigger={
                            <Button className="h-12 rounded-xl px-6 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white text-xs tracking-widest gap-2 group transition-all">
                                <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                                GELİR / GİDER EKLE
                            </Button>
                        }
                    />
                }
            />

            <div className="grid grid-cols-1 gap-10">
                <Suspense fallback={<SummarySkeleton />}>
                    <FinancialSummaryStream />
                </Suspense>

                <Suspense fallback={<HistorySkeleton />}>
                    <TransactionListStream />
                </Suspense>
            </div>
        </div>
    );
}




