import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-10 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-56 rounded-xl" />
                <Skeleton className="h-4 w-80 rounded-lg" />
            </div>
            {/* POS Grid */}
            <div className="h-[600px] w-full rounded-[2rem] border border-border/40 bg-muted/20 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 opacity-30">
                    <div className="h-12 w-12 rounded-2xl bg-muted-foreground/20" />
                    <div className="h-4 w-32 rounded-lg bg-muted-foreground/20" />
                </div>
            </div>
        </div>
    );
}
