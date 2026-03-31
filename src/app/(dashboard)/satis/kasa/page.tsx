import { FinancialSummaryStream } from "@/components/finance/streamed/financial-summary-stream";
import { DailySessionStream } from "@/components/finance/streamed/daily-session-stream";
import { TransactionListStream } from "@/components/finance/streamed/transaction-list-stream";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, PlusCircle } from "lucide-react";
import { CreateTransactionModal } from "@/components/finance/create-transaction-modal";
import { Button } from "@/components/ui/button";

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
        <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <Wallet className="h-8 w-8 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-extrabold text-foreground tracking-tight font-sans">Kasa & Finans</h1>
                        <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest">NAKİT AKIŞI VE GÜNLÜK RAPOR</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <CreateTransactionModal
                        trigger={
                            <Button className="h-16 rounded-[1.5rem] px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white font-black text-xs tracking-widest gap-4 group transition-all">
                                <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                                GELİR / GİDER EKLE
                            </Button>
                        }
                    />

                    <Suspense fallback={<Skeleton className="h-16 w-64 rounded-[1.5rem]" />}>
                        <DailySessionStream />
                    </Suspense>
                </div>
            </div>

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
