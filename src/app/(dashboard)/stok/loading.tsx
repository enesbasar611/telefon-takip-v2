import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-44 rounded-xl" />
                <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
            {/* Toolbar */}
            <div className="flex gap-3">
                <Skeleton className="h-10 flex-1 max-w-sm rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            {/* Table rows */}
            <div className="rounded-3xl border border-border/40 overflow-hidden">
                <Skeleton className="h-12 w-full rounded-none" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-border/20">
                        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48 rounded-lg" />
                            <Skeleton className="h-3 w-28 rounded-lg" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
