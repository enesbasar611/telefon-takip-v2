import { POSInterface } from "@/components/pos/pos-interface";
import { getProducts } from "@/lib/actions/product-actions";
import { getCustomers } from "@/lib/actions/customer-actions";
import { ShoppingCart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const products = await getProducts();
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hızlı Satış (POS)</h1>
          <p className="text-muted-foreground">Ürün seçin, sepeti oluşturun ve hızlıca tahsilat yapın.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full font-bold text-xs uppercase tracking-wider">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Kasa Açık (Online)
        </div>
      </div>

      <POSInterface products={products} customers={customers} />
    </div>
  );
}
