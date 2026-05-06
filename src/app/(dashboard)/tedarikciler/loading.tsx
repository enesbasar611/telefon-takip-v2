import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-44 rounded-xl" />
                <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 flex-1 max-w-sm rounded-xl" />
                <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}
