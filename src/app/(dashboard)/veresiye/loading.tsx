import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-28 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
            </div>
            {/* Filters bar */}
            <Skeleton className="h-16 rounded-2xl" />
            {/* Table */}
            <Skeleton className="h-[460px] rounded-3xl" />
        </div>
    );
}
