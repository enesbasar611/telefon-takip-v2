import { Package } from "lucide-react";
import { getProducts, getCategories, getInventoryStats } from "@/lib/actions/product-actions";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { StockListTable } from "@/components/product/stock-list-table";
import { StockDashboardMetrics } from "@/components/product/stock-dashboard-metrics";
import { CategorySummaryCards } from "@/components/product/category-summary-cards";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function StokPage() {
  const products = await getProducts();
  const categories = await getCategories();
  const stats = await getInventoryStats();

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold text-white font-manrope">Envanter yönetimi</h1>
            <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest">DÜKKANIN ENERJİSİ VE SERMAYESİ</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreateProductModal categories={categories} />
        </div>
      </div>

      <div className="space-y-8">
        <StockDashboardMetrics stats={stats} />
        <CategorySummaryCards products={products} categories={categories} />
      </div>

      <div className="bg-card shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-2xl overflow-hidden border-none">
        <StockListTable products={products} categories={categories} />
      </div>
    </div>
  );
}
