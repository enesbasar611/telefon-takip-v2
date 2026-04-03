import { CardSkeleton } from "@/components/ui/card-skeleton";

export default function Loading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-end mb-8">
                <div className="space-y-2">
                    <div className="h-4 w-48 bg-muted rounded-md animate-pulse" />
                    <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="h-12 w-48 bg-muted rounded-xl animate-pulse" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            {/* Main Content Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CardSkeleton className="h-[400px]" />
                </div>
                <div>
                    <CardSkeleton className="h-[400px]" />
                </div>
            </div>
        </div>
    );
}
