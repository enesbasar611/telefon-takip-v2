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

interface POSDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function POSDrawer({ open: controlledOpen, onOpenChange: controlledOnOpenChange, trigger }: POSDrawerProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, c, cats] = await Promise.all([getProducts(), getCustomers(), getCategories()]);
      setProducts(pData?.products || []);
      setCustomers(c || []);
      setCategories(cats || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && !isControlled) {
          fetchData();
        }
      }}
    >
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : !isControlled ? (
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
      ) : null}
      <SheetContent side="right" className="w-full sm:max-w-[500px] bg-background border-l border-border/40 p-0 overflow-hidden shadow-2xl">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border/40 text-left space-y-0">
            <div className="flex items-center gap-3 pr-8 text-left">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col text-left items-start min-w-0">
                <SheetTitle className="text-base sm:text-lg text-foreground font-bold tracking-tight text-left leading-tight">
                  Hızlı Satış
                </SheetTitle>
                <SheetDescription className="text-muted-foreground font-normal text-[11px] sm:text-xs text-left truncate max-w-full mt-0.5">
                  Sık kullanılan ürünler ve hızlı sepet yönetimi
                </SheetDescription>
              </div>
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



