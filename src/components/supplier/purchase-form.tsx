"use client";

import { useState } from "react";
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
    Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";

interface PurchaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: any[];
}

interface OrderItem {
    id: string;
    productId?: string;
    name: string;
    quantity: number;
    buyPrice: number;
    vatRate: number;
}

export function PurchaseForm({ isOpen, onClose, suppliers }: PurchaseFormProps) {
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [orderNo, setOrderNo] = useState(`PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
    const [items, setItems] = useState<OrderItem[]>([
        { id: Math.random().toString(), name: "", quantity: 1, buyPrice: 0, vatRate: 20 }
    ]);
    const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("UNPAID");
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [loading, setLoading] = useState(false);

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
        const res = await createPurchaseOrderAction({
            supplierId: selectedSupplierId,
            orderNo,
            items: items.map(({ id, ...rest }) => rest),
            totalAmount: total,
            vatAmount: vatTotal,
            netAmount: subtotal,
            paymentStatus,
            paymentMethod
        });

        if (res.success) {
            toast.success("Satın alma emri oluşturuldu.");
            onClose();
        } else {
            toast.error(res.error || "Hata oluştu.");
        }
        setLoading(false);
    };

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1000px] max-h-[95vh] overflow-y-auto bg-[#0a0f18] border-white/10 p-0 overflow-hidden rounded-3xl text-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
                    {/* Main Form Area */}
                    <div className="p-8 space-y-8">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight text-white">Yeni Satın Alma Formu</DialogTitle>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pt-1">CRM & FİNANS › TEDARİKÇİ YÖNETİMİ › YENİ KAYIT</p>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Fatura Detayları */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-black text-white">Fatura Detayları</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Tedarikçi Seçimi</label>
                                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-xs">
                                            <SelectValue placeholder="Tedarikçi seçin..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="font-bold text-xs">{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Alım Tarihi</label>
                                    <div className="h-12 bg-white/5 border-white/10 rounded-xl flex items-center px-4 gap-3 text-sm font-medium">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {new Date().toLocaleDateString("tr-TR")}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Fatura no</label>
                                    <Input
                                        value={orderNo}
                                        onChange={e => setOrderNo(e.target.value)}
                                        className="h-12 bg-white/5 border-white/10 rounded-xl font-black text-xs"
                                        placeholder="# TR-202"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ürün Listesi */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <ShoppingBag className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <h3 className="text-sm font-black text-white">Ürün / Parça Listesi</h3>
                                </div>
                                <Button onClick={addItem} size="sm" variant="outline" className="h-9 px-4 rounded-xl font-black text-[10px] gap-2 border-white/10 hover:bg-white/5">
                                    <Plus className="h-3.5 w-3.5" />
                                    SATIR EKLE
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-white/5 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
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
                                                    <Input
                                                        value={item.name}
                                                        onChange={e => updateItem(item.id, "name", e.target.value)}
                                                        className="h-10 bg-white/5 border-none rounded-lg text-sm font-bold"
                                                        placeholder="iPhone 14 LCD..."
                                                    />
                                                </td>
                                                <td className="px-4 py-3 w-24">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                                        className="h-10 bg-white/5 border-none rounded-lg text-center font-black"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 w-32">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₺</span>
                                                        <Input
                                                            type="number"
                                                            value={item.buyPrice}
                                                            onChange={e => updateItem(item.id, "buyPrice", parseFloat(e.target.value) || 0)}
                                                            className="h-10 bg-white/5 border-none rounded-lg text-right font-black pl-7"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 w-20">
                                                    <Input
                                                        type="number"
                                                        value={item.vatRate}
                                                        onChange={e => updateItem(item.id, "vatRate", parseInt(e.target.value) || 0)}
                                                        className="h-10 bg-white/5 border-none rounded-lg text-center font-black"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-sm text-foreground pr-5">
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
                                    <button onClick={addItem} className="text-[10px] font-black text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">+ YENİ ÜRÜN SATIRI EKLE</button>
                                </div>
                            </div>
                        </div>

                        {/* Ödeme Bilgileri */}
                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Ödeme Durumu</p>
                                <div className="flex bg-white/5 p-1 rounded-2xl">
                                    <button
                                        onClick={() => setPaymentStatus("PAID")}
                                        className={cn("flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all", paymentStatus === "PAID" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Ödendi
                                    </button>
                                    <button
                                        onClick={() => setPaymentStatus("UNPAID")}
                                        className={cn("flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all", paymentStatus === "UNPAID" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <Clock className="h-4 w-4" /> Beklemede
                                    </button>
                                </div>

                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mt-6">Ödeme Yöntemi</p>
                                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-xs text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                                        <SelectItem value="CASH" className="font-bold text-xs">Nakit Ödeme</SelectItem>
                                        <SelectItem value="TRANSFER" className="font-bold text-xs">Banka Havalesi / EFT</SelectItem>
                                        <SelectItem value="CARD" className="font-bold text-xs">Kredi Kartı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4 bg-white/5 rounded-3xl p-6">
                                <div className="flex justify-between items-center text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                    <span>Ara Toplam</span>
                                    <span>₺{subtotal.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                    <span>KDV Toplamı</span>
                                    <span>₺{vatTotal.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="h-px bg-white/5 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Genel Toplam</span>
                                    <span className="text-2xl font-black text-white">₺{total.toLocaleString("tr-TR")}</span>
                                </div>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 mt-4"
                                >
                                    {loading ? "Kaydediliyor..." : "Sipariş Kaydını Tamamla"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Info */}
                    <div className="bg-[#121a28] border-l border-white/5 p-8 space-y-8">
                        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-6 relative overflow-hidden text-white shadow-2xl">
                            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">GÜNCEL CARİ DURUM</p>
                                    <Banknote className="h-6 w-6 opacity-30" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black leading-tight">{selectedSupplier?.name || "Lütfen Seçin"}</h4>
                                    <p className="text-3xl font-black mt-2 tracking-tighter">₺{Number(selectedSupplier?.balance || 0).toLocaleString("tr-TR")}</p>
                                </div>
                                <Badge className="bg-rose-500/20 text-rose-200 border-none font-bold text-[10px] py-0.5 px-2">BORÇ BAKİYESİ</Badge>

                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                                    <div>
                                        <p className="text-[9px] font-black opacity-60">VADESİ GELEN</p>
                                        <p className="text-sm font-black uppercase tracking-tight">₺0</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black opacity-60">AÇIK SİPARİŞLER</p>
                                        <p className="text-sm font-black uppercase tracking-tight">
                                            {selectedSupplier?.purchases?.filter((p: any) => p.status !== "COMPLETED").length || 0} Adet
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Wallet className="h-3 w-3" /> BEKLEYEN BORÇLAR
                                </h5>
                            </div>
                            {/* Simulated recent debts */}
                            <div className="space-y-3">
                                <div className="bg-white/5 rounded-2xl p-4 border-l-2 border-rose-500">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[11px] font-bold text-white">FATURA: #FT-9821</p>
                                        <span className="text-[9px] font-black text-rose-400">VADESİ GEÇTİ</span>
                                    </div>
                                    <p className="text-lg font-black">₺12.200</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border-l-2 border-amber-500">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[11px] font-bold text-white">FATURA: #FT-9904</p>
                                        <span className="text-[9px] font-black text-amber-400">YARIN</span>
                                    </div>
                                    <p className="text-lg font-black">₺8.750</p>
                                </div>
                            </div>
                            <Button variant="ghost" className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white mt-2">
                                TÜM EKSTREYİ GÖRÜNTÜLE
                            </Button>
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
