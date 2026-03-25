import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertCircle, Barcode as BarcodeIcon, Layers, TrendingUp } from "lucide-react";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { StockListTable } from "@/components/product/stock-list-table";

export const dynamic = 'force-dynamic';

export default async function StokPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-blue-sm" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Envanter Sistemi</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">STOK <span className="text-blue-500">YÖNETİMİ</span></h1>
          <p className="text-sm text-slate-500 font-medium max-w-md mt-1">Yedek parça, aksesuar ve cihaz envanterini profesyonel düzeyde takip edin.</p>
        </div>
        <div className="flex items-center gap-3">
             <CreateProductModal categories={categories} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "TOPLAM ÜRÜN", value: products.length, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "KRİTİK STOK", value: products.filter((p: any) => p.stock <= p.criticalStock).length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "KATEGORİ", value: categories.length, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "BARKODLU", value: products.filter((p: any) => p.barcode).length, icon: BarcodeIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" }
        ].map((stat, i) => (
          <Card key={i} className="matte-card border-slate-800/50 shadow-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-800" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${stat.label === 'KRİTİK STOK' && stat.value > 0 ? 'text-rose-500' : 'text-white'}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="matte-card border-slate-800/50 rounded-[2.5rem] overflow-hidden">
        <StockListTable products={products} categories={categories} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .matte-card {
            background: rgba(15, 23, 42, 0.4) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
      `}} />
    </div>
  );
}
