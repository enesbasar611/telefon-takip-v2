"use client";

import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    ShoppingBag,
    FileText,
    Calendar as CalendarIcon,
    Search,
    CheckCircle2,
    Banknote,
    Wallet,
    Info,
    Clock,
    Box,
    AlertCircle,
    ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { CreateAccountModal } from "@/components/finance/create-account-modal";
import { QuickProductCreateModal } from "@/components/supplier/quick-product-create-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { getIndustryLabel } from "@/lib/industry-utils";
import { getExchangeRate } from "@/lib/currency-utils";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

interface PurchaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: any[];
    onSuccess?: (newOrder: any) => void;
    defaultSupplierId?: string;
    shop?: any;
}

interface OrderItem {
    id: string;
    productId?: string;
    name: string;
    quantity: number;
    buyPrice: number;
    buyPriceUsd?: number;
    vatRate: number;
    currency: "TRY" | "USD";
}

export function PurchaseForm({ isOpen, onClose, suppliers, onSuccess, defaultSupplierId, shop }: PurchaseFormProps) {
    const productLabel = getIndustryLabel(shop, "productLabel");
    const [selectedSupplierId, setSelectedSupplierId] = useState(defaultSupplierId || "");

    useEffect(() => {
        if (isOpen && defaultSupplierId) {
            setSelectedSupplierId(defaultSupplierId);
        }
    }, [isOpen, defaultSupplierId]);

    const [orderNo, setOrderNo] = useState(`PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
    const [items, setItems] = useState<OrderItem[]>([
        { id: Math.random().toString(), name: "", quantity: 1, buyPrice: 0, vatRate: 0, currency: "TRY" }
    ]);
    const [exchangeRate, setExchangeRate] = useState(32.5);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [accountId, setAccountId] = useState("");
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogSearchResults, setDialogSearchResults] = useState<any[]>([]);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [newProductItems, setNewProductItems] = useState<{ tempId: string; name: string; buyPrice: number; currency: "TRY" | "USD" }[]>([]);

    useEffect(() => {
        if (isOpen) {
            getExchangeRate().then(setExchangeRate);
            getAccounts().then(setAccounts);
        }
    }, [isOpen]);

    const handleSearch = async (id: string, query: string) => {
        updateItem(id, "name", query);
        if (query.length < 2) {
            setDialogSearchResults([]);
            return;
        }

        const results = await searchProducts(query);
        setDialogSearchResults(results);
        setSelectedIndex(results.length > 0 ? 0 : -1);
    };

    const handleDialogKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < dialogSearchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && dialogSearchResults[selectedIndex]) {
                selectProduct(activeSearchId!, dialogSearchResults[selectedIndex]);
                setIsSearchOpen(false);
            } else if (searchQuery.length >= 2) {
                // If nothing selected but has query, use it as a non-inventory item
                setItems(items.map(i => i.id === activeSearchId ? { ...i, name: searchQuery, productId: undefined } : i));
                setIsSearchOpen(false);
            }
        }
    };

    const openSearch = (id: string, initialValue: string) => {
        setActiveSearchId(id);
        setSearchQuery(initialValue);
        setIsSearchOpen(true);
        if (initialValue.length >= 2) {
            handleSearch(id, initialValue);
        } else {
            setDialogSearchResults([]);
        }
    };

    const selectProduct = (rowId: string, product: any) => {
        setItems(items.map(i => i.id === rowId ? {
            ...i,
            name: product.name,
            productId: product.id,
            buyPrice: product.buyPriceUsd && i.currency === "USD" ? Number(product.buyPriceUsd) : (Number(product.buyPrice) || i.buyPrice),
            buyPriceUsd: Number(product.buyPriceUsd) || undefined,
        } : i));
    };

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), name: "", quantity: 1, buyPrice: 0, vatRate: 0, currency: "TRY" }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof OrderItem, val: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
    };

    const subtotal = items.reduce((sum, i) => {
        const price = i.currency === "USD" ? (i.buyPrice * exchangeRate) : i.buyPrice;
        return sum + (i.quantity * price);
    }, 0);
    const vatTotal = items.reduce((sum, i) => {
        const price = i.currency === "USD" ? (i.buyPrice * exchangeRate) : i.buyPrice;
        return sum + (i.quantity * price * (i.vatRate / 100));
    }, 0);
    const total = subtotal + vatTotal;

    useEffect(() => {
        if (paymentStatus === "PAID") {
            setPaidAmount(total);
        } else if (paymentStatus === "UNPAID") {
            setPaidAmount(0);
        }
    }, [paymentStatus, total]);

    const handleSubmit = async () => {
        if (!selectedSupplierId) {
            toast.error("Lütfen bir tedarikçi seçin.");
            return;
        }
        if (items.some(i => !i.name || i.buyPrice <= 0)) {
            toast.error("Tüm ürün bilgilerini eksiksiz doldurun.");
            return;
        }

        if (paymentStatus === "PAID" && !accountId) {
            toast.error("Peşin ödemeler için Kasa / Hesap seçmelisiniz.");
            return;
        }

        // Logic check: If user entered some items that are not in stock (no productId),
        // we can either force product creation OR just record them as name-only items.
        // The user said "stokta ürün yoksa yeni siparişmiş gibi algıla", which means just record it.
        // We'll skip product creation modal to satisfy this "fluid" requirement.

        await submitOrder();
    };

    const handleQuickCreateSuccess = async (mappedItems: { tempId: string; productId: string }[]) => {
        const updatedItems = items.map(item => {
            const mapped = mappedItems.find(m => m.tempId === item.id);
            return mapped ? { ...item, productId: mapped.productId } : item;
        });
        setItems(updatedItems);
        setQuickCreateOpen(false);
        await submitOrder(updatedItems);
    };

    const submitOrder = async (overrideItems?: OrderItem[]) => {
        setLoading(true);
        const finalItems = overrideItems || items;

        const res = await createPurchaseOrderAction({
            supplierId: selectedSupplierId,
            orderNo,
            items: finalItems.map(({ id, ...rest }) => rest),
            totalAmount: total,
            paidAmount: paidAmount,
            vatAmount: vatTotal,
            netAmount: subtotal,
            paymentStatus,
            paymentMethod,
            accountId: (paymentStatus === "PAID" || paymentStatus === "PARTIAL") ? accountId : undefined
        });

        if (res.success) {
            toast.success("Satın alma emri oluşturuldu.");
            if (onSuccess) onSuccess(res.order);
            onClose();
        } else {
            toast.error(res.error || "Hata oluştu.");
        }
        setLoading(false);
    };

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-[1440px] w-full h-[95vh] sm:h-[90vh] bg-card border-border p-0 overflow-hidden sm:rounded-[2rem] flex flex-col shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] flex-1 overflow-hidden">
                    <div className="flex-1 p-6 sm:p-10 space-y-8 overflow-y-auto custom-scrollbar">
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                                </div>
                                <div>
                                    <DialogTitle className="font-bold text-2xl tracking-tight text-foreground">Yeni Sipariş Girişi</DialogTitle>
                                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest pt-1 font-semibold flex items-center gap-2">
                                        <span>TEDARİKÇİ YÖNETİMİ</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span className="text-blue-600">SATIN ALMA FORMU</span>
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest px-1 font-bold">Tedarikçi</Label>
                                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                    <SelectTrigger className="h-12 bg-accent/5 border-border rounded-xl text-sm font-medium focus:ring-blue-500/20">
                                        <SelectValue placeholder="Tedarikçi seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest px-1 font-bold">Fatura / Sipariş No</Label>
                                <Input
                                    value={orderNo}
                                    onChange={e => setOrderNo(e.target.value)}
                                    className="h-12 bg-accent/5 border-border rounded-xl text-sm font-medium"
                                    placeholder="# PO-2024-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest px-1 font-bold">Tarih</Label>
                                <div className="h-12 bg-accent/5 border border-border rounded-xl flex items-center px-4 gap-3 text-sm font-medium">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(), "dd MMMM yyyy", { locale: tr })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-sm text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-blue-500" /> {productLabel} LİSTESİ
                                </h3>
                                <Button onClick={addItem} size="sm" variant="outline" className="h-9 px-4 rounded-xl text-[10px] font-bold border-border hover:bg-accent/10 transition-all">
                                    + SATIR EKLE
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-border overflow-hidden bg-card/50">
                                <table className="w-full text-left">
                                    <thead className="bg-accent/5 border-b border-border">
                                        <tr className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            <th className="px-6 py-4">{productLabel} ADI</th>
                                            <th className="px-6 py-4 text-center w-32">ADET</th>
                                            <th className="px-6 py-4 text-right">FİYAT</th>
                                            <th className="px-6 py-4 text-center w-32">KDV</th>
                                            <th className="px-6 py-4 text-right">TOPLAM</th>
                                            <th className="px-6 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-accent/5 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div
                                                        onClick={() => openSearch(item.id, item.name)}
                                                        className={cn(
                                                            "h-12 w-full bg-accent/5 border border-border rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all hover:bg-accent/10 hover:border-blue-500/30",
                                                            item.name ? "text-foreground font-medium" : "text-muted-foreground/40"
                                                        )}
                                                    >
                                                        <span className="text-sm truncate">{item.name || "Seçim yapın..."}</span>
                                                        <Search className="h-4 w-4 opacity-40" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                                        className="h-10 w-32 mx-auto bg-background border-2 border-border/60 hover:border-blue-500/50 focus:border-blue-500 rounded-lg text-center font-bold text-foreground transition-all"
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Select value={item.currency} onValueChange={(val: any) => updateItem(item.id, "currency", val)}>
                                                            <SelectTrigger className="w-[60px] h-10 bg-accent/5 border-border rounded-lg text-[10px] font-bold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="TRY">₺</SelectItem>
                                                                <SelectItem value="USD">$</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            type="number"
                                                            value={item.buyPrice}
                                                            onChange={e => updateItem(item.id, "buyPrice", parseFloat(e.target.value) || 0)}
                                                            className="h-10 bg-accent/5 border-border rounded-lg text-right text-sm w-32"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center bg-accent/5 rounded-lg border border-border pr-2">
                                                        <Input
                                                            type="number"
                                                            value={item.vatRate}
                                                            onChange={e => updateItem(item.id, "vatRate", parseInt(e.target.value) || 0)}
                                                            className="h-10 bg-transparent border-none text-center text-sm w-full"
                                                        />
                                                        <span className="text-muted-foreground text-[10px] font-bold">%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-sm">
                                                            {item.currency === "USD" ? "$" : "₺"}
                                                            {(item.quantity * item.buyPrice * (1 + item.vatRate / 100)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                        </span>
                                                        {item.currency === "USD" && (
                                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                                ≈ ₺{(item.quantity * item.buyPrice * exchangeRate * (1 + item.vatRate / 100)).toFixed(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-rose-500 p-2 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold px-1">ÖDEME DURUMU</Label>
                                    <div className="flex bg-accent/5 p-1 rounded-2xl border border-border">
                                        <button
                                            onClick={() => setPaymentStatus("PAID")}
                                            className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all", paymentStatus === "PAID" ? "bg-emerald-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <CheckCircle2 className="h-4 w-4" /> TAMAMI ÖDENDİ
                                        </button>
                                        <button
                                            onClick={() => setPaymentStatus("PARTIAL")}
                                            className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all", paymentStatus === "PARTIAL" ? "bg-amber-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <Wallet className="h-4 w-4" /> KISMİ ÖDEME
                                        </button>
                                        <button
                                            onClick={() => setPaymentStatus("UNPAID")}
                                            className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all", paymentStatus === "UNPAID" ? "bg-rose-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <Clock className="h-4 w-4" /> ÖDENMEDİ
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ÖDENEN TUTAR</Label>
                                        {paymentStatus === "PARTIAL" && (
                                            <span className="text-[10px] font-bold text-amber-500">KALAN: ₺{(total - paidAmount).toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₺</span>
                                        <Input
                                            type="number"
                                            value={paidAmount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setPaidAmount(val);
                                                if (val >= total) setPaymentStatus("PAID");
                                                else if (val > 0) setPaymentStatus("PARTIAL");
                                                else setPaymentStatus("UNPAID");
                                            }}
                                            className="h-12 pl-8 bg-accent/5 border-border rounded-xl text-lg font-bold text-emerald-500"
                                            disabled={paymentStatus === "PAID"}
                                        />
                                    </div>
                                </div>

                                {(paymentStatus === "PAID" || paymentStatus === "PARTIAL") && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ÖDEME HESABI</Label>
                                            <CreateAccountModal trigger={<button className="text-[10px] font-bold text-blue-600 hover:underline">YENİ HESAP EKLE</button>} />
                                        </div>
                                        <Select value={accountId} onValueChange={setAccountId}>
                                            <SelectTrigger className="h-12 bg-accent/5 border-border rounded-xl text-sm font-medium">
                                                <SelectValue placeholder="Ödeme hangi hesaptan çıkacak?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} (₺{acc.balance.toLocaleString()})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="bg-accent/5 rounded-3xl p-8 space-y-4 border border-border">
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                    <span>ARA TOPLAM</span>
                                    <span>₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-widest font-bold">
                                    <span>KDV (%0 VARSAYILAN)</span>
                                    <span>₺{vatTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">GENEL TOPLAM</span>
                                    <span className="text-4xl font-black text-foreground tracking-tighter">₺{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full h-15 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 mt-6"
                                >
                                    {loading ? <Clock className="h-5 w-5 animate-spin mr-2" /> : <ShoppingBag className="h-5 w-5 mr-2" />}
                                    SİPARİŞİ KAYDET VE TAMAMLA
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/30 border-l border-border p-8 hidden lg:flex flex-col gap-6 overflow-y-auto">
                        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 transform translate-x-1/3 -translate-y-1/3 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                            <div className="relative z-10 space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">GÜNCEL BAKİYE</p>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black tracking-tighter">₺{Number(selectedSupplier?.balance || 0).toLocaleString()}</p>
                                    <p className="text-xs font-medium opacity-80">{selectedSupplier?.name || "Tedarikçi Seçili Değil"}</p>
                                </div>
                                <Badge className="bg-white/20 hover:bg-white/30 border-none text-[10px] font-bold uppercase px-3 py-1">AÇIK HESAP</Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">BİLGİ NOTU</h4>
                            <div className="p-5 bg-accent/5 rounded-2xl border border-border/50 text-[11px] leading-relaxed text-muted-foreground space-y-3">
                                <div className="flex gap-3">
                                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                                    <p>Sipariş kaydı oluşturulduğunda **stok bakiyesi artmaz**. Stok artışı için **Lojistik &gt; Mal Kabul** ekranından ürünleri onaylamanız gerekmektedir.</p>
                                </div>
                                <div className="flex gap-3">
                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                    <p>Ödeme durumu **Beklemede** olarak seçilirse tutar tedarikçiye **borç** olarak yansıtılır.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>

            {/* ÜRÜN ARAMA MODALI */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="sm:max-w-xl bg-background border-border p-0 sm:rounded-3xl shadow-3xl overflow-hidden mt-[-10vh]">
                    <div className="p-8 space-y-6">
                        <div className="space-y-1">
                            <h4 className="text-xl font-bold text-foreground">Ürün Hızlı Arama</h4>
                            <p className="text-sm text-muted-foreground">Listeye eklemek istediğiniz {productLabel.toLowerCase()}ı seçin.</p>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleSearch(activeSearchId!, e.target.value);
                                }}
                                onKeyDown={handleDialogKeyDown}
                                className="h-14 pl-12 bg-accent/5 border-border rounded-2xl text-lg font-medium focus:ring-blue-500/10 placeholder:text-muted-foreground/30"
                                placeholder="Ürün adı yazın..."
                            />
                        </div>

                        <div className="max-h-[350px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {dialogSearchResults.length > 0 ? (
                                dialogSearchResults.map((p, idx) => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            selectProduct(activeSearchId!, p);
                                            setIsSearchOpen(false);
                                        }}
                                        className={cn(
                                            "p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between group",
                                            selectedIndex === idx ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-accent/5 border-border/50 text-foreground hover:bg-accent/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl", selectedIndex === idx ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600")}>
                                                <Box className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{p.name}</p>
                                                <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedIndex === idx ? "text-white/60" : "text-muted-foreground")}>{p.category?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm">₺{Number(p.buyPrice).toLocaleString()}</p>
                                            <p className={cn("text-[9px] font-bold uppercase", p.stock > 0 ? (selectedIndex === idx ? "text-emerald-200" : "text-emerald-600") : "text-rose-500")}>Stok: {p.stock}</p>
                                        </div>
                                    </div>
                                ))
                            ) : searchQuery.length >= 2 ? (
                                <div className="py-10 text-center space-y-6">
                                    <div className="h-20 w-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto border border-dashed border-border">
                                        <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-foreground font-bold">Sonuç Bulunamadı</p>
                                        <p className="text-sm text-muted-foreground">"{searchQuery}" aramasına uygun kayıt bulunamadı.</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={() => {
                                                setItems(items.map(i => i.id === activeSearchId ? { ...i, name: searchQuery, productId: undefined } : i));
                                                setIsSearchOpen(false);
                                            }}
                                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> SADECE İSİMLE LİSTEYE EKLE
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <ShoppingBag className="h-10 w-10 text-muted-foreground/10 mx-auto" />
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aramak için yazmaya başlayın</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateAccountModal trigger={<span className="hidden" />} />
            <QuickProductCreateModal
                isOpen={quickCreateOpen}
                onClose={() => setQuickCreateOpen(false)}
                items={newProductItems}
                onSuccess={handleQuickCreateSuccess}
                shop={shop}
            />
        </Dialog>
    );
}


