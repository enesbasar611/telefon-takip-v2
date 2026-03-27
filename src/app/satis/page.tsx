import { POSInterface } from "@/components/pos/pos-interface";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { getCustomers } from "@/lib/actions/customer-actions";
import { ShoppingCart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const products = await getProducts();
  const customers = await getCustomers();
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6 pb-12 bg-background text-foreground min-h-screen lg:p-10 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[1.25rem] bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-md shadow-secondary/5">
                <ShoppingCart className="h-6 w-6 text-secondary" />
            </div>
            <div>
                <h1 className="text-3xl font-extrabold tracking-tighter text-foreground font-manrope uppercase">Hızlı satış (POS)</h1>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Anlık perakende satış ve sepet yönetimi</p>
            </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/5 text-secondary border border-secondary/10 rounded-xl font-bold text-[10px] shadow-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
          Sistem Online
        </div>
      </div>

      <div className="bg-card shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-[2rem] overflow-hidden border-none p-1">
        <POSInterface products={products} customers={customers} categories={categories} />
      </div>
    </div>
  );
}
