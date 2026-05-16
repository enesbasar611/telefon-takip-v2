import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatsSkeleton() {
    return (
        <div className="grid min-h-[220px] gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="rounded-[2rem] bg-card border border-border/40 h-[220px]">
                    <CardContent className="p-8 h-full flex flex-col justify-between">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <Card className="rounded-[2rem] bg-card border border-border/40 overflow-hidden min-h-[500px]">
            <CardHeader className="p-8 pb-6 border-b border-border/40">
                <div className="flex items-center gap-8">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 h-[384px] flex items-end gap-2">
                {[32, 58, 44, 72, 51, 86, 64, 46, 78, 69, 54, 92].map((height, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${height}%` }} />
                ))}
            </CardContent>
        </Card>
    );
}

export function ListSkeleton() {
    return (
        <Card className="rounded-[2rem] bg-card border border-border/40 overflow-hidden min-h-[420px]">
            <CardHeader className="p-8 pb-6 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function ActivitySkeleton() {
    return (
        <Card className="rounded-[2rem] bg-card border border-border/40 overflow-hidden min-h-[420px]">
            <CardHeader className="p-8 pb-4">
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function MobileStatsSkeleton() {
    return (
        <div className="flex min-h-[136px] gap-4 overflow-x-auto px-4 pb-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] h-[120px] p-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border/40 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DashboardPageSkeleton() {
    return (
        <>
            <div className="hidden md:flex min-h-[1100px] flex-col space-y-12 selection:bg-primary/20 relative z-10 opacity-100 transition-opacity duration-200">
                <div className="flex min-h-[76px] items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        <div className="space-y-3 pt-1">
                            <Skeleton className="h-8 w-72 rounded-xl" />
                            <Skeleton className="h-4 w-[420px] max-w-full rounded-lg" />
                        </div>
                    </div>
                    <div className="hidden items-center gap-3 xl:flex">
                        <Skeleton className="h-10 w-36 rounded-full" />
                        <Skeleton className="h-10 w-40 rounded-full" />
                    </div>
                </div>

                <StatsSkeleton />

                <div className="grid grid-cols-1 gap-8">
                    <ChartSkeleton />
                </div>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <ListSkeleton />
                    <ActivitySkeleton />
                </div>
            </div>

            <div className="md:hidden flex min-h-screen flex-col space-y-6 pt-2 pb-10 transition-opacity duration-200">
                <MobileStatsSkeleton />
                <div className="px-4">
                    <ActivitySkeleton />
                </div>
            </div>
        </>
    );
}



