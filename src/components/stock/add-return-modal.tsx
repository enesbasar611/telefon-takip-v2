"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Search,
    Loader2,
    Package,
    AlertCircle,
    User,
    Store,
    RefreshCcw,
    X,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { searchProducts } from "@/lib/actions/product-actions";
import { getCustomersPaginated } from "@/lib/actions/customer-actions";
import { getSuppliers } from "@/lib/actions/supplier-actions";
import { createMultipleReturnTickets } from "@/lib/actions/return-actions";
import { getCustomerStatement } from "@/lib/actions/debt-actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InitialReturnItem {
    productId: string;
    name: string;
    quantity: number;
    refundAmount: number;
    refundCurrency?: string;
    unitPrice?: number;
    saleNumber?: string;
    soldAt?: string;
    debtId?: string;
    saleId?: string;
}

interface AddReturnModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: {
        sourceType?: "CUSTOMER" | "SUPPLIER";
        sourceId?: string;
        sourceName?: string;
        items?: InitialReturnItem[];
    };
}

interface ReturnItem {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    reason: string;
    refundAmount: number;
    refundCurrency: string;
    restockProduct: boolean;
    notes?: string;
}

const currencySymbol = (currency?: string) => currency === "USD" ? "$" : "₺";

export function AddReturnModal({ open, onOpenChange, onSuccess, initialData }: AddReturnModalProps) {
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState<"CUSTOMER" | "SUPPLIER">(initialData?.sourceType || "CUSTOMER");
    const [selectedSourceId, setSelectedSourceId] = useState<string>(initialData?.sourceId || "");
    const [sourceSearch, setSourceSearch] = useState(initialData?.sourceName || "");
    const [sourceOpen, setSourceOpen] = useState(false);

    const [customerSales, setCustomerSales] = useState<any[]>([]);
    const [activeReturns, setActiveReturns] = useState<any[]>([]);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

    // Search Results
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [productResults, setProductResults] = useState<any[]>([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    const [sources, setSources] = useState<any[]>([]);
    const [isLoadingSources, setIsLoadingSources] = useState(false);

    // Sync initialData when modal opens
    useEffect(() => {
        if (open && initialData) {
            if (initialData.sourceType) setSourceType(initialData.sourceType);
            if (initialData.sourceId) setSelectedSourceId(initialData.sourceId);
            if (initialData.sourceName) setSourceSearch(initialData.sourceName);
            if (initialData.items && initialData.items.length > 0) {
                setItems(initialData.items.map(i => ({
                    id: Math.random().toString(36).substr(2, 9),
                    productId: i.productId,
                    name: i.name,
                    quantity: i.quantity,
                    reason: "GENERAL_RETURN",
                    refundAmount: i.refundAmount,
                    refundCurrency: i.refundCurrency || "TRY",
                    restockProduct: true,
                    ...(i.unitPrice ? { unitPrice: i.unitPrice } : {}),
                    ...(i.saleNumber ? { saleNumber: i.saleNumber } : {}),
                    ...(i.soldAt ? { soldAt: i.soldAt } : {}),
                    ...(i.debtId ? { debtId: i.debtId } : {}),
                    ...(i.saleId ? { saleId: i.saleId } : {}),
                } as any)));
            }
        }
        if (!open) {
            // Reset on close only if no initialData (to avoid stale state on re-open)
            setItems([]);
            setSelectedSourceId("");
            setSourceSearch("");
            setSourceType("CUSTOMER");
            setProductSearch("");
            setProductResults([]);
        }
    }, [open]);

    // Fetch sources based on sourceType
    useEffect(() => {
        const fetchSources = async () => {
            setIsLoadingSources(true);
            try {
                if (sourceType === "CUSTOMER") {
                    const res = await getCustomersPaginated({ limit: 200 });
                    setSources(res.data || []);
                } else if (sourceType === "SUPPLIER") {
                    const res = await getSuppliers();
                    setSources(res || []);
                }
            } catch (error) {
                console.error("Fetch sources error:", error);
            } finally {
                setIsLoadingSources(false);
            }
        };

        if (open) {
            fetchSources();
        }
    }, [sourceType, open]);


    useEffect(() => {
        if (sourceType === "CUSTOMER" && selectedSourceId) {
            setIsLoadingPurchases(true);
            getCustomerStatement(selectedSourceId).then(res => {
                if (res.success) {
                    const directSales: any[] = (res.sales as any[]) || [];
                    const debts: any[] = (res.debts as any[]) || [];

                    // Collect sale IDs already in directSales to avoid duplicates
                    const existingSaleIds = new Set(directSales.map((s: any) => s.id));

                    // Extract debt-linked sales that aren't already in directSales
                    const debtSales: any[] = debts
                        .filter((d: any) => d.sale && d.sale.items?.length > 0 && !existingSaleIds.has(d.sale.id))
                        .map((d: any) => ({
                            ...d.sale,
                            // Mark these as veresiye so we can badge them differently
                            _fromDebt: true,
                            _debtId: d.id,
                            _debtCurrency: d.currency || "TRY",
                        }));

                    const merged = [...directSales, ...debtSales]
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                    setCustomerSales(merged);
                    setActiveReturns((res.activeReturns as any[]) || []);
                } else {
                    setCustomerSales([]);
                    setActiveReturns([]);
                }
                setIsLoadingPurchases(false);
            });
        } else {
            setCustomerSales([]);
            setActiveReturns([]);
        }
    }, [selectedSourceId, sourceType]);

    // Product search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (productSearch.length >= 2) {
                setIsSearchingProducts(true);
                try {
                    const results = await searchProducts(productSearch);
                    setProductResults(results || []);
                } catch (error) {
                    console.error("Search products error:", error);
                } finally {
                    setIsSearchingProducts(false);
                }
            } else {
                setProductResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [productSearch]);

    const addProduct = (product: any) => {
        if (items.find(i => i.productId === product.id)) {
            toast.error("Bu ürün zaten listede var.");
            return;
        }

        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            name: product.name,
            quantity: 1,
            reason: "GENERAL_RETURN",
            refundAmount: 0,
            refundCurrency: "TRY",
            restockProduct: true
        }]);
        setProductSearch("");
        setProductResults([]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, updates: Partial<ReturnItem>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const handleSubmit = async () => {
        if (!selectedSourceId) {
            toast.error("Lütfen bir kaynak (Müşteri/Tedarikçi) seçin.");
            return;
        }

        if (items.length === 0) {
            toast.error("Lütfen iade edilecek en az bir ürün seçin.");
            return;
        }

        setLoading(true);
        try {
            const tickets = items.map(item => ({
                sourceType: (item as any).debtId ? "DEBT" : sourceType,
                productId: item.productId,
                quantity: item.quantity,
                refundAmount: item.refundAmount,
                refundCurrency: item.refundCurrency,
                reason: item.reason,
                notes: item.notes,
                restockProduct: item.restockProduct,
                // Assign to properly linked debt or sale if passed
                debtId: (item as any).debtId,
                saleId: (item as any).saleId,
                customerId: sourceType === "CUSTOMER" ? selectedSourceId : undefined,
                supplierId: sourceType === "SUPPLIER" ? selectedSourceId : undefined,
            }));

            const res = await createMultipleReturnTickets(tickets);
            if (res.success) {
                toast.success("İade kayıtları başarıyla oluşturuldu.");
                onOpenChange(false);
                setItems([]);
                setSelectedSourceId("");
                onSuccess?.();
            } else {
                toast.error(res.error || "İadeler oluşturulamadı.");
            }
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background rounded-3xl border-border/40 shadow-2xl">
                <div className="flex flex-col h-[85vh]">
                    <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/30">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <RefreshCcw className="h-6 w-6 text-primary" />
                            </div>
                            Yeni İade Kaydı
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* Source Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Store className="h-4 w-4 text-primary" />
                                    İade Kaynağı
                                </Label>
                                <Select value={sourceType} onValueChange={(v: any) => {
                                    setSourceType(v);
                                    setSelectedSourceId("");
                                }}>
                                    <SelectTrigger className="h-12 rounded-xl border-border/40 bg-muted/20">
                                        <SelectValue placeholder="Kaynak Türörü Seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/40 shadow-xl">
                                        <SelectItem value="CUSTOMER">Müşteri / Bayi İadesi</SelectItem>
                                        <SelectItem value="SUPPLIER">Tedarikçi İadesi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    {sourceType === "CUSTOMER" ? "Müşteri / Bayi Seçin" : "Tedarikçi Seçin"}
                                </Label>
                                <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={sourceOpen}
                                            disabled={isLoadingSources}
                                            className="w-full justify-between h-12 rounded-xl border-border/40 bg-muted/20"
                                        >
                                            {selectedSourceId
                                                ? sources.find((s) => s.id === selectedSourceId)?.name
                                                : isLoadingSources ? "Yükleniyor..." : "Seçim Yapın veya Arayın..."}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] sm:w-[400px] p-0 rounded-xl shadow-xl border-border/40" side="bottom" align="start">
                                        <div className="flex items-center border-b border-border/40 px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                            <Input
                                                placeholder="Arama yap..."
                                                value={sourceSearch}
                                                onChange={(e) => setSourceSearch(e.target.value)}
                                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0"
                                            />
                                        </div>
                                        <ScrollArea className="h-[200px] overflow-y-auto">
                                            <div className="p-1">
                                                {sources.filter(s => s.name.toLowerCase().includes(sourceSearch.toLowerCase()) || (s.phone && s.phone.includes(sourceSearch))).length === 0 ? (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">Kayıt bulunamadı.</div>
                                                ) : (
                                                    sources.filter(s => s.name.toLowerCase().includes(sourceSearch.toLowerCase()) || (s.phone && s.phone.includes(sourceSearch))).map((source) => (
                                                        <div
                                                            key={source.id}
                                                            onClick={() => {
                                                                setSelectedSourceId(source.id);
                                                                setSourceOpen(false);
                                                            }}
                                                            className={cn(
                                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                                                selectedSourceId === source.id && "bg-primary/10 text-primary font-medium"
                                                            )}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span>{source.name}</span>
                                                                {source.phone && <span className="text-[10px] text-muted-foreground">{source.phone}</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Customer Purchase History - all items from all sales */}
                        {sourceType === "CUSTOMER" && selectedSourceId && (
                            <div className="space-y-3 border border-border/40 rounded-3xl p-4 bg-muted/10">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <Package className="h-4 w-4" />
                                        Müşterinin Satın Aldığı Ürünler
                                    </Label>
                                    {isLoadingPurchases && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                </div>
                                {isLoadingPurchases ? (
                                    <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                ) : customerSales.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Bu müşteriye ait satış kaydı bulunamadı.</p>
                                ) : (
                                    <ScrollArea className="h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                        <div className="flex flex-col gap-2">
                                            {customerSales.map((sale: any) =>
                                                sale.items?.map((saleItem: any) => {
                                                    if (!saleItem.product) return null;
                                                    const alreadyAdded = items.find(i => i.productId === saleItem.productId && (i as any).saleId === sale.id);
                                                    const isVeresiye = sale._fromDebt || sale.paymentMethod === 'DEBT';
                                                    const saleCurrency = sale._debtCurrency || "TRY";
                                                    const returnAlreadyActive = activeReturns.some((returnTicket: any) =>
                                                        returnTicket.productId === saleItem.productId &&
                                                        returnTicket.saleId === sale.id &&
                                                        (!sale._debtId || returnTicket.debtId === sale._debtId)
                                                    );
                                                    return (
                                                        <div
                                                            key={`${sale.id}-${saleItem.productId}`}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-xl border bg-background transition-all gap-3",
                                                                alreadyAdded
                                                                    ? "border-primary/40 bg-primary/5"
                                                                    : "border-border/50 hover:border-primary/30"
                                                            )}
                                                        >
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-sm font-semibold truncate">{saleItem.product.name}</span>
                                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {new Date(sale.createdAt).toLocaleDateString('tr-TR')} • {sale.saleNumber}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-indigo-500">
                                                                        {saleItem.quantity} Adet × {currencySymbol(saleCurrency)}{Number(saleItem.unitPrice).toLocaleString('tr-TR')}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full",
                                                                        isVeresiye
                                                                            ? "bg-rose-500/10 text-rose-600"
                                                                            : "bg-emerald-500/10 text-emerald-600"
                                                                    )}>
                                                                        {isVeresiye ? 'Veresiye' : sale.paymentMethod === 'CASH' ? 'Nakit' : sale.paymentMethod === 'CARD' ? 'Kart' : sale.paymentMethod}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                disabled={!!alreadyAdded || returnAlreadyActive}
                                                                variant={alreadyAdded || returnAlreadyActive ? "secondary" : "outline"}
                                                                className={cn(
                                                                    "rounded-lg h-8 text-xs font-semibold shrink-0 transition-all",
                                                                    !alreadyAdded && "hover:bg-primary hover:text-white border-primary/30"
                                                                )}
                                                                onClick={() => {
                                                                    if (returnAlreadyActive) {
                                                                        toast.error("Bu ürün için tamamlanmamış bir iade kaydı var.");
                                                                        return;
                                                                    }
                                                                    setItems(prev => [...prev, {
                                                                        id: Math.random().toString(36).substr(2, 9),
                                                                        productId: saleItem.productId,
                                                                        name: saleItem.product.name,
                                                                        quantity: saleItem.quantity,
                                                                        reason: "GENERAL_RETURN",
                                                                        refundAmount: Number(saleItem.unitPrice) * saleItem.quantity,
                                                                        refundCurrency: saleCurrency,
                                                                        restockProduct: true,
                                                                        saleId: sale.id,
                                                                        debtId: sale._debtId,
                                                                        unitPrice: Number(saleItem.unitPrice),
                                                                        saleNumber: sale.saleNumber,
                                                                        soldAt: sale.createdAt,
                                                                    } as any]);
                                                                }}
                                                            >
                                                                {returnAlreadyActive ? (
                                                                    <><CheckCircle2 className="w-3 h-3 mr-1" /> İadede</>
                                                                ) : alreadyAdded ? (
                                                                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Eklendi</>
                                                                ) : (
                                                                    <><Plus className="w-3 h-3 mr-1" /> Ekle</>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )}

                        {/* Product Search */}
                        <div className="space-y-4 relative">
                            <Label className="text-sm font-bold flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                Ürün Ekle
                            </Label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Ürün adı, barkod veya SKU ara..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all shadow-sm focus:ring-primary/20"
                                />
                                {isSearchingProducts && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {productResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-background border border-border/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {productResults.map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() => addProduct(product)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 border-b border-border/10 last:border-0 transition-colors text-left"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{product.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{product.category?.name || "Kategorisiz"} • {product.sku || "SKU Yok"}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className={cn(
                                                            "text-xs font-bold px-2 py-1 rounded-lg",
                                                            product.stock > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                        )}>
                                                            {product.stock} Adet
                                                        </span>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                        <Plus className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-primary" />
                                    İade Edilecek Ürünler
                                </Label>
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted p-1 px-2 rounded-full uppercase tracking-widest">
                                    {items.length} KALEM
                                </span>
                            </div>

                            <div className="space-y-4">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 text-muted-foreground">
                                        <Package className="h-12 w-12 mb-3 opacity-20" />
                                        <p className="text-sm">Henüz ürün seçilmedi</p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="p-5 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm space-y-4 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1 flex-1">
                                                    <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                                                    <p className="text-[11px] text-muted-foreground uppercase tracking-tight">
                                                        KİMLİK: {item.productId ? String(item.productId).slice(-6) : ((item as any).debtId ? `DEBT-${String((item as any).debtId).slice(-6)}` : 'MANUEL')}
                                                    </p>
                                                    {((item as any).unitPrice || (item as any).saleNumber) && (
                                                        <p className="text-[10px] text-primary font-bold uppercase tracking-tight">
                                                            {(item as any).saleNumber ? `${(item as any).saleNumber} • ` : ""}
                                                            Birim: {currencySymbol(item.refundCurrency)}{Number((item as any).unitPrice || item.refundAmount / Math.max(item.quantity, 1)).toLocaleString("tr-TR")}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(item.id)}
                                                    className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">Adet</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                        className="h-10 rounded-xl border-border/40 bg-muted/20"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">Durum</Label>
                                                    <Select value={item.reason} onValueChange={(v) => updateItem(item.id, { reason: v })}>
                                                        <SelectTrigger className="h-10 rounded-xl border-border/40 bg-muted/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-border/40">
                                                            <SelectItem value="GENERAL_RETURN">Genel İade</SelectItem>
                                                            <SelectItem value="DAMAGED">Hasarlı Ürün</SelectItem>
                                                            <SelectItem value="PART_FAILURE">Parça Arızası</SelectItem>
                                                            <SelectItem value="LABOR_ERROR">İşçilik Hatası</SelectItem>
                                                            <SelectItem value="CUSTOMER_CANCEL">Vazgeçme</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">İade Tutarı</Label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">
                                                                {currencySymbol(item.refundCurrency)}
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                value={item.refundAmount}
                                                                onChange={(e) => updateItem(item.id, { refundAmount: parseFloat(e.target.value) || 0 })}
                                                                className="h-10 rounded-xl border-border/40 bg-muted/20 pl-7"
                                                            />
                                                        </div>
                                                        <Select value={item.refundCurrency} onValueChange={(v) => updateItem(item.id, { refundCurrency: v })}>
                                                            <SelectTrigger className="h-10 w-20 rounded-xl border-border/40 bg-muted/20">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-border/40">
                                                                <SelectItem value="TRY">TRY</SelectItem>
                                                                <SelectItem value="USD">USD</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-end pb-1 pr-2">
                                                    <div className="flex items-center justify-between bg-muted/30 p-2 rounded-xl border border-border/40 h-10 w-full">
                                                        <Label className="text-[10px] font-bold uppercase cursor-pointer" htmlFor={`restock-${item.id}`}>Stokla</Label>
                                                        <Checkbox
                                                            id={`restock-${item.id}`}
                                                            checked={item.restockProduct}
                                                            onCheckedChange={(v) => updateItem(item.id, { restockProduct: !!v })}
                                                            className="rounded-md border-border/40 h-5 w-5 data-[state=checked]:bg-emerald-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">Notlar</Label>
                                                <Input
                                                    placeholder="İade nedeni ile ilgili ek açıklama..."
                                                    value={item.notes || ""}
                                                    onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                                    className="h-10 rounded-xl border-border/40 bg-muted/20"
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-4 border-t border-border/40 bg-muted/30">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl h-12 px-6 border-border/40"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || items.length === 0}
                            className="rounded-xl h-12 px-10 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 min-w-[200px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                "İadeleri Tamamla"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
