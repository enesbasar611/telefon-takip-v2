import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatsSkeleton() {
    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="rounded-[2rem] bg-card border border-border/40 min-h-[220px]">
                    <CardContent className="p-8 flex flex-col justify-between">
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
        <Card className="rounded-[2rem] bg-card border border-border/40 overflow-hidden">
            <CardHeader className="p-8 pb-6 border-b border-border/40">
                <div className="flex items-center gap-8">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 h-[400px] flex items-end gap-2">
                {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 80}%` }} />
                ))}
            </CardContent>
        </Card>
    );
}

export function ListSkeleton() {
    return (
        <Card className="rounded-[2rem] bg-card border border-border/40 overflow-hidden">
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
        <Card className="rounded-[2rem] bg-card border border-border/40 overflow-hidden">
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
        <div className="flex gap-4 overflow-x-auto px-4 pb-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] p-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border/40 space-y-3">
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



