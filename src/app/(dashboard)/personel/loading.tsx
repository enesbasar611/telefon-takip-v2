import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-4 w-56 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-3xl border border-border/40 p-5 space-y-4 bg-card/50">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32 rounded-lg" />
                                <Skeleton className="h-3 w-20 rounded-lg" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
