import { ProductTable } from "@/components/product/product-table";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function StockPage() {

  // Create default categories if none exist
  const count = await prisma.category.count();
  if (count === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Telefonlar" },
        { name: "Yedek Parçalar" },
        { name: "Aksesuarlar" },
        { name: "Kılıflar" },
        { name: "Bataryalar" },
      ],
    });
  }

  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok ve Ürünler</h1>
          <p className="text-muted-foreground">Envanterinizi, kritik stokları ve ürün kategorilerini yönetin.</p>
        </div>
        <CreateProductModal categories={categories} />
      </div>

      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductTable data={products} />
      </Suspense>
    </div>
  );
}

function ProductTableSkeleton() {
  return (
    <div className="space-y-3 mt-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
