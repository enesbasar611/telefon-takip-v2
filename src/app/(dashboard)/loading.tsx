import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="w-full space-y-10 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <Skeleton className="h-4 w-96 rounded-lg" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-[400px] rounded-3xl w-full" />
                    <Skeleton className="h-[300px] rounded-3xl w-full" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-[500px] rounded-3xl w-full" />
                    <Skeleton className="h-[200px] rounded-3xl w-full" />
                </div>
            </div>
        </div>
    );
}



