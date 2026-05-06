import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-52 rounded-xl" />
                <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-16 rounded-2xl" />
                    <Skeleton className="h-[480px] rounded-3xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-48 rounded-3xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
