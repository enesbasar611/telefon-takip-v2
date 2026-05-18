import { Suspense } from "react";
import { TedarikcilerPageClient } from "@/components/supplier/tedarikciler-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function TedarikcilerSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-4 w-60 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[360px] rounded-3xl" />
        <Skeleton className="h-[360px] rounded-3xl" />
      </div>
      <Skeleton className="h-[300px] rounded-3xl" />
    </div>
  );
}

export default function TedarikcilerPage() {
  return (
    <Suspense fallback={<TedarikcilerSkeleton />}>
      <TedarikcilerPageClient />
    </Suspense>
  );
}
