"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { POSInterface } from "@/components/pos/pos-interface";
import { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { getCustomers } from "@/lib/actions/customer-actions";

export function POSDrawer() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [p, c, cats] = await Promise.all([getProducts(), getCustomers(), getCategories()]);
      setProducts(p);
      setCustomers(c);
      setCategories(cats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet onOpenChange={(open) => open && fetchData()}>
      <SheetTrigger asChild>
        <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex gap-2 text-xs font-bold text-gray-400 bg-white/[0.02] border border-white/5 rounded-xl px-4 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 shadow-none transition-all group"
        >
          <ShoppingCart className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
          <span>Hızlı Satış</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[850px] bg-background border-border/10 p-0 overflow-hidden">
        <div className="p-10 h-full flex flex-col">
          <SheetHeader className="mb-10">
            <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                    <ShoppingCart className="h-6 w-6 text-blue-500" />
                </div>
                <SheetTitle className="text-3xl font-black   text-white italic">HIZLI <span className="text-blue-500">SATIŞ</span></SheetTitle>
            </div>
            <SheetDescription className="text-slate-500 font-bold  text-[10px] ">
              Orgelux POS Terminali v2.0 — Anlık Stok ve Finans Entegrasyonu
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {loading ? (
                <div className="h-full flex items-center justify-center text-gray-600 font-black   animate-pulse">
                    Veriler Yükleniyor...
                </div>
            ) : (
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                   <POSInterface products={products} customers={customers} categories={categories} />
                </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
