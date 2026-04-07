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
          className="hidden md:flex gap-2 text-sm  text-muted-foreground bg-muted/20 border border-border/50 rounded-xl px-5 hover:bg-primary/10 hover:text-primary hover:border-primary/20 shadow-none transition-all group"
        >
          <ShoppingCart className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          <span>Hızlı Satış</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[500px] bg-[#0F172A] border-border/80/50 p-0 overflow-hidden shadow-2xl">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-border/80/30">
            <div className="flex flex-col">
              <SheetTitle className="text-2xl  text-foreground leading-none">Hızlı Satış</SheetTitle>
              <SheetDescription className="text-muted-foreground font-medium text-xs mt-1.5">
                Sık kullanılan ürünler ve sepet yönetimi
              </SheetDescription>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-hidden relative">
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/80  animate-pulse">
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



