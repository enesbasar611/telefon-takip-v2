import { Package } from "lucide-react";
import { getCategories } from "@/lib/actions/product-actions";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { BulkAddProductModal } from "@/components/product/bulk-add-product-modal";
import { StockMetricsStream } from "@/components/product/streamed/stock-metrics-stream";
import { CategorySummaryStream } from "@/components/product/streamed/category-summary-stream";
import { StockTableStream } from "@/components/product/streamed/stock-table-stream";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function TableSkeleton() {
  return (
    <div className="space-y-4 p-8 bg-card rounded-2xl">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-3xl" />
      ))}
    </div>
  );
}

export default async function StokPage({ searchParams }: { searchParams: any }) {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold text-foreground font-sans">Envanter yönetimi</h1>
            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest">DÜKKANIN ENERJİSİ VE SERMAYESİ</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BulkAddProductModal categories={categories} />
          <CreateProductModal categories={categories} />
        </div>
      </div>

      <div className="space-y-8">
        <Suspense fallback={<CardSkeleton />}>
          <StockMetricsStream />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <CategorySummaryStream />
        </Suspense>
      </div>

      <div className="bg-card shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-2xl overflow-hidden border-none border border-border/40">
        <Suspense fallback={<TableSkeleton />}>
          <StockTableStream searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
