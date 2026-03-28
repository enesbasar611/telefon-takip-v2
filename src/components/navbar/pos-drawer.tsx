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
import { POSCompact } from "@/components/pos/pos-compact";
import { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { getCustomers } from "@/lib/actions/customer-actions";
import { X } from "lucide-react";

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
          className="hidden md:flex gap-2 text-[11px] font-black text-muted-foreground bg-muted/20 border border-border/50 rounded-full px-5 hover:bg-primary/10 hover:text-primary hover:border-primary/20 shadow-none transition-all group uppercase tracking-widest"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span>Hızlı Satış</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[500px] bg-[#0F172A] border-slate-700/50 p-0 overflow-hidden shadow-2xl">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-slate-700/30">
            <div className="flex flex-col">
              <SheetTitle className="text-2xl font-black text-white tracking-tight leading-none uppercase">Quick Sales</SheetTitle>
              <SheetDescription className="text-slate-400 font-bold text-[11px] mt-1.5 uppercase tracking-widest leading-none">
                Frequent Items & Cart
              </SheetDescription>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-black animate-pulse uppercase tracking-widest">
                Veriler Yükleniyor...
              </div>
            ) : (
              <div className="h-full">
                <POSCompact products={products} customers={customers} categories={categories} />
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
