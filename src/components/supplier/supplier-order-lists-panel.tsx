"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreateSupplierModal } from "@/components/supplier/create-supplier-modal";
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
    Loader2,
    User
} from "lucide-react";
import { useSupplierOrders } from "@/lib/context/supplier-order-context";
import { createPurchaseOrderAction } from "@/lib/actions/purchase-actions";
import { getStaffShell } from "@/lib/actions/staff-actions";
import { bulkAssignProductsToCourier } from "@/lib/actions/shortage-actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";

interface SupplierOrderListsPanelProps {
    isOpen?: boolean;
    onClose?: () => void;
    isInline?: boolean;
}

export function SupplierOrderListsPanel({ isOpen, onClose, isInline }: SupplierOrderListsPanelProps) {
    const { orders, updateQty, removeProduct, clearSupplier, totalItemCount } = useSupplierOrders();
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set(Object.keys(orders)));
    const [orderingStatus, setOrderingStatus] = useState<Record<string, "idle" | "loading" | "success">>({});
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [couriers, setCouriers] = useState<any[]>([]);
    const [isAssigning, setIsAssigning] = useState<Record<string, boolean>>({});

    useEffect(() => {
        getStaffShell().then(data => {
            setCouriers(data.filter((u: any) => u.role === "COURIER" || u.role === "ADMIN" || u.role === "SHOP_MANAGER"));
        });
    }, []);

    const supplierIds = Object.keys(orders);

    const toggleExpand = (id: string) => {
        setExpandedSuppliers((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleWhatsAppClick = (supplierId: string) => {
        const list = orders[supplierId];
        if (!list) return;

        const lines = list.items
            .map((item) => `- ${item.name} x${item.quantity}`)
            .join("\n");

        const initialMessage = `*Sipariş Listesi — ${list.supplierName}*\n\n${lines}\n\n_TakipV2 sistemi üzerinden gönderildi._`;

        setSelectedSupplier({
            id: supplierId,
            name: list.supplierName,
            phone: list.supplierPhone,
            message: initialMessage
        });
        setWhatsappModalOpen(true);
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

    const handleAssignToCourier = async (supplierId: string, items: any[], courierId: string, courierName: string) => {
        const assignmentItems = items
            .filter(i => i.productId)
            .map(i => ({ productId: i.productId, quantity: i.quantity }));

        if (assignmentItems.length === 0) {
            toast.error("Atanacak geçerli ürün bulunamadı.");
            return;
        }

        setIsAssigning(prev => ({ ...prev, [supplierId]: true }));
        try {
            const res = await bulkAssignProductsToCourier(assignmentItems, courierId);
            if (res.success) {
                toast.success(`Ürünler ${courierName} kuryesine atandı!`);
                clearSupplier(supplierId);
            } else {
                toast.error(res.error || "Atama işlemi başarısız.");
            }
        } catch (error) {
            toast.error("Beklenmeyen bir hata oluştu.");
        } finally {
            setIsAssigning(prev => ({ ...prev, [supplierId]: false }));
        }
    };

    const handleClearSupplier = (supplierId: string, name: string) => {
        clearSupplier(supplierId);
        toast.success(`${name} sipariş listesi temizlendi.`);
    };

    const content = (
        <div className={cn(
            "flex flex-col overflow-hidden",
            isInline ? "bg-card border border-border/50 rounded-[2rem]" : "h-full w-full"
        )}>
            {/* Header */}
            <div className="p-6 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                        <ShoppingBasket className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Tedarikçi Siparişleri</h2>
                        <p className="text-xs text-muted-foreground font-medium">
                            {supplierIds.length} tedarikçi · {totalItemCount} ürün
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                {supplierIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/5 border border-border flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-slate-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium  text-muted-foreground/80 uppercase text-sm">Liste Boş</h3>
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
                            <div key={supplierId} className="rounded-2xl bg-white/[0.02] border border-border/50 overflow-hidden">
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
                                    <div className="border-t border-border/50">
                                        <div className="p-3 space-y-2">
                                            {list.items.map((item, idx) => (
                                                <div
                                                    key={`${item.productId ?? item.name}-${idx}`}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] group"
                                                >
                                                    <div className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center shrink-0">
                                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </div>
                                                    <span className="flex-1 text-xs  text-foreground truncate">{item.name}</span>

                                                    {/* Qty controls */}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => updateQty(supplierId, item.productId, item.name, item.quantity - 1)}
                                                            className="h-6 w-6 rounded-md bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                                        >
                                                            <Minus className="h-2.5 w-2.5" />
                                                        </button>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQty(supplierId, item.productId, item.name, parseInt(e.target.value) || 1)}
                                                            className="h-6 w-10 text-center bg-white/5 border-border text-[11px]  text-blue-400 px-1 rounded-md focus-visible:ring-blue-500"
                                                        />
                                                        <button
                                                            onClick={() => updateQty(supplierId, item.productId, item.name, item.quantity + 1)}
                                                            className="h-6 w-6 rounded-md bg-white/5 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                                        >
                                                            <Plus className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="h-6 w-6 rounded-md text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                            >
                                                                <User className="h-3 w-3" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-xl font-medium">
                                                            {couriers.length === 0 ? (
                                                                <div className="p-2 text-[10px] text-center text-muted-foreground">Aktif kurye yok</div>
                                                            ) : (
                                                                couriers.map((courier) => (
                                                                    <DropdownMenuItem
                                                                        key={courier.id}
                                                                        onClick={() => handleAssignToCourier(supplierId, [item], courier.id, `${courier.name} ${courier.surname || ""}`)}
                                                                        className="text-[11px] cursor-pointer rounded-lg flex items-center gap-2"
                                                                    >
                                                                        <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center">
                                                                            <User className="h-3 w-3 text-orange-500" />
                                                                        </div>
                                                                        {courier.name} {courier.surname}
                                                                    </DropdownMenuItem>
                                                                ))
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

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
                                                onClick={() => handleWhatsAppClick(supplierId)}
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

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        disabled={isAssigning[supplierId]}
                                                        className="flex-1 h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[10px] gap-2"
                                                    >
                                                        {isAssigning[supplierId] ? (
                                                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                                        ) : (
                                                            <User className="h-4 w-4 shrink-0" />
                                                        )}
                                                        <span className="truncate">Kuryeye Ata</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                    {couriers.length === 0 ? (
                                                        <div className="p-2 text-xs text-center text-muted-foreground">Aktif kurye bulunamadı</div>
                                                    ) : (
                                                        couriers.map((courier) => (
                                                            <DropdownMenuItem
                                                                key={courier.id}
                                                                onClick={() => handleAssignToCourier(supplierId, list.items, courier.id, `${courier.name} ${courier.surname || ""}`)}
                                                                className="text-xs cursor-pointer rounded-lg"
                                                            >
                                                                {courier.name} {courier.surname}
                                                            </DropdownMenuItem>
                                                        ))
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

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

            {selectedSupplier && (
                <WhatsAppConfirmModal
                    isOpen={whatsappModalOpen}
                    onClose={() => {
                        setWhatsappModalOpen(false);
                        setSelectedSupplier(null);
                    }}
                    phone={selectedSupplier.phone || ""}
                    customerName={selectedSupplier.name}
                    initialMessage={selectedSupplier.message}
                />
            )}
        </div>
    );

    if (isInline) return content;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:w-[480px] bg-card border-l border-border/50 p-0">
                {content}
            </SheetContent>
        </Sheet>
    );
}

