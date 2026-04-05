"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Brain,
    AlertCircle,
    TrendingUp,
    History,
    Package,
    Plus,
    Check,
    Sparkles,
    ShoppingCart,
    X,
    ChevronDown,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { toast } from "sonner";

interface AlertItem {
    id: string;
    type: string;
    message: string;
    product?: { id: string; name: string; stock: number } | null;
    productId?: string | null;
}

interface CriticalProduct {
    id: string;
    name: string;
    stock: number;
    criticalStock: number;
    category?: { name: string } | null;
}

interface Supplier {
    id: string;
    name: string;
    phone?: string | null;
}

interface SupplierAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: AlertItem[];
    suppliers: Supplier[];
    criticalProducts: CriticalProduct[];
}

const getAlertStyle = (type: string) => {
    switch (type) {
        case "CRITICAL":
            return { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "KRİTİK" };
        case "LOW_STOCK":
            return { icon: Package, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "TÜKENDİ" };
        case "TRENDING":
            return { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "TREND" };
        case "STAGNANT":
            return { icon: History, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "HAREKETSİZ" };
        default:
            return { icon: Package, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", label: "BİLGİ" };
    }
};

// Mini supplier picker that appears inline per product
function SupplierPickerRow({
    product,
    suppliers,
}: {
    product: { productId: string | null; name: string };
    suppliers: Supplier[];
}) {
    const { assignProductToSupplier, orders } = useSupplierOrders();
    const [open, setOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");
    const [qty, setQty] = useState(1);

    // Check if already added to any supplier
    const addedTo = Object.entries(orders)
        .filter(([, list]) =>
            list.items.some((i) =>
                product.productId ? i.productId === product.productId : i.name === product.name
            )
        )
        .map(([, list]) => list.supplierName);

    const handleAdd = () => {
        if (!selectedSupplier) return;
        const supplier = suppliers.find((s) => s.id === selectedSupplier);
        if (!supplier) return;
        assignProductToSupplier(
            selectedSupplier,
            supplier.name,
            supplier.phone ?? undefined,
            { productId: product.productId, name: product.name },
            qty
        );
        setOpen(false);
        setSelectedSupplier("");
        setQty(1);
    };

    return (
        <div className="flex flex-col gap-2">
            {addedTo.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {addedTo.map((name) => (
                        <Badge key={name} className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-bold px-2 py-0.5 gap-1">
                            <Check className="h-2.5 w-2.5" /> {name}
                        </Badge>
                    ))}
                </div>
            )}

            {!open ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(true)}
                    className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 p-0 shrink-0"
                    title="Tedarikçiye ekle"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10 flex-wrap">
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger className="h-8 text-xs font-bold bg-white/5 border-white/10 rounded-lg w-36 focus:ring-blue-500">
                            <SelectValue placeholder="Tedarikçi seç..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                            {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs font-bold">
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold text-foreground w-6 text-center">{qty}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
                            onClick={() => setQty((q) => q + 1)}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        disabled={!selectedSupplier}
                        onClick={handleAdd}
                        className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                    >
                        <Check className="h-3 w-3 mr-1" /> Ekle
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-white/10"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export function SupplierAnalysisModal({
    isOpen,
    onClose,
    alerts,
    suppliers,
    criticalProducts,
}: SupplierAnalysisModalProps) {
    const [showAll, setShowAll] = useState(false);

    // Merge AI alerts products + critical products without AI alerts
    const aiProductIds = alerts.map((a) => a.productId).filter(Boolean);
    const additionalCritical = criticalProducts.filter(
        (p) => !aiProductIds.includes(p.id)
    );

    const urgentAlerts = alerts.filter((a) => a.type === "CRITICAL" || a.type === "LOW_STOCK");
    const trendingAlerts = alerts.filter((a) => a.type === "TRENDING");
    const totalUrgent = urgentAlerts.length + additionalCritical.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-card border border-white/5 p-0 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="relative p-8 bg-gradient-to-br from-blue-600/10 to-transparent border-b border-white/5 overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)] shrink-0">
                            <Brain className="h-7 w-7 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <Badge className="bg-blue-600/10 text-blue-500 border-none text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-2">
                                Tedarik Zinciri Analizi
                            </Badge>
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                                Sipariş Listesi Oluştur
                            </DialogTitle>
                            <p className="text-sm text-slate-400 font-medium mt-1">
                                Her ürüne <span className="text-blue-400 font-bold">+</span> basarak tedarikçi seç ve sipariş listene ekle
                            </p>
                        </div>
                    </div>

                    {/* Summary chips */}
                    <div className="relative z-10 flex gap-3 mt-5 flex-wrap">
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2">
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                            <span className="text-xs font-bold text-rose-400">{totalUrgent} Acil Ürün</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-xs font-bold text-blue-400">{trendingAlerts.length} Trend Ürün</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                            <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-400">{suppliers.length} Tedarikçi</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Urgent: AI Critical/LowStock alerts */}
                    {urgentAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                AI TESPİTLERİ — ACİL TEDARİK
                            </h3>
                            {urgentAlerts.map((alert) => {
                                const style = getAlertStyle(alert.type);
                                const Icon = style.icon;
                                const product = { productId: alert.productId ?? alert.product?.id ?? null, name: alert.product?.name || alert.message.split(" ")[0] };
                                return (
                                    <div key={alert.id} className={cn("flex items-start gap-4 p-5 rounded-2xl border", style.bg, style.border)}>
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", style.bg, style.border)}>
                                            <Icon className={cn("h-5 w-5", style.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={cn("text-[8px] font-bold border-none px-2 py-0.5", style.bg, style.color)}>{style.label}</Badge>
                                                {alert.product && (
                                                    <span className="text-[10px] font-bold text-slate-500">{alert.product.name} — {alert.product.stock} adet</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-foreground leading-snug">{alert.message}</p>
                                            <div className="mt-3">
                                                <SupplierPickerRow product={product} suppliers={suppliers} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Additional critical products not covered by AI alerts */}
                    {additionalCritical.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                KRİTİK / TÜKENEN TÜM ÜRÜNLER
                            </h3>
                            {(showAll ? additionalCritical : additionalCritical.slice(0, 5)).map((p) => (
                                <div key={p.id} className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border",
                                    p.stock <= 0 ? "bg-rose-500/5 border-rose-500/15" : "bg-amber-500/5 border-amber-500/15"
                                )}>
                                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", p.stock <= 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                                        <Package className={cn("h-4 w-4", p.stock <= 0 ? "text-rose-400" : "text-amber-400")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn("text-[8px] font-bold border-none px-2 py-0.5", p.stock <= 0 ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400")}>
                                                {p.stock <= 0 ? "TÜKENDİ" : "KRİTİK"}
                                            </Badge>
                                            {p.category && <span className="text-[9px] text-slate-600 font-bold">{p.category.name}</span>}
                                        </div>
                                        <p className="text-sm font-bold text-foreground">{p.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            Mevcut: <span className={cn("font-bold", p.stock <= 0 ? "text-rose-400" : "text-amber-400")}>{p.stock}</span> / Kritik Seviye: {p.criticalStock}
                                        </p>
                                    </div>
                                    <SupplierPickerRow
                                        product={{ productId: p.id, name: p.name }}
                                        suppliers={suppliers}
                                    />
                                </div>
                            ))}
                            {additionalCritical.length > 5 && !showAll && (
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                    {additionalCritical.length - 5} ürün daha göster
                                </button>
                            )}
                        </div>
                    )}

                    {/* Trending */}
                    {trendingAlerts.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                TREND ÜRÜNLER — STOK TAKVİYESİ
                            </h3>
                            {trendingAlerts.map((alert) => {
                                const style = getAlertStyle(alert.type);
                                const Icon = style.icon;
                                const product = { productId: alert.productId ?? alert.product?.id ?? null, name: alert.product?.name || alert.message.split(" ")[0] };
                                return (
                                    <div key={alert.id} className={cn("flex items-start gap-4 p-4 rounded-2xl border", style.bg, style.border)}>
                                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", style.bg, style.border)}>
                                            <Icon className={cn("h-4 w-4", style.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Badge className={cn("text-[8px] font-bold border-none px-2 py-0.5 mb-1", style.bg, style.color)}>{style.label}</Badge>
                                            <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                                            <div className="mt-3">
                                                <SupplierPickerRow product={product} suppliers={suppliers} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {alerts.length === 0 && additionalCritical.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                <Sparkles className="h-8 w-8 text-slate-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-500 uppercase text-sm">Her Şey Yolunda</h3>
                                <p className="text-xs text-slate-600 font-medium mt-1">Kritik stok uyarısı bulunmuyor.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-white/5 flex justify-end shrink-0">
                    <Button
                        onClick={onClose}
                        className="h-11 px-8 rounded-2xl bg-white/5 border border-white/10 text-foreground hover:bg-white/10 font-bold"
                    >
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
