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
    <div className="flex flex-col gap-10 pb-20 bg-background text-foreground min-h-screen lg:p-14 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
        <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-lg shadow-secondary/5">
                <ShoppingCart className="h-8 w-8 text-secondary" />
            </div>
            <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-foreground font-manrope">Hızlı satış (POS)</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Anlık perakende satış ve sepet yönetimi</p>
            </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-secondary/5 text-secondary border border-secondary/10 rounded-2xl font-bold text-xs shadow-sm">
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
