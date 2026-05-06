import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-4 w-68 rounded-lg" />
            </div>
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-[400px] rounded-3xl" />
        </div>
    );
}
