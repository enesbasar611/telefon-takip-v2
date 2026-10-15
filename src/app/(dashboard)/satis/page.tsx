import { POSInterface } from "@/components/pos/pos-interface";
import { ShoppingCart, WifiOff, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hızlı Satış / POS | Başar Teknik",
  description: "Anlık perakende satış, barkodlu okutma ve kassa yönetimi.",
};

export const dynamic = 'force-dynamic';

function POSData({ searchParams }: { searchParams: { saleId?: string } }) {
  let dbError = false;

  return (
    <>
      <PageHeader
        className="hidden md:flex"
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

      <div className="w-full sm:bg-white/[0.03] sm:dark:bg-black/20 sm:backdrop-blur-3xl sm:shadow-2xl sm:rounded-[2rem] overflow-hidden sm:border sm:border-border/40 sm:p-1">
        <POSInterface
          initialSaleId={searchParams?.saleId}
        />
      </div>
    </>
  );
}

export default function POSPage({ searchParams }: { searchParams: { saleId?: string } }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-10 pb-4 sm:pb-12 animate-in fade-in duration-500">
      <POSData searchParams={searchParams} />
    </div>
  );
}




