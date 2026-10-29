import { POSInterface } from "@/components/pos/pos-interface";
import { WifiOff } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hızlı Satış / POS | Başar Teknik",
  description: "Anlık perakende satış, barkodlu okutma ve kasa yönetimi.",
};

export const dynamic = 'force-dynamic';

function POSData({ searchParams }: { searchParams: { saleId?: string } }) {
  let dbError = false;

  return (
    <>
      {dbError && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-500 mb-2 shrink-0">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold">Veritabanına Bağlanamıyor</p>
            <p className="text-[10px] font-medium opacity-80 mt-0.5">Neon DB uykuda olabilir. Neon konsolundan projeyi uyandırın veya sayfayı yenileyin.</p>
          </div>
        </div>
      )}

      <div className="w-full flex-1 min-h-0 flex flex-col">
        <POSInterface
          initialSaleId={searchParams?.saleId}
        />
      </div>
    </>
  );
}

export default function POSPage({ searchParams }: { searchParams: { saleId?: string } }) {
  return (
    <div data-pos-root="true" className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-200">
      <POSData searchParams={searchParams} />
    </div>
  );
}
