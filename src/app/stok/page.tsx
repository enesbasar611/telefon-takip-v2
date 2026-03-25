import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle, Barcode as BarcodeIcon, Layers, TrendingUp, Search, Filter, MoreHorizontal, ArrowUpRight, Plus } from "lucide-react";
import { getProducts, getCategories } from "@/lib/actions/product-actions";
import { CreateProductModal } from "@/components/product/create-product-modal";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export default async function StokPage() {
  const products = await getProducts();
  const categories = await getCategories();

  const handleAddToShortage = async (formData: FormData) => {
    "use server";
    const productId = formData.get("productId") as string;
    const name = formData.get("name") as string;
    await addShortageItem({ productId, name, quantity: 1 });
    revalidatePath("/stok");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80">Envanter Sistemi</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Stok Yönetimi</h1>
          <p className="text-sm text-gray-500 font-medium max-w-md mt-1">Yedek parça, aksesuar ve cihaz envanterini profesyonel düzeyde takip edin.</p>
        </div>
        <div className="flex items-center gap-3">
             <CreateProductModal categories={categories} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "TOPLAM ÜRÜN", value: products.length, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "KRİTİK STOK", value: products.filter((p: any) => p.stock <= 2).length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "KATEGORİ", value: categories.length, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "BARKODLU", value: products.filter((p: any) => p.barcode).length, icon: BarcodeIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" }
        ].map((stat, i) => (
          <Card key={i} className="bg-[#151921] border-white/5 whisper-border shadow-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-gray-800" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${stat.label === 'KRİTİK STOK' && stat.value > 0 ? 'text-rose-500' : 'text-white'}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#151921] border-white/5 whisper-border shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
             <Input
               placeholder="Ürün adı, SKU veya barkod ara..."
               className="pl-10 bg-[#0e1116] border-white/5 rounded-xl text-xs font-bold"
             />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5">
                <Filter className="h-3.5 w-3.5 mr-2" /> FİLTRELE
            </Button>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5">
                DIŞA AKTAR
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4 pl-6">ÜRÜN BİLGİSİ</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">KATEGORİ</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">STOK DURUMU</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4">FİYATLANDIRMA</TableHead>
                <TableHead className="text-[10px] font-black text-gray-500 uppercase tracking-widest py-4 text-right">AKSİYON</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-gray-600 uppercase tracking-widest italic">Ürün bulunamadı.</TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => (
                  <TableRow key={product.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white group-hover:text-blue-500 transition-colors uppercase tracking-tight">{product.name}</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">SKU: {product.sku || 'BELİRTİLMEDİ'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/[0.03] border-white/5 text-[10px] font-black text-gray-400 py-0.5 px-3 rounded-lg uppercase tracking-widest">
                        {product.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                           <span className={`text-sm font-black ${product.stock <= 2 ? 'text-rose-500' : 'text-white'}`}>{product.stock}</span>
                           <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">ADET</span>
                        </div>
                        <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                           <div
                             className={`h-full rounded-full ${product.stock <= 2 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`}
                             style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%` }}
                           />
                        </div>
                        {product.stock <= 2 && (
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                            {product.stock === 0 ? 'STOK TÜKENDİ' : 'KRİTİK SEVİYE'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                         <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white italic">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                         </div>
                         <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Maliyet:</span>
                            <RevealFinancial amount={product.buyPrice} className="text-[9px] text-gray-500 font-bold" />
                         </div>
                         <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Kâr:</span>
                            <RevealFinancial amount={Number(product.sellPrice) - Number(product.buyPrice)} className="text-[9px] text-emerald-600 font-black" />
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <div className="flex items-center justify-end gap-2">
                         <form action={handleAddToShortage}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="name" value={product.name} />
                            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-blue-500/5 text-blue-500 border border-blue-500/10 hover:bg-blue-500/20 hover:text-blue-400 transition-all shadow-blue-sm" title="Eksik Listesine Ekle">
                                <Plus className="h-4 w-4" />
                            </Button>
                         </form>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 text-gray-600 hover:text-white">
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
