import { POSInterface } from "@/components/pos/pos-interface";
import { getPOSInitialData } from "@/lib/actions/product-actions";
import { getSaleById } from "@/lib/actions/sale-actions";
import { ShoppingCart, WifiOff, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = 'force-dynamic';

async function POSData({ searchParams }: { searchParams: { saleId?: string } }) {
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

    if (searchParams?.saleId) {
      initialSale = await getSaleById(searchParams.saleId);
    }
  } catch (err) {
    console.error("POS page: DB connection failed, loading with empty data.", err);
    dbError = true;
  }

  return (
    <>
      <PageHeader
        title="Hızlı Satış (POS)"
        description="Anlık perakende satış ve sepet yönetimi."
        icon={ShoppingCart}
        badge={
          <div className={`flex items-center gap-3 px-4 py-1.5 border rounded-full text-[10px] uppercase font-bold tracking-widest ${dbError
            ? "bg-rose-500/5 text-rose-500 border-rose-500/20"
            : "bg-emerald-500/5 text-emerald-500 border-emerald-500/10"
            }`}>
            <div className={`h-2.5 w-2.5 rounded-full ${dbError ? "bg-rose-500" : "bg-emerald-500"}`} />
            {dbError ? "Bağlantı Sorunu" : "Sistem Online"}
          </div>
        }
      />

      {dbError && (
        <div className="flex items-center gap-4 px-6 py-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-500 mb-6">
          <WifiOff className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Veritabanına Bağlanamıyor</p>
            <p className="text-[11px] font-medium opacity-70 mt-0.5">Neon DB uykuda olabilir. Neon konsolundan projeyi uyandırın veya birkaç saniye bekleyip sayfayı yenileyin.</p>
          </div>
        </div>
      )}

      <div className="bg-white/[0.03] dark:bg-black/20 backdrop-blur-3xl shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-[2rem] overflow-hidden border border-border/40 p-1">
        <POSInterface
          products={products}
          customers={customers}
          categories={categories}
          initialSale={initialSale}
        />
      </div>
    </>
  );
}

function POSLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="h-[600px] w-full bg-muted/20 animate-pulse rounded-[2rem] border border-border/40 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    </div>
  );
}

export default function POSPage({ searchParams }: { searchParams: { saleId?: string } }) {
  return (
    <div className="flex flex-col gap-10 pb-12 animate-in fade-in duration-500">
      <Suspense fallback={<POSLoading />}>
        <POSData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}




