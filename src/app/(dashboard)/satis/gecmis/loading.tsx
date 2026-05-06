import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <Skeleton className="h-16 rounded-2xl" />
            <div className="rounded-3xl border border-border/40 overflow-hidden bg-card/50">
                <Skeleton className="h-12 w-full rounded-none" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-border/20">
                        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-52 rounded-lg" />
                            <Skeleton className="h-3 w-32 rounded-lg" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
