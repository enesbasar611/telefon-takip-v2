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
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";


export function StockListTable({ products, categories }: { products: any[], categories: any[] }) {
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("highlight");

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
        (p.barcode && p.barcode.includes(searchTerm)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const { sortedData, sortField, sortOrder, toggleSort } = useTableSort(filteredProducts, "name", "asc");

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:p-6 border-b border-white/5 bg-transparent">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Ürün adı, SKU veya barkod ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/[0.02] border-white/5 rounded-xl text-[13px] font-medium text-white h-10 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 text-[12px] font-medium text-slate-300 bg-white/[0.02] border-white/5 rounded-xl hover:bg-white/5 hover:text-white transition-colors">
                <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
                {selectedCategory === "ALL" ? "Tüm Kategoriler" : categories.find(c => c.id === selectedCategory)?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/5 text-white shadow-xl shadow-black/50 min-w-[200px]">
              <DropdownMenuItem onClick={() => setSelectedCategory("ALL")} className="text-[12px] font-medium p-2.5 cursor-pointer focus:bg-white/5">Tüm Kategoriler</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              {categories.map(cat => (
                <DropdownMenuItem key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="text-[12px] font-medium p-2.5 cursor-pointer focus:bg-white/5">{cat.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleExport} variant="outline" className="h-10 px-4 text-[12px] font-medium text-slate-300 bg-white/[0.02] border-white/5 rounded-xl hover:bg-white/5 hover:text-white transition-colors">
            <Download className="h-3.5 w-3.5 mr-2 text-slate-400" /> Dışa Aktar
          </Button>
        </div>
      </div>

      <div className="p-0">
        <div className="block lg:hidden space-y-4 p-4">
          {sortedData.length === 0 ? (
            <p className="text-center py-10 text-slate-500 font-bold">Ürün bulunamadı.</p>
          ) : (
            sortedData.map((product: any) => (
              <div key={product.id} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4 cursor-pointer" onClick={() => handleProductClick(product)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-200 text-[14px] leading-tight">{product.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">SKU: {product.sku || '-'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                      {product.category.name}
                    </div>
                    {product.location && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{product.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                    <p className="text-[9px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider">STOK DURUMU</p>
                    <div className="flex items-center gap-2">
                      {product.stock <= product.criticalStock ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                          <span className="text-[13px] font-semibold text-rose-400">{product.stock} Adet</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-[13px] font-medium text-slate-300">{product.stock} Adet</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center text-right">
                    <p className="text-[9px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider">SATIŞ FİYATI</p>
                    <span className="text-[14px] font-semibold text-slate-200">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">MALİYET</span>
                    <RevealFinancial amount={product.buyPrice} className="text-[11px] text-slate-400 font-medium" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={(e) => { e.stopPropagation(); onAddToShortage(product); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/5 text-white w-48 shadow-xl shadow-black/50">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSell(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                          <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" /> Hızlı Satış
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                          <Edit className="h-3.5 w-3.5 text-blue-500" /> Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                          <ClipboardList className="h-3.5 w-3.5 text-orange-400" /> Hareket Geçmişi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer text-rose-500 focus:text-rose-400 focus:bg-rose-400/10">
                          <Trash2 className="h-3.5 w-3.5" /> Sil
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
          <TableHeader>
            <TableRow className="border-b border-white/5 hover:bg-transparent">
              <TableHead className="py-3 pl-8 h-11">
                <SortableHeader label="Ürün Bilgisi" field="name" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
              </TableHead>
              <TableHead className="py-3 h-11">
                <SortableHeader label="Kategori" field="categoryId" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
              </TableHead>
              <TableHead className="py-3 h-11">
                <SortableHeader label="Stok" field="stock" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} align="center" />
              </TableHead>
              <TableHead className="py-3 h-11">
                <SortableHeader label="Fiyat" field="sellPrice" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} align="right" />
              </TableHead>
              <TableHead className="py-3 pr-8 h-11 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-[13px] font-medium text-slate-500">Kayıtlı ürün bulunamadı.</TableCell>
              </TableRow>
            ) : (
              sortedData.map((product: any) => (
                <TableRow key={product.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleProductClick(product)}>
                  <TableCell className="py-4 pl-8">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{product.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">SKU: {product.sku || 'Belirtilmedi'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[12px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                        {product.category.name}
                      </span>
                      {product.location && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="h-3 w-3" />
                          <span className="text-[11px] font-medium">{product.location}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-2">
                        {product.stock <= product.criticalStock ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                            <span className="text-[12px] font-semibold text-rose-400">{product.stock} Adet</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[12px] font-medium text-slate-300">{product.stock} Adet</span>
                          </div>
                        )}
                      </div>
                      {product.stock <= product.criticalStock && (
                        <span className="text-[10px] font-medium text-rose-500/80 uppercase tracking-tighter">
                          {product.stock === 0 ? 'Tükendi' : 'Kritik'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] font-semibold text-slate-200">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                        <span className="text-[10px] font-medium uppercase tracking-wider">Maliyet</span>
                        <RevealFinancial amount={product.buyPrice} className="text-[11px] font-medium" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button onClick={(e) => { e.stopPropagation(); onAddToShortage(product); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Eksik Listesine Ekle">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/5 text-white w-48 shadow-xl shadow-black/50">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSell(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" /> Hızlı Satış
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                            <Edit className="h-3.5 w-3.5 text-blue-500" /> Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                            <ClipboardList className="h-3.5 w-3.5 text-orange-400" /> Hareket Geçmişi
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer text-rose-500 focus:text-rose-400 focus:bg-rose-400/10">
                            <Trash2 className="h-3.5 w-3.5" /> Sil
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
