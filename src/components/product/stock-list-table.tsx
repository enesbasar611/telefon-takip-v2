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
import { useRouter, useSearchParams } from "next/navigation";
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
  MapPin,
  Barcode as BarcodeIcon,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { quickSellProduct, deleteProduct, ensureProductBarcode, regenerateProductBarcodes } from "@/lib/actions/product-actions";
import { toast } from "sonner";
import { ProductDetailDrawer } from "./product-detail-drawer";
import { EditProductModal } from "./edit-product-modal";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/ui/sortable-header";
import { getIndustryLabel } from "@/lib/industry-utils";
import { BarcodeLabelPrintDialog } from "@/components/barcode/barcode-label-print-dialog";


export function StockListTable({ products, categories, shop }: { products: any[], categories: any[], shop?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("highlight");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [printProduct, setPrintProduct] = useState<any>(null);
  const [printProducts, setPrintProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

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
  const selectedProducts = useMemo(
    () => sortedData.filter((product: any) => selectedIds.includes(product.id)),
    [sortedData, selectedIds]
  );
  const allVisibleSelected = sortedData.length > 0 && sortedData.every((product: any) => selectedIds.includes(product.id));

  const toggleProductSelection = (productId: string) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !sortedData.some((product: any) => product.id === id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...sortedData.map((product: any) => product.id)])));
  };

  const handleExport = () => {
    const headers = ["Ürün Adı", "SKU", "Barkod", "Kategori", "Stok", "Alış (TL)", "Alış (USD)", "Satış"];
    const csvData = filteredProducts.map(p => [
      p.name,
      p.sku || "-",
      p.barcode || "-",
      p.category.name,
      p.stock,
      p.buyPrice,
      p.buyPriceUsd || "-",
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
      const res = await addShortageItem({ productId: product.id, name: product.name, quantity: 1 });
      if (res.isDuplicate) {
        toast.warning(res.message);
      } else {
        toast.success(`${product.name} eksikler listesine eklendi.`);
      }
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

  const handlePrintClick = async (product: any) => {
    try {
      if (product.barcode) {
        setPrintProduct(product);
        setPrintProducts([]);
        setIsPrintDialogOpen(true);
        return;
      }

      toast.loading("Barkod oluşturuluyor...", { id: "ensure-barcode" });
      const res = await ensureProductBarcode(product.id);
      toast.dismiss("ensure-barcode");

      if (res.success && res.product) {
        setPrintProduct({ ...product, ...res.product });
        setPrintProducts([]);
        setIsPrintDialogOpen(true);
        toast.success("Barkod hazırlandı.");
      } else {
        toast.error(res.error || "Barkod oluşturulamadı.");
      }
    } catch (error) {
      toast.dismiss("ensure-barcode");
      toast.error("Barkod yazdırma hazırlanamadı.");
    }
  };

  const handleBulkPrint = async (regenerate = false) => {
    if (selectedProducts.length === 0) {
      toast.error("Barkod yazdırmak için ürün seçin.");
      return;
    }

    try {
      let productsForPrint = selectedProducts;
      const productsWithoutBarcode = selectedProducts.filter((product: any) => !product.barcode);
      const idsToRegenerate = regenerate
        ? selectedProducts.map((product: any) => product.id)
        : productsWithoutBarcode.map((product: any) => product.id);

      if (idsToRegenerate.length > 0) {
        toast.loading(regenerate ? "Barkodlar ürün adına göre yenileniyor..." : "Eksik barkodlar hazırlanıyor...", { id: "bulk-barcodes" });
        const res = await regenerateProductBarcodes(idsToRegenerate);
        toast.dismiss("bulk-barcodes");

        if (!res.success || !res.products) {
          toast.error(res.error || "Barkodlar hazırlanamadı.");
          return;
        }

        const updatedById = new Map(res.products.map((updatedProduct: any) => [updatedProduct.id, updatedProduct]));
        productsForPrint = selectedProducts.map((selectedProduct: any) => ({
          ...selectedProduct,
          ...(updatedById.get(selectedProduct.id) || {}),
        }));
        router.refresh();
      }

      setPrintProduct(null);
      setPrintProducts(productsForPrint);
      setIsPrintDialogOpen(true);
      toast.success(regenerate ? "Barkodlar yenilendi, yazdırmaya hazır." : "Toplu barkod çıktısı hazır.");
    } catch (error) {
      toast.dismiss("bulk-barcodes");
      toast.error("Toplu barkod çıktısı hazırlanamadı.");
    }
  };

  const handleDeleteClick = async (product: any) => {
    const confirm = window.confirm(`${product.name} silinecek. Emin misiniz?`);
    if (!confirm) return;

    try {
      const res = await deleteProduct(product.id);
      if (res.success) {
        toast.success("Ürün silindi.");
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Ürün silinirken bir hata oluştu.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:p-6 border-b border-border/50 bg-transparent">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
          <Input
            placeholder={`${getIndustryLabel(shop, "productLabel")} adı, SKU veya barkod ara...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/30 border-border rounded-xl text-[13px] font-medium text-foreground h-10 placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 text-[12px] font-medium text-foreground bg-muted/30 border-border rounded-xl hover:bg-muted hover:text-foreground transition-colors">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                {selectedCategory === "ALL" ? "Tüm Kategoriler" : categories.find(c => c.id === selectedCategory)?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground shadow-xl min-w-[200px]">
              <DropdownMenuItem onClick={() => setSelectedCategory("ALL")} className="text-[12px] font-medium p-2.5 cursor-pointer focus:bg-muted">Tüm Kategoriler</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              {categories.map(cat => (
                <DropdownMenuItem key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="text-[12px] font-medium p-2.5 cursor-pointer focus:bg-white/5">{cat.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleExport} variant="outline" className="h-10 px-4 text-[12px] font-medium text-foreground bg-muted/30 border-border rounded-xl hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Dışa Aktar
          </Button>
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-10 rounded-xl px-3">
                {selectedProducts.length} seçili
              </Badge>
              <Button onClick={() => handleBulkPrint(false)} variant="outline" className="h-10 px-4 text-[12px] font-medium bg-muted/30 border-border rounded-xl gap-2">
                <BarcodeIcon className="h-3.5 w-3.5" />
                Seçilenleri Yazdır
              </Button>
              <Button onClick={() => handleBulkPrint(true)} variant="outline" className="h-10 px-4 text-[12px] font-medium bg-muted/30 border-border rounded-xl gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Barkodları Yenile
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-0">
        <div className="block lg:hidden space-y-4 p-4">
          {sortedData.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground/80 ">Ürün bulunamadı.</p>
          ) : (
            sortedData.map((product: any) => (
              <div key={product.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4 cursor-pointer" onClick={() => handleProductClick(product)}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-[14px] leading-tight">{product.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">SKU: {product.sku || '-'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-muted px-2 py-0.5 rounded-md border border-border text-[10px] font-medium text-muted-foreground">
                      {product.category.name}
                    </div>
                    {product.location && (
                      <div className="flex items-center gap-1 text-muted-foreground/80">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{product.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-muted/40 p-3 rounded-xl border border-border flex flex-col justify-center">
                    <p className="text-[9px] font-medium text-muted-foreground/80 mb-1.5 uppercase tracking-wider">STOK DURUMU</p>
                    <div className="flex items-center gap-2">
                      {product.stock <= product.criticalStock ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                          <span className="text-[13px] font-semibold text-rose-500">{product.stock} Adet</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-[13px] font-medium text-foreground">{product.stock} Adet</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl border border-border flex flex-col justify-center text-right">
                    <p className="text-[9px] font-medium text-muted-foreground/80 mb-1.5 uppercase tracking-wider">SATIŞ FİYATI</p>
                    <span className="text-[14px] font-semibold text-foreground">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/50">
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-[9px] text-muted-foreground/80">MALİYET</div>
                    <div className="flex items-center gap-2">
                      <RevealFinancial amount={product.buyPrice} className="text-[12px] text-foreground " />
                      {product.buyPriceUsd && (
                        <span className="text-[11px] text-blue-400  flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          ${product.buyPriceUsd}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={(e) => { e.stopPropagation(); onAddToShortage(product); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button onClick={(e) => { e.stopPropagation(); handlePrintClick(product); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="Barkod Yazdır">
                      <BarcodeIcon className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted transition-all outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground w-48 shadow-xl">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSell(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-muted">
                          <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" /> Hızlı Satış
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                          <Edit className="h-3.5 w-3.5 text-blue-500" /> Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrintClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                          <BarcodeIcon className="h-3.5 w-3.5 text-violet-500" /> Barkod Yazdır
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                          <ClipboardList className="h-3.5 w-3.5 text-orange-400" /> Hareket Geçmişi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer text-rose-500 focus:text-rose-400 focus:bg-rose-400/10">
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
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead className="w-12 py-3 pl-8 h-11">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} />
              </TableHead>
              <TableHead className="font-medium py-3 h-11">
                <SortableHeader label={`${getIndustryLabel(shop, "productLabel")} Bilgisi`} field="name" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
              </TableHead>
              <TableHead className="font-medium py-3 h-11">
                <SortableHeader label="Kategori" field="categoryId" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} />
              </TableHead>
              <TableHead className="font-medium py-3 h-11">
                <SortableHeader label="Stok" field="stock" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} align="center" />
              </TableHead>
              <TableHead className="font-medium py-3 h-11">
                <SortableHeader label="Fiyat" field="sellPrice" sortField={sortField as string} sortOrder={sortOrder} onSort={toggleSort} align="right" />
              </TableHead>
              <TableHead className="font-medium py-3 pr-8 h-11 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[13px] font-medium text-muted-foreground/80">Kayıtlı ürün bulunamadı.</TableCell>
              </TableRow>
            ) : (
              sortedData.map((product: any) => (
                <TableRow key={product.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors group cursor-pointer" onClick={() => handleProductClick(product)}>
                  <TableCell className="py-4 pl-8" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-foreground/90 group-hover:text-blue-400 transition-colors">{product.name}</span>
                      <span className="text-[11px] text-muted-foreground/80 font-medium mt-0.5">SKU: {product.sku || 'Belirtilmedi'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[12px] font-medium text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded-md">
                        {product.category.name}
                      </span>
                      {product.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground/80">
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
                            <span className="text-[12px] font-medium text-foreground">{product.stock} Adet</span>
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
                      <span className="text-[14px] font-semibold text-foreground transition-colors">₺{Number(product.sellPrice).toLocaleString('tr-TR')}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px]  uppercase tracking-widest text-muted-foreground/80">Maliyet:</span>
                        <div className="flex items-center gap-1.5 bg-muted/20 px-2 py-0.5 rounded-lg border border-border/50">
                          {product.buyPriceUsd && (
                            <>
                              <span className="text-[10px] font-semibold text-blue-400/90">${product.buyPriceUsd}</span>
                              <span className="text-[9px] text-muted-foreground/50">=</span>
                            </>
                          )}
                          <RevealFinancial amount={product.buyPrice} className="text-[11px]  text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button onClick={(e) => { e.stopPropagation(); onAddToShortage(product); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Eksik Listesine Ekle">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button onClick={(e) => { e.stopPropagation(); handlePrintClick(product); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="Barkod Yazdır">
                        <BarcodeIcon className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted transition-all outline-none">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground w-48 shadow-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSell(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-muted">
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" /> Hızlı Satış
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                            <Edit className="h-3.5 w-3.5 text-blue-500" /> Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrintClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                            <BarcodeIcon className="h-3.5 w-3.5 text-violet-500" /> Barkod Yazdır
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer focus:bg-white/5">
                            <ClipboardList className="h-3.5 w-3.5 text-orange-400" /> Hareket Geçmişi
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }} className="text-[11px] font-medium p-3 gap-2 cursor-pointer text-rose-500 focus:text-rose-400 focus:bg-rose-400/10">
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
        shop={shop}
      />

      <BarcodeLabelPrintDialog
        product={printProduct}
        products={printProducts}
        isOpen={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
      />
    </div>
  );
}





