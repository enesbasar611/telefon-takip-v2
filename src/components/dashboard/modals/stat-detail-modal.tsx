"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    getDebtDetails,
    getCollectionDetails,
    getDailySalesDetails,
    getRepairIncomeDetails,
    getPendingServicesDetails,
    getReadyDevicesDetails,
    getCriticalStockDetails,
    getAccountBalanceDetails
} from "@/lib/actions/dashboard-detail-actions";
import { Loader2, Plus, ChevronRight, ArrowRight, Wallet, Landmark, CreditCard, User, Package, Wrench, ShoppingCart, Banknote, Clock, CheckCircle2, AlertTriangle, ArrowDownCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useShortage } from "@/lib/context/shortage-context";
import { toast } from "sonner";

export type StatType =
    | "DAILY_SALES"
    | "REPAIR_INCOME"
    | "COLLECTIONS"
    | "PENDING_SERVICES"
    | "READY_DEVICES"
    | "CRITICAL_STOCK"
    | "TOTAL_DEBTS"
    | "CASH_BALANCE";

interface StatDetailModalProps {
    type: StatType | null;
    isOpen: boolean;
    onClose: () => void;
    statsData?: any;
}

export function StatDetailModal({ type, isOpen, onClose, statsData }: StatDetailModalProps) {
    const { addShortage } = useShortage();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [paymentDescription, setPaymentDescription] = useState<string>("");
    const [paying, setPaying] = useState(false);
    const [addingToShortage, setAddingToShortage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!type) return;
        setLoading(true);
        try {
            let result: any[] = [];
            switch (type) {
                case "TOTAL_DEBTS": result = await getDebtDetails(); break;
                case "COLLECTIONS": result = await getCollectionDetails(); break;
                case "DAILY_SALES": result = await getDailySalesDetails(); break;
                case "REPAIR_INCOME": result = await getRepairIncomeDetails(); break;
                case "PENDING_SERVICES": result = await getPendingServicesDetails(); break;
                case "READY_DEVICES": result = await getReadyDevicesDetails(); break;
                case "CRITICAL_STOCK": result = await getCriticalStockDetails(); break;
                case "CASH_BALANCE": result = await getAccountBalanceDetails(); break;
            }
            setData(result);

            if (type === "TOTAL_DEBTS") {
                const accs = await getAccountBalanceDetails();
                setAccounts(accs);
                if (accs.length > 0) setSelectedAccountId(accs[0].id);
            }
        } catch (error) {
            toast.error("Veri yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [type]);

    useEffect(() => {
        if (isOpen && type) {
            console.log("İstek atıldı: StatDetailModal fetch", type);
            fetchData();
        } else {
            setData([]);
            setSelectedSupplier(null);
            setPaymentAmount("");
            setPaymentDescription("");
            setAddingToShortage(null);
        }
    }, [isOpen, type, fetchData]);

    const handleAddShortage = async (product: any) => {
        setAddingToShortage(product.id);
        try {
            await addShortage({
                productId: product.id,
                name: product.name,
                quantity: product.criticalStock > product.stock ? (product.criticalStock - product.stock) : 5
            });
        } finally {
            setAddingToShortage(null);
        }
    };

    const handlePayDebt = async () => {
        if (!selectedSupplier || !selectedAccountId || !paymentAmount) {
            toast.error("Lütfen tüm alanları doldurun.");
            return;
        }

        setPaying(true);
        try {
            const { paySupplierDebt } = await import("@/lib/actions/finance-actions");
            const res = await paySupplierDebt({
                supplierId: selectedSupplier.id,
                accountId: selectedAccountId,
                amount: Number(paymentAmount),
                description: paymentDescription || "Hızlı Ödeme (Dashboard)"
            });

            if (res.success) {
                toast.success("Ödeme başarıyla gerçekleştirildi.");
                setSelectedSupplier(null);
                setPaymentAmount("");
                setPaymentDescription("");
                fetchData();
            } else {
                toast.error(res.error || "Ödeme sırasında hata oluştu.");
            }
        } catch (error) {
            toast.error("İşlem başarısız oldu.");
        } finally {
            setPaying(false);
        }
    };

    const getModalConfig = () => {
        switch (type) {
            case "DAILY_SALES": return { title: "KASA HAREKETLERİ", icon: ShoppingCart, color: "text-primary", route: "/satis/gecmis" };
            case "REPAIR_INCOME": return { title: "TAMİR GELİRLERİ", icon: Wrench, color: "text-secondary", route: "/servis/liste" };
            case "COLLECTIONS": return { title: "TAHSİLATLAR", icon: Banknote, color: "text-amber-500", route: "/satis/kasa" };
            case "PENDING_SERVICES": return { title: "BEKLEYEN SERVİSLER", icon: Clock, color: "text-blue-500", route: "/servis/liste" };
            case "READY_DEVICES": return { title: "HAZIR CİHAZLAR", icon: CheckCircle2, color: "text-emerald-500", route: "/servis/liste?status=READY" };
            case "CRITICAL_STOCK": return { title: "KRİTİK STOK", icon: AlertTriangle, color: "text-rose-500", route: "/stok" };
            case "TOTAL_DEBTS": return { title: "TOPLAM BORÇLAR", icon: ArrowDownCircle, color: "text-indigo-500", route: "/tedarikciler" };
            case "CASH_BALANCE": return { title: "KASA & HESAPLAR", icon: Wallet, color: "text-primary", route: "/satis/kasa" };
            default: return { title: "DETAY", icon: LayoutDashboard, color: "text-primary", route: "/" };
        }
    };

    const getItemRoute = (item: any) => {
        const baseRoute = config.route.split('?')[0];
        const highlightParam = `highlight=${item.id}`;
        if (type === "REPAIR_INCOME" || type === "PENDING_SERVICES" || type === "READY_DEVICES") {
            return `${baseRoute}?${highlightParam}&ticket=${item.ticketNumber}`;
        }
        return `${baseRoute}?${highlightParam}`;
    };


    const config = getModalConfig();
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] border-border/40 p-0 overflow-hidden bg-background/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
                <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r",
                    type === "TOTAL_DEBTS" ? "from-indigo-500 to-purple-600" :
                        type === "COLLECTIONS" ? "from-amber-500 to-orange-600" :
                            type === "CRITICAL_STOCK" ? "from-rose-500 to-red-600" :
                                "from-blue-600 to-indigo-600"
                )} />

                <div className="p-10">
                    <DialogHeader className="mb-8 p-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner",
                                    config.color.replace("text-", "bg-").replace("-500", "-500/10").replace("-600", "-600/10")
                                )}>
                                    <Icon className={cn("h-7 w-7", config.color)} />
                                </div>
                                <div>
                                    <DialogTitle className="font-medium text-2xl  tracking-tight uppercase">
                                        {selectedSupplier ? "ÖDEME YAP: " + selectedSupplier.name : config.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-[11px]  text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                                        {selectedSupplier ? "BORÇ ÖDEME SİHİRBAZI" : "Sistem Kayıtları ve Detaylı Analiz"}
                                    </DialogDescription>
                                </div>
                            </div>
                            {!selectedSupplier ? (
                                <Link href={config.route}>
                                    <Button variant="outline" className="rounded-xl h-9 text-[10px]  uppercase tracking-widest px-4 border-border/40 hover:bg-muted transition-all">
                                        TÜMÜNE GİT <ChevronRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="ghost" onClick={() => setSelectedSupplier(null)} className="rounded-full h-10 w-10 p-0 text-muted-foreground hover:text-foreground">
                                    <ArrowRight className="h-5 w-5 rotate-180" />
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedSupplier ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px]  text-muted-foreground uppercase opacity-60">TOPLAM GÜNCEL BORÇ</span>
                                    <span className="text-xl  text-indigo-500 tracking-tight">₺{Number(selectedSupplier.balance).toLocaleString('tr-TR')}</span>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-indigo-500/10">
                                    <div className="space-y-2">
                                        <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest">ÖDEME YAPILACAK HESAP</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {accounts.map((acc) => (
                                                <button
                                                    key={acc.id}
                                                    onClick={() => setSelectedAccountId(acc.id)}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all relative overflow-hidden group",
                                                        selectedAccountId === acc.id
                                                            ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20"
                                                            : "bg-background border-border/40 hover:border-indigo-500/30"
                                                    )}
                                                >
                                                    <div className={cn("text-[10px]  uppercase tracking-tighter mb-1", selectedAccountId === acc.id ? "text-white" : "text-foreground")}>{acc.name}</div>
                                                    <div className={cn("text-xs ", selectedAccountId === acc.id ? "text-indigo-100" : "text-emerald-500")}>₺{Number(acc.balance).toLocaleString('tr-TR')}</div>
                                                    {selectedAccountId === acc.id && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest">ÖDEME TUTARI (₺)</Label>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="Tutar giriniz..."
                                            className="w-full h-12 bg-background border border-border/40 rounded-xl px-4 text-sm  focus:border-indigo-500 focus:outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-medium text-[10px]  text-muted-foreground uppercase tracking-widest">AÇIKLAMA (OPSİYONEL)</Label>
                                        <input
                                            type="text"
                                            value={paymentDescription}
                                            onChange={(e) => setPaymentDescription(e.target.value)}
                                            placeholder="Ödeme notu..."
                                            className="w-full h-12 bg-background border border-border/40 rounded-xl px-4 text-sm  focus:border-indigo-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handlePayDebt}
                                disabled={paying || !paymentAmount}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xs  uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
                            >
                                {paying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CreditCard className="h-5 w-5 mr-2" />}
                                ÖDEMEYİ ONAYLA VE TAMAMLA
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-xs  uppercase tracking-[0.2em] animate-pulse">Veriler Getiriliyor...</p>
                                </div>
                            ) : data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/40 text-center uppercase">
                                    <div className="h-16 w-16 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <p className="text-xs  tracking-widest">Henüz bir kayıt bulunamadı</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {type === "TOTAL_DEBTS" && (
                                        <div className="space-y-4">
                                            {data.map((supplier: any) => (
                                                <div key={supplier.id} className="p-5 rounded-[1.5rem] bg-muted/20 border border-border/40 group hover:border-indigo-500/30 transition-all">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-background border border-border/40 flex items-center justify-center">
                                                                <User className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-sm  uppercase tracking-tight">{supplier.name}</h4>
                                                                <p className="text-[10px]  text-muted-foreground opacity-60 uppercase">{supplier.phone || "Telefon Yok"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">BEKLEYEN BORÇ</p>
                                                            <p className="text-lg  text-indigo-500 tracking-tight">₺{Number(supplier.balance).toLocaleString('tr-TR')}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedSupplier(supplier);
                                                            setPaymentAmount(String(supplier.balance));
                                                        }}
                                                        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[10px]  uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                                    >
                                                        ÖDEME YAP <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {type === "COLLECTIONS" && (
                                        <div className="space-y-3">
                                            {data.map((item: any) => (
                                                <div key={item.id} className="p-4 rounded-2xl bg-muted/20 border border-border/10 flex items-center justify-between group hover:bg-background/50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm">
                                                            <Banknote className="h-5 w-5 text-amber-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-sm  uppercase tracking-tight">{item.sale?.customer?.name || "Hızlı Satış"}</h4>
                                                            <p className="text-[10px]  text-muted-foreground opacity-60 uppercase tracking-tighter">
                                                                {item.createdAt ? format(new Date(item.createdAt), "HH:mm", { locale: tr }) : "00:00"} • {item.account?.name || "Kasa"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">TUTAR</p>
                                                        <p className="text-base  text-emerald-500 tracking-tight">₺{Number(item.amount).toLocaleString('tr-TR')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {type === "CRITICAL_STOCK" && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {data.map((product: any) => (
                                                <div key={product.id} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between group hover:bg-rose-500/10 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm relative overflow-hidden shrink-0">
                                                            <Package className={cn("h-6 w-6", product.stock === 0 ? "text-rose-500" : "text-amber-500")} />
                                                            {product.stock === 0 && <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-medium text-sm  uppercase tracking-tight line-clamp-1">{product.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[8px]  border-rose-500/30 text-rose-500 px-2 py-0">KRİTİK</Badge>
                                                                <span className="text-[10px]  text-muted-foreground/60 uppercase truncate">{product.category?.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0 px-2">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">STOK</p>
                                                            <p className={cn("text-base  tracking-tight", product.stock === 0 ? "text-rose-600" : "text-amber-600")}>
                                                                {product.stock} {product.unit || 'ADET'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAddShortage(product)}
                                                            disabled={addingToShortage === product.id}
                                                            className="h-9 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20 shadow-none transition-all flex items-center gap-2  text-[10px] uppercase tracking-widest"
                                                        >
                                                            {addingToShortage === product.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Plus className="h-3.5 w-3.5" />
                                                            )}
                                                            <span className="hidden xs:inline">Eksiğe Ekle</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* DAILY SALES specific header stats */}
                                    {type === "DAILY_SALES" && statsData && (
                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="bg-muted/10 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px]  text-muted-foreground uppercase tracking-widest mb-1 opacity-70">KASA AÇILIŞ</span>
                                                <span className="text-sm  text-foreground">{statsData.kasaOpeningBalance || "₺0"}</span>
                                            </div>
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px]  text-emerald-600/70 uppercase tracking-widest mb-1">GÜNLÜK SATIŞ</span>
                                                <span className="text-sm  text-emerald-500">+{statsData.todaySales || "₺0"}</span>
                                            </div>
                                            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-[9px]  text-primary/70 uppercase tracking-widest mb-1">GÜNCEL KASA</span>
                                                <span className="text-sm  text-primary">{statsData.kasaBalance || "₺0"}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* General purpose list for other types */}
                                    {["DAILY_SALES", "REPAIR_INCOME", "PENDING_SERVICES", "READY_DEVICES", "CASH_BALANCE"].includes(type || "") && (
                                        <div className="space-y-3">
                                            {data.map((item: any, idx: number) => {
                                                let title = item.customer?.name || item.name || (item.deviceBrand ? item.deviceBrand + " " + item.deviceModel : "Kayıt " + (idx + 1));
                                                let subtitle = item.ticketNumber ? "#" + item.ticketNumber : item.description || (item.type ? item.type : "Detaylar");
                                                const value = item.finalAmount || item.actualCost || (item.balance !== undefined ? item.balance : null);

                                                if (type === "DAILY_SALES") {
                                                    title = item.saleNumber || `Satış #${idx + 1}`;
                                                    const productNames = item.items?.map((i: any) => i.product?.name).join(', ') || "Ürün Yok";
                                                    subtitle = `Satılan: ${productNames}`;
                                                }

                                                return (
                                                    <Link
                                                        key={item.id || idx}
                                                        href={getItemRoute(item)}
                                                        className="p-4 rounded-2xl bg-muted/20 border border-border/10 flex items-center justify-between group hover:bg-background/50 hover:border-primary/30 transition-all cursor-pointer block"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105",
                                                                type === "READY_DEVICES" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-background border-border/40 text-muted-foreground"
                                                            )}>
                                                                {type === "CASH_BALANCE" ? (
                                                                    item.type === 'BANK' ? <Landmark className="h-5 w-5 text-emerald-500" /> :
                                                                        (item.type === 'POS' || item.type === 'CREDIT_CARD') ? <CreditCard className="h-5 w-5 text-purple-500" /> :
                                                                            <Wallet className="h-5 w-5 text-blue-500" />
                                                                ) : type === "DAILY_SALES" ? (
                                                                    <ShoppingCart className="h-5 w-5 text-foreground/40" />
                                                                ) : (
                                                                    <ChevronRight className="h-5 w-5 opacity-40" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-medium text-[13px]  uppercase tracking-tight line-clamp-1">{String(title || "Bilinmiyor")}</h4>
                                                                <p className="text-[10px]  text-muted-foreground opacity-60 uppercase tracking-tighter truncate mt-0.5">
                                                                    {String(subtitle || "Detay Yok")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {value !== null && (
                                                            <div className="text-right">
                                                                <p className="text-[10px]  text-muted-foreground/60 uppercase tracking-widest mb-1">TUTAR</p>
                                                                <p className={cn(
                                                                    "text-base  tracking-tight",
                                                                    type === "DAILY_SALES" || type === "REPAIR_INCOME" || type === "CASH_BALANCE" ? "text-emerald-500" : "text-foreground"
                                                                )}>
                                                                    {type === "DAILY_SALES" || type === "REPAIR_INCOME" ? "+" : ""}
                                                                    ₺{Number(value).toLocaleString('tr-TR')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

const LayoutDashboard = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="15" rx="1" />
    </svg>
);






