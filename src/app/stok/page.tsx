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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/20 ">
                <Package className="h-7 w-7 text-blue-500" />
            </div>
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight">Envanter yönetimi</h1>
                <p className="text-xs text-muted-foreground font-medium mt-1">Yedek parça, aksesuar ve cihaz envanter takibi</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
             <CreateProductModal categories={categories} />
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam ürün", value: products.length, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Kritik stok", value: products.filter((p: any) => p.stock <= p.criticalStock).length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "Kategori sayısı", value: categories.length, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Barkodlu ürünler", value: products.filter((p: any) => p.barcode).length, icon: BarcodeIcon, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
        ].map((stat, i) => (
          <Card key={i} className="rounded-[2rem] border-border shadow-sm bg-card transition-all hover:translate-y-[-4px]">
            <CardContent className="p-10 flex flex-col justify-between min-h-[180px]">
              <div className="flex items-center justify-between">
                <div className={cn("p-4 rounded-[1.25rem] border", stat.bg, stat.border)}>
                  <stat.icon className={cn("h-7 w-7", stat.color)} />
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground/20" />
              </div>
              <div className="mt-8">
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <p className={cn(
                    "text-4xl font-extrabold tracking-tight",
                    stat.label === 'Kritik stok' && stat.value > 0 ? 'text-rose-500' : 'text-foreground'
                )}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <StockListTable products={products} categories={categories} />
      </div>
    </div>
  );
}
