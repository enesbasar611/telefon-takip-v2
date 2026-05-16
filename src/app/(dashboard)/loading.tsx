import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="w-full min-h-[1100px] space-y-10 animate-in fade-in duration-300">
            <div className="flex min-h-[76px] items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="space-y-3 pt-1">
                        <Skeleton className="h-8 w-72 rounded-xl" />
                        <Skeleton className="h-4 w-[420px] max-w-full rounded-lg" />
                    </div>
                </div>
                <div className="hidden items-center gap-3 xl:flex">
                    <Skeleton className="h-10 w-36 rounded-full" />
                    <Skeleton className="h-10 w-40 rounded-full" />
                </div>
            </div>

            <div className="grid min-h-[220px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-[220px] rounded-[2rem]" />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Skeleton className="min-h-[500px] rounded-[2rem] w-full" />
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <Skeleton className="min-h-[420px] rounded-[2rem] w-full" />
                <Skeleton className="min-h-[420px] rounded-[2rem] w-full" />
            </div>
        </div>
    );
}



