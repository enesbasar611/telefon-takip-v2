"use client";

import { useEffect, useState, useRef } from "react";
import { ClipboardList, CheckCircle2, PackagePlus, Loader2, Printer, XCircle, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getShortageItems, approveShortageItem, deleteShortageItem, addShortageItem } from "@/lib/actions/shortage-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StockReceiptModal } from "./stock-receipt-modal";

export function ShortageList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Search states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getShortageItems();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (newName.length >= 2) {
        setIsSearching(true);
        const results = await searchProducts(newName);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [newName]);

  const handleApprove = async (id: string, qty: number) => {
    try {
      const res = await approveShortageItem(id, qty);
      if (res.success) {
        setItems(items.filter(i => i.id !== id));
        toast.success("Stok başarıyla güncellendi", { position: "bottom-right" });
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteShortageItem(id);
      if (res.success) {
        setItems(items.filter(i => i.id !== id));
        toast.success("Listeden kaldırıldı", { position: "bottom-right" });
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    }
  };

  const handleManualAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await addShortageItem({ name: newName, quantity: 1 });
      if (res.success) {
        setNewName("");
        setShowResults(false);
        fetchItems();
        toast.success("Eksik listesine eklendi.");
      } else {
        toast.error(res.error || "Ekleme başarısız.");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    } finally {
      setAdding(false);
    }
  };

  const handleSelectProduct = async (product: any) => {
    setAdding(true);
    try {
      const res = await addShortageItem({
        productId: product.id,
        name: product.name,
        quantity: 1
      });
      if (res.success) {
        setNewName("");
        setShowResults(false);
        fetchItems();
        toast.success(`${product.name} eksik listesine eklendi.`);
      } else {
        toast.error(res.error || "Ekleme başarısız.");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    } finally {
      setAdding(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-slate-900/40 border border-border/10 text-slate-500 hover:text-blue-500 transition-all">
            <ClipboardList className={cn("h-5 w-5", items.length > 0 && "text-red-600 fill-red-600/10")} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#020617] animate-pulse">
                {items.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 bg-card border-2 border-red-600 p-4 shadow-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-blue-500">Eksikler Listesi</h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
              {items.length} ÜRÜN
            </span>
          </div>

          <div className="relative mb-4" ref={searchRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Eksik ürün yaz..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onFocus={() => newName.length >= 2 && setShowResults(true)}
                  className="h-8 bg-white/[0.03] border-white/5 text-[10px] rounded-lg pl-8"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                {isSearching && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
              <Button
                onClick={handleManualAdd}
                size="icon"
                disabled={adding || !newName.trim()}
                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-black shrink-0 rounded-lg"
                title="Manuel Ekle"
              >
                <PackagePlus className="h-4 w-4" />
              </Button>
            </div>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left border-b border-white/[0.03] last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-400">{p.name}</span>
                        <span className="text-[8px] text-gray-500 font-bold">{p.sku || 'SKU YOK'}</span>
                      </div>
                      <div className="flex flex-col items-end bg-slate-900/50 px-3 py-1 rounded-lg border border-white/5">
                        <span className={cn("text-[10px] font-bold", p.stock <= 0 ? "text-rose-500" : "text-emerald-500")}>
                          {p.stock}
                        </span>
                        <span className="text-[7px] text-gray-600 font-bold">ADET</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[10px] text-gray-500">
                    Ürün bulunamadı.
                  </div>
                )}
                <button
                  onClick={handleManualAdd}
                  className="w-full p-2 bg-blue-500/5 text-blue-400 text-[9px] font-bold hover:bg-blue-500/10 transition-colors"
                >
                  "+ ${newName}" OLARAK MANUEL EKLE
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-600" /></div>
            ) : items.length === 0 ? (
              <p className="text-[10px] text-center text-gray-600 py-4">Şu an eksik ürün bulunmuyor.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-red-500/20 transition-all">
                  <div className="flex flex-col flex-1 mr-2 overflow-hidden">
                    <span className="text-[10px] font-bold text-gray-300 leading-tight mb-1 truncate">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={item.quantity || 1}
                        id={`qty-${item.id}`}
                        className="h-6 w-12 bg-slate-900 border-white/5 text-[9px] px-1 text-center font-bold text-blue-500"
                      />
                      <span className="text-[8px] text-gray-600 font-bold">ADET</span>
                      {item.product && (
                        <span className={cn("text-[8px] font-bold ml-auto", item.product.stock <= 0 ? "text-rose-500" : "text-emerald-500")}>
                          STOK: {item.product.stock}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => {
                        const qtyInput = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                        handleApprove(item.id, parseInt(qtyInput.value) || 1);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <>
              <Separator className="my-4 bg-white/5" />
              <Button
                onClick={handlePrint}
                className="w-full bg-blue-500 hover:bg-blue-600 text-black font-bold text-[10px] h-10 rounded-xl"
              >
                <Printer className="h-4 w-4 mr-2" /> LİSTEYİ YAZDIR
              </Button>
            </>
          )}
        </PopoverContent>
      </Popover>

      <StockReceiptModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        items={items}
      />
    </>
  );
}
