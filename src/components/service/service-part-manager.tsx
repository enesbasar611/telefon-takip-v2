"use client";

import { useState, useTransition } from "react";
import { Plus, Package, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addPartToService, removePartFromService } from "@/lib/actions/service-actions";
import { toast } from "sonner";

export function ServicePartManager({ ticketId, products, currentParts }: { ticketId: string; products: any[]; currentParts: any[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleAdd = () => {
    if (!selectedProductId) return;
    startTransition(async () => {
      const res = await addPartToService(ticketId, selectedProductId, Number(quantity));
      if (res.success) {
        toast.success("Parça eklendi.");
        setOpen(false);
        setSelectedProductId("");
        setQuantity("1");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRemove = (partId: string) => {
    startTransition(async () => {
      const res = await removePartFromService(partId);
      if (res.success) {
        toast.success("Parça çıkarıldı.");
      } else {
        toast.error(res.error);
      }
    });
  };

  const totalPartsCost = currentParts.reduce((acc, part) => acc + (Number(part.unitPrice) * part.quantity), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-muted-foreground">Kullanılan Parçalar</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 px-3">
              <Plus className="h-3 w-3 mr-1" /> Parça Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/5 text-white">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Servise Parça Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Ürün Seçin</label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="bg-white/[0.03] border-white/5 rounded-xl h-12">
                    <SelectValue placeholder="Envanterden ürün seçin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/5 text-white">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-bold py-3">
                        {p.name} (Stok: {p.stock}) - ₺{Number(p.sellPrice).toLocaleString('tr-TR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Adet</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white/[0.03] border-white/5 rounded-xl h-12"
                />
              </div>
              <Button onClick={handleAdd} disabled={isPending || !selectedProductId} className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 rounded-xl mt-4">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {currentParts.map((part) => (
          <div key={part.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                  <Package className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-foreground">{part.product.name}</span>
                  <span className="text-[9px] text-gray-600 font-bold">{part.quantity} ADET • ₺{Number(part.unitPrice).toLocaleString('tr-TR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-blue-500">₺{(Number(part.unitPrice) * part.quantity).toLocaleString('tr-TR')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(part.id)}
                  disabled={isPending}
                  className="h-6 w-6 rounded-md hover:bg-rose-500/10 hover:text-rose-500 text-gray-600"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Margin Indicator */}
            <div className="mt-1 pt-2 border-t border-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-muted-foreground">Kar Analizi</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground">Maliyet: ₺{Number(part.costPrice).toLocaleString('tr-TR')}</span>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                  Önerilen Min: ₺{(Number(part.costPrice) * 1.5).toLocaleString('tr-TR')}
                </Badge>
              </div>
            </div>
          </div>
        ))}
        {currentParts.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-600">Henüz parça eklenmedi.</p>
          </div>
        )}
      </div>

      {currentParts.length > 0 && (
        <div className="pt-2 flex justify-between items-center border-t border-white/5">
          <span className="text-xs font-bold text-muted-foreground">TOPLAM PARÇA MALİYETİ</span>
          <span className="text-sm font-bold text-foreground">₺{totalPartsCost.toLocaleString('tr-TR')}</span>
        </div>
      )}
    </div>
  );
}
