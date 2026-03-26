import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertCircle, Barcode as BarcodeIcon, Layers, TrendingUp } from "lucide-react";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { StockListTable } from "@/components/product/stock-list-table";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function StokPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-foreground font-manrope">Envanter yönetimi</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Yedek parça, aksesuar ve global stok envanteri</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
             <CreateProductModal categories={categories} />
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam ürün", value: products.length, icon: Package, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { label: "Kritik stok", value: products.filter((p: any) => p.stock <= p.criticalStock).length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "Kategori sayısı", value: categories.length, icon: Layers, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { label: "Barkodlu ürünler", value: products.filter((p: any) => p.barcode).length, icon: BarcodeIcon, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" }
        ].map((stat, i) => (
          <Card key={i} className="rounded-xl border-none shadow-xl shadow-slate-200/50 dark:shadow-black/40 bg-card transition-all duration-500 hover:translate-y-[-6px]">
            <CardContent className="p-10 flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between">
                <div className={cn("p-4 rounded-2xl border shadow-inner transition-transform group-hover:scale-110", stat.bg, stat.border)}>
                  <stat.icon className={cn("h-8 w-8", stat.color)} />
                </div>
                <TrendingUp className="h-6 w-6 text-slate-200" />
              </div>
              <div className="mt-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={cn(
                    "text-5xl font-extrabold tracking-tighter font-manrope",
                    stat.label === 'Kritik stok' && stat.value > 0 ? 'text-rose-500' : 'text-foreground'
                )}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-2xl overflow-hidden border-none">
        <StockListTable products={products} categories={categories} />
      </div>
    </div>
  );
}
