import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-36 rounded-xl" />
                <Skeleton className="h-4 w-60 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Skeleton className="h-[500px] rounded-3xl" />
                <div className="lg:col-span-3 space-y-4">
                    <Skeleton className="h-16 rounded-2xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
