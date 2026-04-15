import { Suspense } from "react";
import { MobileStatsStream } from "./streamed/mobile-stats-stream";
import { MobileActionGrid } from "./mobile-action-grid";
import { MobileStatsSkeleton, ActivitySkeleton } from "./dashboard-skeletons";
import { MobileActivityStream } from "./streamed/mobile-activity-stream";

export function MobileDashboard() {
    return (
        <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Quick Stats Carousel */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[20px] font-black px-1 tracking-tight">Hızlı Bakış</h2>
                <Suspense fallback={<MobileStatsSkeleton />}>
                    <MobileStatsStream />
                </Suspense>
            </div>

            {/* Quick Action Grid */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[20px] font-black px-1 tracking-tight">İşlemler</h2>
                <MobileActionGrid />
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[20px] font-black px-1 tracking-tight">Son İşlemler</h2>
                <Suspense fallback={<div className="px-4"><ActivitySkeleton /></div>}>
                    <MobileActivityStream />
                </Suspense>
            </div>

            {/* Branding / Greeting */}
            <div className="px-6 py-12 opacity-30 flex flex-col items-center justify-center gap-3">
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-foreground/40 to-transparent rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">
                    BAŞAR TEKNİK ERP <br />
                    <span className="opacity-50 text-[8px]">VERSION 2.0.0</span>
                </span>
            </div>
        </div>
    );
}
