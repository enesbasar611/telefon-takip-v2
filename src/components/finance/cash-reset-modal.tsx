"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Archive, AlertTriangle, CalendarDays, TrendingUp, TrendingDown, DollarSign, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";
import { resetCashRegisters, autoCloseMonth, getMonthClosurePreview } from "@/lib/actions/finance-actions";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const MONTHS = [
    { value: 1, label: "Ocak" },
    { value: 2, label: "Şubat" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" },
    { value: 5, label: "Mayıs" },
    { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" },
    { value: 8, label: "Ağustos" },
    { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" },
    { value: 11, label: "Kasım" },
    { value: 12, label: "Aralık" },
];

export function CashResetModal({ 
    trigger, 
    accounts, 
    defaultTab = "MONTH" 
}: { 
    trigger?: React.ReactNode; 
    accounts?: any[];
    defaultTab?: "MONTH" | "LIVE";
}) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"MONTH" | "LIVE">(defaultTab);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    // Month closing state
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Default to current month or previous month if at the beginning of a month
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [monthNotes, setMonthNotes] = useState("");
    const [resetLiveAccounts, setResetLiveAccounts] = useState(false);

    // Preview data state
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    // Fetch preview whenever selectedYear or selectedMonth changes
    useEffect(() => {
        if (!open || activeTab !== "MONTH") return;
        let isMounted = true;
        setPreviewLoading(true);

        getMonthClosurePreview(selectedYear, selectedMonth)
            .then((res) => {
                if (isMounted) {
                    if (res.success && res.data) {
                        setPreviewData(res.data);
                    } else {
                        setPreviewData(null);
                    }
                    setPreviewLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) setPreviewLoading(false);
            });

        return () => { isMounted = false; };
    }, [open, activeTab, selectedYear, selectedMonth]);

    const handleMonthCloseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await autoCloseMonth({
            year: selectedYear,
            month: selectedMonth,
            notes: monthNotes,
            resetLiveAccounts: resetLiveAccounts
        });

        setLoading(false);

        if (result.success) {
            toast.success(`${previewData?.monthName || "Ay"} kapanışı başarıyla kaydedildi ve arşive eklendi.`);
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
            queryClient.invalidateQueries({ queryKey: ["cash-reset-report"] });
            queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
        } else {
            toast.error(result.error || "Ay kapanışı oluşturulurken bir hata meydana geldi.");
        }
    };

    const handleLiveResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get("title") as string,
            notes: formData.get("notes") as string,
            periodType: (formData.get("periodType") as any) || "DAY",
        };

        const result = await resetCashRegisters(data);
        setLoading(false);

        if (result.success) {
            toast.success("Kasa başarıyla sıfırlandı ve devredildi.");
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
            queryClient.invalidateQueries({ queryKey: ["cash-reset-report"] });
            queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
        } else {
            toast.error(result.error || "Kasa sıfırlanırken bir hata oluştu.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-900/20">
                        <Archive className="h-4 w-4" />
                        KASALARI SIFIRLA (DÖNEM KAPAT)
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[2rem] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
                        <CalendarDays className="h-6 w-6 text-indigo-500" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">Kasa Kapanış & Bilanço Arşivi</DialogTitle>
                    <DialogDescription className="text-center text-xs mt-1">
                        Geçmiş veya mevcut dönem kasa hareketlerini kapatın, bilanço snapshotsu oluşturun ve arşive mühürleyin.
                    </DialogDescription>

                    {/* Mode Switcher Tabs */}
                    <div className="flex bg-muted/60 p-1 rounded-2xl border border-border/50 mt-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab("MONTH")}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                                activeTab === "MONTH"
                                    ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CalendarDays className="h-4 w-4" />
                            Ay Seçerek Otomatik Kapat
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("LIVE")}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                                activeTab === "LIVE"
                                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Archive className="h-4 w-4" />
                            Canlı Kasaları Sıfırla
                        </button>
                    </div>
                </DialogHeader>

                {activeTab === "MONTH" ? (
                    /* TAB 1: AY SEÇEREK OTOMATİK KAPAT */
                    <form onSubmit={handleMonthCloseSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">Yıl Seçimi</Label>
                                <Select 
                                    value={selectedYear.toString()} 
                                    onValueChange={(val) => setSelectedYear(Number(val))}
                                >
                                    <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="Yıl" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                                            <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">Ay Seçimi</Label>
                                <Select 
                                    value={selectedMonth.toString()} 
                                    onValueChange={(val) => setSelectedMonth(Number(val))}
                                >
                                    <SelectTrigger className="h-10 rounded-xl">
                                        <SelectValue placeholder="Ay" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Otomatik Ay Sonu Hesaplama Önizlemesi */}
                        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-indigo-500" />
                                    <span className="text-xs font-bold text-foreground">
                                        {previewData?.monthName || "Seçilen Ay"} {selectedYear} Dönem Bilançosu
                                    </span>
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                    {previewData ? `${previewData.startDate} - ${previewData.endDate}` : "Hesaplanıyor..."}
                                </span>
                            </div>

                            {previewLoading ? (
                                <div className="py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                    <span className="text-xs">Ay verileri ve hareketleri hesaplanıyor...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                    <div className="bg-background/80 rounded-xl p-2.5 border border-border/40">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">Satış Cirosu</span>
                                        <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                                            ₺{Number(previewData?.totalSales || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground block mt-0.5">{previewData?.salesCount || 0} satış</span>
                                    </div>
                                    <div className="bg-background/80 rounded-xl p-2.5 border border-border/40">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-500 block">Toplam Gelir</span>
                                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            ₺{Number(previewData?.totalIncome || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="bg-background/80 rounded-xl p-2.5 border border-border/40">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-rose-500 block">Toplam Gider</span>
                                        <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                            ₺{Number(previewData?.totalExpense || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="bg-background/80 rounded-xl p-2.5 border border-border/40">
                                        <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-500 block">Net Dönem Kârı</span>
                                        <span className={cn(
                                            "text-xs sm:text-sm font-black tabular-nums",
                                            (previewData?.netProfit || 0) >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-500"
                                        )}>
                                            ₺{Number(previewData?.netProfit || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <p className="text-[10px] text-muted-foreground italic leading-relaxed pt-1">
                                💡 Bu işlem, seçilen ayın 1. günü 00:00 ile son günü 23:59 arasındaki tüm verileri analiz edip "Kasa Sıfırlama Geçmişi"ne kalıcı ve mühürlü bir kapanış kaydı olarak işler.
                            </p>
                        </div>

                        {/* Reset Live Accounts Checkbox */}
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="resetLiveAccounts"
                                checked={resetLiveAccounts}
                                onChange={(e) => setResetLiveAccounts(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="text-xs">
                                <label htmlFor="resetLiveAccounts" className="font-bold text-foreground cursor-pointer block">
                                    Dükkanın aktif canlı kasa bakiyelerini sıfırla
                                </label>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Geçmiş ayları (örn: geçen ayı) arşivlerken bu kutuyu <u>işaretlemeyiniz</u>. İşaretlemezseniz dükkanınızın bugünkü nakit ve banka bakiyeleri kesinlikle etkilenmez.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="monthNotes" className="text-xs font-bold">Kapanış Notu (Opsiyonel)</Label>
                            <Textarea
                                id="monthNotes"
                                value={monthNotes}
                                onChange={(e) => setMonthNotes(e.target.value)}
                                placeholder="Örn: Muhasebe mutabakatı tamamlandı, banka ekstreleri kontrol edildi..."
                                className="h-16 rounded-xl text-xs resize-none"
                            />
                        </div>

                        <div className="flex gap-2.5 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">
                                İPTAL
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading || previewLoading} 
                                className="flex-[2] h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold tracking-wide shadow-md shadow-indigo-600/20"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${previewData?.monthName || "Ayı"} Kapat ve Arşive Kaydet`}
                            </Button>
                        </div>
                    </form>
                ) : (
                    /* TAB 2: CANLI KASALARI SIFIRLA */
                    <form onSubmit={handleLiveResetSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex gap-3 dark:bg-rose-900/10 dark:border-rose-900/30">
                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-700 dark:text-rose-400">
                                Bu işlem tüm hesaplarınızdaki (Nakit, Banka, POS) anlık bakiyeleri 0 yapacak ve mevcut durumu arşive kaldıracaktır. Fiziksel parayı devrettikten sonra yapınız.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="periodType" className="text-xs font-bold">Dönem Tipi</Label>
                                <Select name="periodType" defaultValue="WEEK">
                                    <SelectTrigger className="h-10 rounded-xl text-xs">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAY">Günlük Kapanış</SelectItem>
                                        <SelectItem value="WEEK">Haftalık Kapanış</SelectItem>
                                        <SelectItem value="MONTH">Aylık Kapanış</SelectItem>
                                        <SelectItem value="MANUAL">Manuel Sıfırlama</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs font-bold">Başlık (Opsiyonel)</Label>
                                <Input id="title" name="title" placeholder="Örn: Ekim Ayı Sonu Kapanışı" className="h-10 rounded-xl text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-bold">Notlar (Opsiyonel)</Label>
                                <Textarea id="notes" name="notes" placeholder="Eklemek istediğiniz notlar..." className="h-20 rounded-xl text-xs resize-none" />
                            </div>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">
                                İPTAL
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-[2] h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold tracking-wide">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "KASALARI SIFIRLA VE ARŞİVLE"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
