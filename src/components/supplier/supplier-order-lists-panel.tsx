"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Truck,
    Trash2,
    MessageCircle,
    Package,
    Plus,
    Minus,
    ChevronDown,
    ChevronRight,
    ShoppingBasket,
    Sparkles,
    CheckCircle2,
    ClipboardList,
    Loader2
} from "lucide-react";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SupplierOrderListsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupplierOrderListsPanel({ isOpen, onClose }: SupplierOrderListsPanelProps) {
    const { orders, updateQty, removeProduct, clearSupplier, totalItemCount } = useSupplierOrders();
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set(Object.keys(orders)));
    const [orderingStatus, setOrderingStatus] = useState<Record<string, "idle" | "loading" | "success">>({});

    const supplierIds = Object.keys(orders);

    const toggleExpand = (id: string) => {
        setExpandedSuppliers((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const sendWhatsApp = (supplierId: string) => {
        const list = orders[supplierId];
        if (!list) return;

        const lines = list.items
            .map((item) => `- ${item.name} x${item.quantity}`)
            .join("\n");

        const message = encodeURIComponent(
            `*Sipariş Listesi — ${list.supplierName}*\n\n${lines}\n\n_TakipV2 sistemi üzerinden gönderildi._`
        );

        const phone = list.supplierPhone?.replace(/\D/g, "") ?? "";
        const url = phone
            ? `https://wa.me/${phone.startsWith("0") ? "90" + phone.slice(1) : phone}?text=${message}`
            : `https://wa.me?text=${message}`;

        window.open(url, "_blank");
        toast.success(`${list.supplierName} için WhatsApp açılıyor...`);
    };

    const handleCreateOrder = async (supplierId: string, items: any[], supplierName: string) => {
        setOrderingStatus((prev) => ({ ...prev, [supplierId]: "loading" }));
        try {
            const res = await createPurchaseOrderAction({
                supplierId,
                orderNo: `PO-${Date.now()}`,
                items: items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    buyPrice: 0,
                })),
                totalAmount: 0,
                vatAmount: 0,
                netAmount: 0,
                description: "Eksikler listesinden otomatik oluşturuldu",
            });

            if (res.success) {
                setOrderingStatus((prev) => ({ ...prev, [supplierId]: "success" }));
                toast.success(`${supplierName} siparişi oluşturuldu!`);
                setTimeout(() => {
                    setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
                    clearSupplier(supplierId);
                }, 1500);
            } else {
                toast.error("Sipariş oluşturulamadı.");
                setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
            }
        } catch (err) {
            setOrderingStatus((prev) => ({ ...prev, [supplierId]: "idle" }));
            toast.error("Beklenmeyen bir hata oluştu.");
        }
    };

    const handleClearSupplier = (supplierId: string, name: string) => {
        clearSupplier(supplierId);
        toast.success(`${name} sipariş listesi temizlendi.`);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:w-[480px] bg-card border-l border-white/5 p-0 flex flex-col overflow-hidden">
                {/* Header */}
                <SheetHeader className="p-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                            <ShoppingBasket className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <SheetTitle className="text-base  text-foreground">Tedarikçi Sipariş Listeleri</SheetTitle>
                            <p className="text-xs text-muted-foreground font-medium">
                                {supplierIds.length} tedarikçi · {totalItemCount} ürün
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {supplierIds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-slate-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-medium  text-slate-500 uppercase text-sm">Liste Boş</h3>
                                <p className="text-xs text-slate-600 font-medium mt-1 max-w-44 leading-relaxed">
                                    Analiz modalındaki + butonuyla ürün ekleyin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        supplierIds.map((supplierId) => {
                            const list = orders[supplierId];
                            const isExpanded = expandedSuppliers.has(supplierId);
                            const totalQty = list.items.reduce((s, i) => s + i.quantity, 0);

                            return (
                                <div key={supplierId} className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                                    {/* Supplier header row */}
                                    <button
                                        onClick={() => toggleExpand(supplierId)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-all text-left"
                                    >
                                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                            <Truck className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className=" text-sm text-foreground truncate">{list.supplierName}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">
                                                {list.items.length} çeşit · {totalQty} adet
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px]  px-2">
                                                {list.items.length}
                                            </Badge>
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded items */}
                                    {isExpanded && (
                                        <div className="border-t border-white/5">
                                            <div className="p-3 space-y-2">
                                                {list.items.map((item, idx) => (
                                                    <div
                                                        key={`${item.productId ?? item.name}-${idx}`}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group"
                                                    >
                                                        <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                        </div>
                                                        <span className="flex-1 text-xs  text-foreground truncate">{item.name}</span>

                                                        {/* Qty controls */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => updateQty(supplierId, item.productId, item.name, item.quantity - 1)}
                                                                className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                                            >
                                                                <Minus className="h-2.5 w-2.5" />
                                                            </button>
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQty(supplierId, item.productId, item.name, parseInt(e.target.value) || 1)}
                                                                className="h-6 w-10 text-center bg-white/5 border-white/10 text-[11px]  text-blue-400 px-1 rounded-md focus-visible:ring-blue-500"
                                                            />
                                                            <button
                                                                onClick={() => updateQty(supplierId, item.productId, item.name, item.quantity + 1)}
                                                                className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                                            >
                                                                <Plus className="h-2.5 w-2.5" />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeProduct(supplierId, item.productId, item.name)}
                                                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="px-3 pb-3 flex items-center gap-2">
                                                <Button
                                                    onClick={() => sendWhatsApp(supplierId)}
                                                    className="flex-1 h-10 rounded-xl bg-[#25D366] hover:bg-[#22c55e] text-white  text-[10px] gap-2"
                                                >
                                                    <MessageCircle className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">WhatsApp Gönder</span>
                                                </Button>

                                                <Button
                                                    onClick={() => handleCreateOrder(supplierId, list.items, list.supplierName)}
                                                    disabled={orderingStatus[supplierId] !== undefined && orderingStatus[supplierId] !== "idle"}
                                                    className={cn(
                                                        "flex-1 text-white  text-[10px] h-10 rounded-xl gap-2 transition-all",
                                                        orderingStatus[supplierId] === "success"
                                                            ? "bg-emerald-500 hover:bg-emerald-600"
                                                            : "bg-blue-600 hover:bg-blue-500"
                                                    )}
                                                >
                                                    {orderingStatus[supplierId] === "loading" ? (
                                                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                                    ) : orderingStatus[supplierId] === "success" ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 shrink-0" /> <span className="truncate">Sipariş Verildi</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ClipboardList className="h-4 w-4 shrink-0" /> <span className="truncate">Sipariş Ver</span>
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleClearSupplier(supplierId, list.supplierName)}
                                                    className="h-10 px-3 shrink-0 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20  text-xs"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}




