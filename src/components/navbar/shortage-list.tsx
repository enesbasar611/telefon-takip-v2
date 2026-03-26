"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, PackagePlus, Loader2, Printer, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getShortageItems, approveShortageItem, deleteShortageItem, addShortageItem } from "@/lib/actions/shortage-actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function ShortageList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

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
  }, []);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addShortageItem({ name: newName, quantity: 1 });
      setNewName("");
      fetchItems();
      toast.success("Eksik listesine eklendi.");
    } catch (error) {
      toast.error("Ekleme başarısız.");
    } finally {
      setAdding(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Eksikler Listesi</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: ; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-size: 12px; }
            td { font-size: 14px; font-weight: bold; }
            .date { font-size: 10px; color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>Eksikler Listesi / Tedarik Formu</h1>
          <p class="date">Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
          <table>
            <thead>
              <tr>
                <th>ÜRÜN ADI</th>
                <th>SKU / KOD</th>
                <th>ADET</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.product?.sku || '-'}</td>
                  <td>1</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top: 40px; font-size: 10px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">Takip V2 - Mobil Servis & ERP tarafından otomatik oluşturulmuştur.</p>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-slate-900/40 border border-slate-800/50 text-slate-500 hover:text-blue-500 transition-all">
          <ClipboardList className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-[#020617] animate-pulse">
              {items.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-[#141416] border-2 border-red-600 p-4 shadow-none animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black   text-blue-500">Eksikler Listesi</h3>
          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
            {items.length} ÜRÜN
          </span>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <Input
            placeholder="Eksik ürün yaz..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 bg-white/[0.03] border-white/5 text-[10px] rounded-lg"
          />
          <Button type="submit" size="icon" disabled={adding} className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-black shrink-0 rounded-lg">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
          </Button>
        </form>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-600" /></div>
          ) : items.length === 0 ? (
            <p className="text-[10px] text-center text-gray-600 py-4 italic">Şu an eksik ürün bulunmuyor.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-red-500/20 transition-all">
                <div className="flex flex-col flex-1 mr-2">
                  <span className="text-[10px] font-bold text-gray-300  leading-tight mb-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={item.quantity || 1}
                      id={`qty-${item.id}`}
                      className="h-6 w-12 bg-slate-900 border-white/5 text-[9px] px-1 text-center font-black text-blue-500"
                    />
                    <span className="text-[8px] text-gray-600 font-black ">ADET</span>
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
                className="w-full bg-blue-500 hover:bg-blue-600 text-black font-black  text-[10px]  h-10 rounded-xl"
            >
                <Printer className="h-4 w-4 mr-2" /> LİSTEYİ YAZDIR
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
