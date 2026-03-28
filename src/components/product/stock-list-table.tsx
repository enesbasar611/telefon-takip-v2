"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  Plus,
  Download,
  Edit,
  Trash2,
  ClipboardList,
  MoreVertical,
  ShoppingCart,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RevealFinancial } from "@/components/ui/reveal-financial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { quickSellProduct } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { ProductDetailDrawer } from "./product-detail-drawer";
import { EditProductModal } from "./edit-product-modal";

export function StockListTable({ products, categories }: { products: any[], categories: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchTerm));

      const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleExport = () => {
    const headers = ["Ürün Adı", "SKU", "Barkod", "Kategori", "Stok", "Alış", "Satış"];
    const csvData = filteredProducts.map(p => [
      p.name,
      p.sku || "-",
      p.barcode || "-",
      p.category.name,
      p.stock,
      p.buyPrice,
      p.sellPrice
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stok_listesi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dışa aktarma başarılı.");
  };

  const onAddToShortage = async (product: any) => {
    try {
      await addShortageItem({ productId: product.id, name: product.name, quantity: 1 });
      toast.success(`${product.name} eksikler listesine eklendi.`);
    } catch (error) {
      toast.error("İşlem başarısız.");
    }
  };

  const onQuickSell = async (product: any) => {
    if (product.stock <= 0) {
      toast.error("Stokta ürün bulunmuyor.");
      return;
    }

    const confirm = window.confirm(`${product.name} için 1 adet hızlı satış yapılacak. Onaylıyor musunuz?`);
    if (!confirm) return;

    try {
      const res = await quickSellProduct(product.id, 1);
      if (res.success) {
        toast.success("Hızlı satış işlemi tamamlandı.");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Satış işlemi sırasında bir hata oluştu.");
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 p-6 border-b border-border/10/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Ürün adı, SKU veya barkod ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900/60 border-border/10 rounded-xl text-xs font-bold text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-400 bg-slate-900/40 border border-border/10/50 rounded-xl hover:bg-slate-800 hover:text-white">
                <Filter className="h-3.5 w-3.5 mr-2 text-blue-500" />
                {selectedCategory === "ALL" ? "TÜM KATEGORİLER" : categories.find(c => c.id === selectedCategory)?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-white/5 text-white">
              <DropdownMenuItem onClick={() => setSelectedCategory("ALL")} className="text-[10px] font-bold p-3 cursor-pointer">TÜM KATEGORİLER</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              {categories.map(cat => (
                <DropdownMenuItem key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="text-[10px] font-bold p-3 cursor-pointer">{cat.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleExport} variant="ghost" size="sm" className="text-[10px] font-bold text-slate-400 bg-slate-900/40 border border-border/10/50 rounded-xl hover:bg-slate-800 hover:text-white">
            <Download className="h-3.5 w-3.5 mr-2 text-emerald-500" /> DIŞA AKTAR
          </Button>
        </div>
      </div>

      <div className="p-0">
        <div className="block lg:hidden space-y-4 p-4">
          {filteredProducts.length === 0 ? (
            <p className="text-center py-10 text-slate-500 font-bold">Ürün bulunamadı.</p>
          ) : (
            filteredProducts.map((product: any) => (
              <div key={product.id} className="matte-card p-5 rounded-2xl border-border/10/50 space-y-4" onClick={() => handleProductClick(product)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm leading-tight">{product.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">SKU: {product.sku || '-'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="bg-slate-900 border-border/10 text-[8px] font-bold text-slate-500 px-2 py-0.5">
                      {product.category.name}
                    </Badge>
                    {product.location && (
                      <Badge variant="outline" className="bg-blue-500/5 border-blue-500/10 text-[8px] font-bold text-blue-500 px-2 py-0.5">
                        {product.location}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-border/10/50">
                    <p className="text-[8px] font-bold text-slate-600 mb-1">STOK DURUMU</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${product.stock <= product.criticalStock ? 'text-rose-500' : 'text-white'}`}>{product.stock}</span>
                      <span className="text-[8px] text-slate-600 font-bold">ADET</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-border/10/50 text-right">
                    <p className="text-[8px] font-bold text-slate-600 mb-1">SATIŞ FİYATI</p>
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm font-bold text-blue-500">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/10/50">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-slate-600 font-bold">MALİYET:</span>
                    <RevealFinancial amount={product.buyPrice} className="text-[10px] text-slate-400 font-bold" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => onAddToShortage(product)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-blue-500/5 text-blue-500 border border-blue-500/10">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-900 border border-border/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-white/5 text-white w-48">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSell(product); }} className="text-[10px] font-bold p-3 gap-3 cursor-pointer focus:bg-white/5">
                          <ShoppingCart className="h-4 w-4 text-emerald-500" /> HIZLI SATIŞ
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="text-[10px] font-bold p-3 gap-3 cursor-pointer focus:bg-white/5">
                          <Edit className="h-4 w-4 text-blue-500" /> DÜZENLE
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold p-3 gap-3 text-rose-500 cursor-pointer focus:bg-rose-500/10">
                          <Trash2 className="h-4 w-4" /> SİL
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Table className="hidden lg:table">
          <TableHeader className="bg-slate-900/40">
            <TableRow className="border-border/10/50 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold text-slate-500 py-4 pl-8">ÜRÜN BİLGİSİ</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 py-4">KATEGORİ / KONUM</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 py-4 text-center">STOK DURUMU</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 py-4 text-right">FİYATLANDIRMA</TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 py-4 text-right pr-8">İŞLEMLER</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-slate-600">Ürün bulunamadı.</TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product: any) => (
                <TableRow key={product.id} className="border-border/10/50 hover:bg-slate-900/30 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">{product.name}</span>
                      <span className="text-[9px] text-slate-600 font-bold mt-0.5">SKU: {product.sku || 'BELİRTİLMEDİ'}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => handleProductClick(product)} className="cursor-pointer">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="bg-slate-900 border-border/10 text-[9px] font-bold text-slate-500 py-1 px-3 rounded-xl w-fit">
                        {product.category.name}
                      </Badge>
                      {product.location && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{product.location}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${product.stock <= product.criticalStock ? 'text-rose-500' : 'text-white'}`}>{product.stock}</span>
                        <span className="text-[9px] text-slate-600 font-bold">ADET</span>
                      </div>
                      <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${product.stock <= product.criticalStock ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%` }}
                        />
                      </div>
                      {product.stock <= product.criticalStock && (
                        <span className="text-[8px] font-bold text-rose-500 animate-pulse">
                          {product.stock === 0 ? 'STOK TÜKENDİ' : 'KRİTİK SEVİYE'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-slate-600 font-bold">Maliyet:</span>
                        <RevealFinancial amount={product.buyPrice} className="text-[9px] text-slate-500 font-bold" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => onAddToShortage(product)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-blue-500/5 text-blue-500 border border-blue-500/10 hover:bg-blue-500/20 hover:text-blue-400 transition-all" title="Eksik Listesine Ekle">
                        <Plus className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-slate-900 border border-border/10 text-slate-500 hover:text-white transition-all">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-white/5 text-white w-48">
                          <DropdownMenuLabel className="text-[10px] font-bold text-slate-500 p-3">Ürün İşlemleri</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSell(product); }} className="text-[10px] font-bold p-3 gap-3 cursor-pointer focus:bg-white/5">
                            <ShoppingCart className="h-4 w-4 text-emerald-500" /> HIZLI SATIŞ YAP
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="text-[10px] font-bold p-3 gap-3 cursor-pointer focus:bg-white/5">
                            <Edit className="h-4 w-4 text-blue-500" /> ÜRÜNÜ DÜZENLE
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[10px] font-bold p-3 gap-3 cursor-pointer focus:bg-white/5">
                            <ClipboardList className="h-4 w-4 text-orange-500" /> HAREKET GEÇMİŞİ
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem className="text-[10px] font-bold p-3 gap-3 cursor-pointer text-rose-500 focus:bg-rose-500/10">
                            <Trash2 className="h-4 w-4" /> ÜRÜNÜ SİL
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDetailDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <EditProductModal
        product={selectedProduct}
        categories={categories}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
