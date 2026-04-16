import { Package } from "lucide-react";
import { getCategories } from "@/lib/actions/product-actions";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { BulkAddProductModal } from "@/components/product/bulk-add-product-modal";
import { StockMetricsStream } from "@/components/product/streamed/stock-metrics-stream";
import { CategorySummaryStream } from "@/components/product/streamed/category-summary-stream";
import { StockTableStream } from "@/components/product/streamed/stock-table-stream";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { getShop } from "@/lib/actions/setting-actions";

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
  const shop = await getShop();

  return (
    <div className="flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="Envanter Yönetimi"
        description="Mağaza içerisindeki tüm ürün stoklarının, değerlerinin ve hareketlerinin stratejik merkezi."
        icon={Package}
        iconColor="text-primary"
        iconBgColor="bg-primary/10"
        actions={
          <>
            <BulkAddProductModal categories={categories} shop={shop} />
            <CreateProductModal categories={categories} shop={shop} />
          </>
        }
      />

      <div className="space-y-8">
        <Suspense fallback={<CardSkeleton />}>
          <StockMetricsStream />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <CategorySummaryStream />
        </Suspense>
      </div>

      <div className="bg-card shadow-sm rounded-[2rem] overflow-hidden border border-border">
        <Suspense fallback={<TableSkeleton />}>
          <StockTableStream searchParams={searchParams} shop={shop} />
        </Suspense>
      </div>
    </div>
  );
}



