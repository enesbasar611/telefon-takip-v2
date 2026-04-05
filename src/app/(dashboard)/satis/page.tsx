import { POSInterface } from "@/components/pos/pos-interface";
import { getPOSInitialData } from "@/lib/actions/product-actions";
import { getSaleById } from "@/lib/actions/sale-actions";
import { ShoppingCart, WifiOff } from "lucide-react";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function POSPage({ searchParams }: { searchParams: { saleId?: string } }) {
  // Graceful fallback: DB down olsa bile sayfa yüklenir
  let products: any[] = [];
  let customers: any[] = [];
  let categories: any[] = [];
  let initialSale: any = null;
  let dbError = false;

  try {
    const data = await getPOSInitialData();
    products = data.products;
    customers = data.customers;
    categories = data.categories;

    if (searchParams.saleId) {
      initialSale = await getSaleById(searchParams.saleId);
    }
  } catch (err) {
    console.error("POS page: DB connection failed, loading with empty data.", err);
    dbError = true;
  }

  return (
    <div className="flex flex-col gap-6 pb-12 bg-background text-foreground min-h-screen lg:p-10 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[1.25rem] bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-md shadow-secondary/5">
            <ShoppingCart className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="font-medium text-3xl font-extrabold text-foreground font-manrope">Hızlı satış (POS)</h1>
            <p className="text-[11px] text-slate-500  mt-0.5">Anlık perakende satış ve sepet yönetimi</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 border rounded-xl  text-[10px] shadow-sm ${dbError
          ? "bg-rose-500/5 text-rose-500 border-rose-500/20"
          : "bg-secondary/5 text-secondary border-secondary/10"
          }`}>
          <div className={`h-2.5 w-2.5 rounded-full ${dbError ? "bg-rose-500" : "bg-secondary animate-pulse"}`} />
          {dbError ? "Veritabanı Bağlantısı Yok" : "Sistem Online"}
        </div>
      </div>

      {dbError && (
        <div className="flex items-center gap-4 px-6 py-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-500">
          <WifiOff className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm ">Veritabanına Bağlanamıyor</p>
            <p className="text-[11px] font-medium opacity-70 mt-0.5">Neon DB uykuda olabilir. Neon konsolundan projeyi uyandırın veya birkaç saniye bekleyip sayfayı yenileyin.</p>
          </div>
        </div>
      )}

      <div className="bg-card shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-[2rem] overflow-hidden border-none p-1">
        <POSInterface
          products={products}
          customers={customers}
          categories={categories}
          initialSale={initialSale}
        />
      </div>
    </div>
  );
}




