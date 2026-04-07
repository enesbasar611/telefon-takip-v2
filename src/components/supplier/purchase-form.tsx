"use client";

import { Label } from "@/components/ui/label";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
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
    Wallet,
    CreditCard,
    Banknote,
    Info,
    Clock,
    ChevronRight,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import { getAccounts } from "@/lib/actions/finance-actions";
import { CreateAccountModal } from "@/components/finance/create-account-modal";
import { format, isAfter, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";

interface PurchaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: any[];
    onSuccess?: (newOrder: any) => void;
    defaultSupplierId?: string;
}

interface OrderItem {
    id: string;
    productId?: string;
    name: string;
    quantity: number;
    buyPrice: number;
    vatRate: number;
}

export function PurchaseForm({ isOpen, onClose, suppliers, onSuccess, defaultSupplierId }: PurchaseFormProps) {
    const [selectedSupplierId, setSelectedSupplierId] = useState(defaultSupplierId || "");

    useEffect(() => {
        if (isOpen && defaultSupplierId) {
            setSelectedSupplierId(defaultSupplierId);
        }
    }, [isOpen, defaultSupplierId]);

    const [orderNo, setOrderNo] = useState(`PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
    const [items, setItems] = useState<OrderItem[]>([
        { id: Math.random().toString(), name: "", quantity: 1, buyPrice: 0, vatRate: 20 }
    ]);
    const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("UNPAID");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [accountId, setAccountId] = useState("");
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<{ [key: string]: any[] }>({});
    const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch accounts on open
    useEffect(() => {
        if (isOpen) {
            getAccounts().then(setAccounts);
        }
    }, [isOpen]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setActiveSearchId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (id: string, query: string) => {
        updateItem(id, "name", query);
        if (query.length < 2) {
            setSearchResults(prev => ({ ...prev, [id]: [] }));
            setActiveSearchId(null);
            return;
        }

        const results = await searchProducts(query);
        setSearchResults(prev => ({ ...prev, [id]: results }));
        setActiveSearchId(id);
    };

    const selectProduct = (rowId: string, product: any) => {
        setItems(items.map(i => i.id === rowId ? {
            ...i,
            name: product.name,
            productId: product.id,
            buyPrice: Number(product.buyPrice) || i.buyPrice,
            // You can also add vatRate if it exists on product, but usually it's category based. 
            // For now just name and price.
        } : i));
        setActiveSearchId(null);
    };

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), name: "", quantity: 1, buyPrice: 0, vatRate: 20 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof OrderItem, val: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
    };

    const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.buyPrice), 0);
    const vatTotal = items.reduce((sum, i) => sum + (i.quantity * i.buyPrice * (i.vatRate / 100)), 0);
    const total = subtotal + vatTotal;

    const handleSubmit = async () => {
        if (!selectedSupplierId) {
            toast.error("Lütfen bir tedarikçi seçin.");
            return;
        }
        if (items.some(i => !i.name || i.buyPrice <= 0)) {
            toast.error("Tüm ürün bilgilerini eksiksiz doldurun.");
            return;
        }

        setLoading(true);

        if (paymentStatus === "PAID" && !accountId) {
            toast.error("Peşin ödemeler için Kasa / Hesap seçmelisiniz.");
            setLoading(false);
            return;
        }

        const res = await createPurchaseOrderAction({
            supplierId: selectedSupplierId,
            orderNo,
            items: items.map(({ id, ...rest }) => rest),
            totalAmount: total,
            vatAmount: vatTotal,
            netAmount: subtotal,
            paymentStatus,
            paymentMethod,
            accountId: paymentStatus === "PAID" ? accountId : undefined
        });

        if (res.success) {
            toast.success("Satın alma emri oluşturuldu.");
            if (onSuccess && res.order) {
                onSuccess(res.order);
            }
            onClose();
        } else {
            toast.error(res.error || "Hata oluştu.");
        }
        setLoading(false);
    };

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1000px] max-h-[95vh] overflow-y-auto bg-[#0a0f18] border-border p-0 overflow-hidden rounded-3xl text-foreground/90">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
                    {/* Main Form Area */}
                    <div className="p-8 space-y-8">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <DialogTitle className="font-medium text-2xl  tracking-tight text-white">Yeni Satın Alma Formu</DialogTitle>
                                    <p className="text-[10px]  text-muted-foreground uppercase tracking-widest pt-1">CRM & FİNANS › TEDARİKÇİ YÖNETİMİ › YENİ KAYIT</p>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Fatura Detayları */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-blue-400" />
                                </div>
                                <h3 className="font-medium text-sm  text-white">Fatura Detayları</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest px-1">Tedarikçi Seçimi</Label>
                                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                        <SelectTrigger className="h-12 bg-white/5 border-border rounded-xl  text-xs">
                                            <SelectValue placeholder="Tedarikçi seçin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground/90">
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id} className=" text-xs">{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest px-1">Alım Tarihi</Label>
                                    <div className="h-12 bg-white/5 border-border rounded-xl flex items-center px-4 gap-3 text-sm font-medium">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {new Date().toLocaleDateString("tr-TR")}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest px-1">Fatura no</Label>
                                    <Input
                                        value={orderNo}
                                        onChange={e => setOrderNo(e.target.value)}
                                        className="h-12 bg-white/5 border-border rounded-xl  text-xs"
                                        placeholder="# TR-202"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ürün Listesi */}
                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <ShoppingBag className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <h3 className="font-medium text-sm  text-white">Ürün / Parça Listesi</h3>
                                </div>
                                <Button onClick={addItem} size="sm" variant="outline" className="h-9 px-4 rounded-xl  text-[10px] gap-2 border-border hover:bg-white/5">
                                    <Plus className="h-3.5 w-3.5" />
                                    SATIR EKLE
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-border/50 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-border/50">
                                        <tr className="text-[10px]  text-muted-foreground uppercase tracking-widest">
                                            <th className="px-5 py-4">Ürün Adı / Açıklama</th>
                                            <th className="px-5 py-4 text-center">Miktar</th>
                                            <th className="px-5 py-4 text-right">Alış Fiyatı</th>
                                            <th className="px-5 py-4 text-center">KDV (%)</th>
                                            <th className="px-5 py-4 text-right">Toplam</th>
                                            <th className="px-5 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="relative" ref={item.id === activeSearchId ? searchRef : null}>
                                                        <Input
                                                            value={item.name}
                                                            onChange={e => handleSearch(item.id, e.target.value)}
                                                            onFocus={() => {
                                                                if (item.name.length >= 2) setActiveSearchId(item.id);
                                                            }}
                                                            className="h-10 bg-white/5 border-none rounded-lg text-sm  placeholder:text-muted-foreground/30"
                                                            placeholder="Ürün adı yazınız..."
                                                        />
                                                        {activeSearchId === item.id && searchResults[item.id]?.length > 0 && (
                                                            <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                                                                {searchResults[item.id].map((p) => (
                                                                    <button
                                                                        key={p.id}
                                                                        onClick={() => selectProduct(item.id, p)}
                                                                        className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center justify-between group"
                                                                    >
                                                                        <div>
                                                                            <p className="text-xs  text-white group-hover:text-blue-400 transition-colors">{p.name}</p>
                                                                            <p className="text-[10px] text-muted-foreground">Stok: {p.stock} | {p.category?.name}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px]  text-blue-400">₺{Number(p.sellPrice || 0).toLocaleString("tr-TR")}</p>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 w-24">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                                        className="h-10 bg-white/5 border-none rounded-lg text-center "
                                                    />
                                                </td>
                                                <td className="px-4 py-3 w-32">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground  text-xs">₺</span>
                                                        <Input
                                                            type="number"
                                                            value={item.buyPrice}
                                                            onChange={e => updateItem(item.id, "buyPrice", parseFloat(e.target.value) || 0)}
                                                            className="h-10 bg-white/5 border-none rounded-lg text-right  pl-7"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 w-20">
                                                    <Input
                                                        type="number"
                                                        value={item.vatRate}
                                                        onChange={e => updateItem(item.id, "vatRate", parseInt(e.target.value) || 0)}
                                                        className="h-10 bg-white/5 border-none rounded-lg text-center "
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right  text-sm text-foreground pr-5">
                                                    ₺{(item.quantity * item.buyPrice * (1 + item.vatRate / 100)).toLocaleString("tr-TR")}
                                                </td>
                                                <td className="px-4 py-3 w-10">
                                                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-4 bg-white/5 flex items-center justify-center">
                                    <button onClick={addItem} className="text-[10px]  text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">+ YENİ ÜRÜN SATIRI EKLE</button>
                                </div>
                            </div>
                        </div>

                        {/* Ödeme Bilgileri */}
                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/50">
                            <div className="space-y-4">
                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest px-1">Ödeme Durumu</p>
                                <div className="flex bg-white/5 p-1 rounded-2xl">
                                    <button
                                        onClick={() => setPaymentStatus("PAID")}
                                        className={cn("flex-1 py-3 rounded-xl  text-xs flex items-center justify-center gap-2 transition-all", paymentStatus === "PAID" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Ödendi
                                    </button>
                                    <button
                                        onClick={() => setPaymentStatus("UNPAID")}
                                        className={cn("flex-1 py-3 rounded-xl  text-xs flex items-center justify-center gap-2 transition-all", paymentStatus === "UNPAID" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <Clock className="h-4 w-4" /> Beklemede
                                    </button>
                                </div>

                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest px-1 mt-6">Ödeme Yöntemi</p>
                                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-border rounded-xl  text-xs text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground/90">
                                        <SelectItem value="CASH" className=" text-xs">Nakit Ödeme</SelectItem>
                                        <SelectItem value="TRANSFER" className=" text-xs">Banka Havalesi / EFT</SelectItem>
                                        <SelectItem value="CARD" className=" text-xs">Kredi Kartı</SelectItem>
                                    </SelectContent>
                                </Select>

                                {paymentStatus === "PAID" && (
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-1">Kasa / Hesap Seçimi</p>
                                            <CreateAccountModal trigger={
                                                <button type="button" className="text-[10px] uppercase tracking-widest text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                                    [+] HIZLI EKLE
                                                </button>
                                            } />
                                        </div>
                                        <Select value={accountId} onValueChange={setAccountId}>
                                            <SelectTrigger className="h-12 bg-white/5 border-border rounded-xl text-xs text-foreground data-[state=open]:ring-2 data-[state=open]:ring-blue-500/50">
                                                <SelectValue placeholder="Ödeme Hangi Kasadan Çıkacak?" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0B101B] border-border min-w-[240px] rounded-xl">
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="text-xs p-3">
                                                        <div className="flex items-center justify-between w-full min-w-[200px]">
                                                            <span className="text-white">{acc.name}</span>
                                                            <span className={cn("font-medium text-[10px]", acc.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                ₺{Number(acc.balance).toLocaleString("tr-TR")}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 bg-white/5 rounded-3xl p-6">
                                <div className="flex justify-between items-center text-muted-foreground  text-xs uppercase tracking-widest">
                                    <span>Ara Toplam</span>
                                    <span>₺{subtotal.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground  text-xs uppercase tracking-widest">
                                    <span>KDV Toplamı</span>
                                    <span>₺{vatTotal.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="h-px bg-white/5 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs  text-muted-foreground uppercase tracking-widest">Genel Toplam</span>
                                    <span className="text-2xl  text-white">₺{total.toLocaleString("tr-TR")}</span>
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white  text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 mt-4"
                                >
                                    {loading ? "Kaydediliyor..." : "Sipariş Kaydını Tamamla"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Info */}
                    <div className="bg-[#121a28] border-l border-border/50 p-8 space-y-8">
                        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-6 relative overflow-hidden text-white shadow-2xl">
                            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px]  uppercase tracking-widest opacity-70">GÜNCEL CARİ DURUM</p>
                                    <Banknote className="h-6 w-6 opacity-30" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-lg  leading-tight">{selectedSupplier?.name || "Lütfen Seçin"}</h4>
                                    <p className="text-3xl  mt-2 tracking-tighter">₺{Number(selectedSupplier?.balance || 0).toLocaleString("tr-TR")}</p>
                                </div>
                                <Badge className="bg-rose-500/20 text-rose-200 border-none  text-[10px] py-0.5 px-2">BORÇ BAKİYESİ</Badge>

                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                                    <div>
                                        <p className="text-[9px]  opacity-60">VADESİ GELEN</p>
                                        <p className="text-sm  uppercase tracking-tight">
                                            ₺{(() => {
                                                const unpaid = selectedSupplier?.purchases?.filter((p: any) => p.paymentStatus !== "PAID") || [];
                                                return Math.round(unpaid.reduce((sum: number, p: any) => sum + Number(p.remainingAmount || p.totalAmount), 0)).toLocaleString("tr-TR");
                                            })()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px]  opacity-60">AÇIK SİPARİŞLER</p>
                                        <p className="text-sm  uppercase tracking-tight">
                                            {selectedSupplier?.purchases?.filter((p: any) => p.status !== "COMPLETED").length || 0} Adet
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h5 className="text-[10px]  text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Wallet className="h-3 w-3" /> BEKLEYEN BORÇLAR
                                </h5>
                            </div>
                            <div className="space-y-3">
                                {(() => {
                                    const unpaidOrders = selectedSupplier?.purchases?.filter((p: any) => p.paymentStatus !== "PAID") || [];

                                    if (unpaidOrders.length === 0) {
                                        return (
                                            <div className="bg-white/5 rounded-2xl p-6 border border-border/50 flex flex-col items-center justify-center text-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </div>
                                                <p className="text-[10px]  text-muted-foreground uppercase tracking-widest leading-relaxed">
                                                    Bu tedarikçiye ait<br />bekleyen borç bulunmuyor.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return unpaidOrders.slice(0, 3).map((order: any) => {
                                        // Simple overdue logic: more than 15 days old
                                        const createdAtDate = new Date(order.createdAt);
                                        const diffDays = Math.floor((new Date().getTime() - createdAtDate.getTime()) / (1000 * 3600 * 24));
                                        const isOverdue = diffDays > 15;

                                        return (
                                            <div key={order.id} className={cn(
                                                "bg-white/5 rounded-2xl p-4 border-l-2 transition-all hover:bg-white/10 cursor-pointer",
                                                isOverdue ? "border-rose-500" : (order.paymentStatus === "PARTIAL" ? "border-amber-500" : "border-blue-500")
                                            )}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[11px]  text-white uppercase">#{order.orderNo}</p>
                                                    <span className={cn(
                                                        "text-[9px]  uppercase",
                                                        isOverdue ? "text-rose-400" : (order.paymentStatus === "PARTIAL" ? "text-amber-400" : "text-blue-400")
                                                    )}>
                                                        {isOverdue ? "VADESİ GEÇTİ" : (order.paymentStatus === "PARTIAL" ? "KISMİ ÖDEME" : "BEKLEYEN")}
                                                    </span>
                                                </div>
                                                <p className="text-lg ">₺{Math.round(Number(order.remainingAmount || order.totalAmount)).toLocaleString("tr-TR")}</p>
                                                <p className="text-[9px]  text-muted-foreground mt-1">
                                                    {format(new Date(order.createdAt), "dd MMMM yyyy", { locale: tr })}
                                                </p>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                            {selectedSupplier?.purchases?.filter((p: any) => p.paymentStatus !== "PAID").length > 3 && (
                                <Button variant="ghost" className="w-full h-10 rounded-xl text-[9px]  uppercase tracking-widest text-muted-foreground hover:text-white mt-2">
                                    TÜM EKSTREYİ GÖRÜNTÜLE
                                </Button>
                            )}
                        </div>

                        <div className="mt-auto bg-blue-500/5 rounded-2xl p-4 flex gap-3 border border-blue-500/10">
                            <Info className="h-4 w-4 text-blue-400 shrink-0" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Satın alma kaydedildiğinde, stok bakiyesi hemen güncellenmez. Stok artışı için **Mal Kabul** işlemini tamamlamanız gerekir.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}








