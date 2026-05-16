import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col gap-8 p-4 lg:p-10">
      <div className="min-h-[72px] space-y-3">
        <Skeleton className="h-8 w-72 max-w-full rounded-xl" />
        <Skeleton className="h-4 w-[420px] max-w-full rounded-lg" />
      </div>
      <div className="grid min-h-[220px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[220px] w-full rounded-[2rem]" />
        ))}
      </div>
      <div className="grid min-h-[500px] gap-6">
        <Skeleton className="min-h-[500px] w-full rounded-[2rem]" />
      </div>
    </div>
  );
}



