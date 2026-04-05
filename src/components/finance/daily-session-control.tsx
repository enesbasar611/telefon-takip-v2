"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Loader2, AlertCircle, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { openDailySession, closeDailySession } from "@/lib/actions/finance-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DailySession {
    id: string;
    status: "OPEN" | "CLOSED";
    openingBalance: number;
    createdAt: string;
    openedBy?: { name: string } | null;
    transactions?: any[];
}

export function DailySessionControl({ session }: { session: DailySession | null }) {
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [closeModal, setCloseModal] = useState(false);

    const sessionSummary = session?.transactions?.reduce((acc, t) => {
        const amount = Number(t.amount);
        const method = t.paymentMethod;

        if (t.type === "INCOME") {
            acc.totalIncome += amount;
            if (method === "CASH") acc.cashIn += amount;
            else if (method === "CARD") acc.posIn += amount;
            else if (method === "TRANSFER") acc.bankIn += amount;
        } else {
            acc.totalExpense += amount;
            if (method === "CASH") acc.cashOut += amount;
        }
        return acc;
    }, { totalIncome: 0, totalExpense: 0, cashIn: 0, cashOut: 0, posIn: 0, bankIn: 0 }) || { totalIncome: 0, totalExpense: 0, cashIn: 0, cashOut: 0, posIn: 0, bankIn: 0 };

    const expectedCashInHand = (session?.openingBalance || 0) + sessionSummary.cashIn - sessionSummary.cashOut;

    const handleOpenSession = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const amount = Number(formData.get("openingBalance"));
        const notes = formData.get("notes") as string;

        const result = await openDailySession(amount, notes);
        setLoading(false);
        if (result.success) {
            toast.success("Kasa oturumu başarıyla açıldı.");
            setOpenModal(false);
        } else {
            toast.error(result.error);
        }
    };

    const handleCloseSession = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!session) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const actualBalance = Number(formData.get("actualBalance"));
        const notes = formData.get("notes") as string;

        const result = await closeDailySession(session.id, actualBalance, notes);
        setLoading(false);
        if (result.success) {
            toast.success("Kasa oturumu başarıyla kapatıldı. Günlük rapor hazır.");
            setCloseModal(false);
        } else {
            toast.error(result.error);
        }
    };

    if (!session) {
        return (
            <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm overflow-hidden border-dashed border-2">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 shadow-inner">
                                <Lock className="h-7 w-7 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-base  flex items-center gap-3 tracking-tight">
                                    KASA KAPALI
                                    <Badge variant="outline" className="text-[10px]  border-blue-500/30 text-blue-500 uppercase tracking-widest px-2 py-0.5 bg-background">Oturum Gerekli</Badge>
                                </h3>
                                <p className="text-[11px] text-muted-foreground  mt-1.5 opacity-80">İşlem yapmaya başlamak için lütfen günlük kasa oturumunu açın.</p>
                            </div>
                        </div>

                        <Dialog open={openModal} onOpenChange={setOpenModal}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl shadow-lg shadow-blue-500/10 h-10 px-6 text-xs  gap-2">
                                    <Unlock className="h-4 w-4" /> GÜNÜ BAŞLAT / KASA AÇ
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md border-border/40 p-0 overflow-hidden bg-background/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                <form onSubmit={handleOpenSession} className="p-10">
                                    <DialogHeader className="mb-10 p-0">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                                                <TrendingUp className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <DialogTitle className="font-medium text-2xl  tracking-tight">Günlük Oturumu Başlat</DialogTitle>
                                                <DialogDescription className="text-[11px]  text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                                                    Güne Başlangıç Sistemi
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="openingBalance" className="font-medium text-[10px]  text-muted-foreground ml-1 uppercase letter-spacing-wider">DEVREDEN NAKİT TUTAR (TL)</Label>
                                            <Input id="openingBalance" name="openingBalance" type="number" required defaultValue="0" step="0.01" className="h-11 rounded-xl text-sm  bg-muted/20 border-border/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="font-medium text-[10px]  text-muted-foreground ml-1 uppercase letter-spacing-wider">NOTLAR (İSTEĞE BAĞLI)</Label>
                                            <Textarea id="notes" name="notes" placeholder="Vardiya notu, eksik/fazla bilgisi vb." className="h-24 rounded-xl text-xs  bg-muted/20 border-border/40 resize-none" />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <Button type="button" variant="ghost" onClick={() => setOpenModal(false)} className="flex-1 h-11 text-xs  rounded-2xl">İPTAL</Button>
                                        <Button type="submit" disabled={loading} className="flex-[2] h-11 text-xs  rounded-2xl shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "OTURUMU AÇ VE BAŞLAT"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-inner">
                            <Unlock className="h-7 w-7 text-emerald-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-medium text-base  tracking-tight">KASA AÇIK</h3>
                                <Badge variant="outline" className="text-[10px]  border-emerald-500/30 text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-background">AKTİF OTURUM</Badge>
                            </div>
                            <div className="flex items-center gap-5 mt-2">
                                <p className="text-[11px] text-muted-foreground  flex items-center gap-2 uppercase tracking-tighter">
                                    <Calendar className="h-3.5 w-3.5 text-emerald-500/60" /> {format(new Date(session.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                                </p>
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <p className="text-[11px] text-muted-foreground  flex items-center gap-2 uppercase tracking-tighter">
                                    Açılış: <span className="text-foreground ">₺{Number(session.openingBalance).toLocaleString('tr-TR')}</span>
                                </p>
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <p className="text-[11px] text-muted-foreground  flex items-center gap-2 uppercase tracking-tighter">
                                    Sorumlu: <span className="text-foreground ">{session.openedBy?.name || 'SİSTEM'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <Dialog open={closeModal} onOpenChange={setCloseModal}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white h-10 px-6 text-xs  gap-2 transition-all">
                                GÜNÜ BİTİR / KASA KAPAT <ChevronRight className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-xl rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
                            <form onSubmit={handleCloseSession} className="p-8 flex flex-col overflow-hidden">
                                <DialogHeader className="mb-6 p-0 shrink-0">
                                    <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                                        <Lock className="h-6 w-6 text-rose-500" />
                                    </div>
                                    <DialogTitle className="font-medium text-xl ">Kasa Oturumunu Kapat</DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-tight">
                                        Seans sonu hareket özeti ve fiziki mutabakat ekranı.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                                    {/* Oturum Özeti */}
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                            <p className="text-[9px]  text-emerald-600/70 uppercase tracking-widest mb-1.5">TOPLAM TAHSİLAT</p>
                                            <p className="text-xl  text-emerald-600">₺{sessionSummary.totalIncome.toLocaleString('tr-TR')}</p>
                                            <div className="mt-2 flex flex-col gap-1">
                                                <span className="text-[9px]  text-muted-foreground opacity-60">Nakit: ₺{sessionSummary.cashIn.toLocaleString('tr-TR')}</span>
                                                <span className="text-[9px]  text-muted-foreground opacity-60">POS: ₺{sessionSummary.posIn.toLocaleString('tr-TR')}</span>
                                                <span className="text-[9px]  text-muted-foreground opacity-60">Havale: ₺{sessionSummary.bankIn.toLocaleString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">
                                            <p className="text-[9px]  text-rose-600/70 uppercase tracking-widest mb-1.5">TOPLAM ÇIKIŞ</p>
                                            <p className="text-xl  text-rose-600">₺{sessionSummary.totalExpense.toLocaleString('tr-TR')}</p>
                                            <div className="mt-2 flex flex-col gap-1">
                                                <span className="text-[9px]  text-muted-foreground opacity-60">Nakit Çıkış: ₺{sessionSummary.cashOut.toLocaleString('tr-TR')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hareket Listesi */}
                                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/40">
                                        <p className="text-[9px]  text-muted-foreground uppercase tracking-widest mb-3 flex items-center justify-between">
                                            OTURUM HAREKETLERİ
                                            <Badge variant="secondary" className="text-[8px] h-4 rounded-md">{session.transactions?.length || 0} İŞLEM</Badge>
                                        </p>
                                        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                            {session.transactions?.map((t: any) => (
                                                <div key={t.id} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", t.type === 'INCOME' ? "bg-emerald-500" : "bg-rose-500")} />
                                                        <p className="text-[10px]  truncate opacity-80">{t.description}</p>
                                                    </div>
                                                    <p className={cn("text-[10px] font-extrabold whitespace-nowrap", t.type === 'INCOME' ? "text-emerald-600" : "text-rose-600")}>
                                                        {t.type === 'INCOME' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            ))}
                                            {(!session.transactions || session.transactions.length === 0) && (
                                                <p className="text-[10px] text-muted-foreground  text-center py-4 opacity-50">Henüz hareket kaydı yok.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Beklenen Tutar */}
                                    <div className="bg-muted/80 p-5 rounded-3xl border border-border/40 border-dashed relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 bg-slate-500/5 rounded-full" />
                                        <div className="flex items-center justify-between text-[10px]  text-muted-foreground mb-1 uppercase tracking-widest">
                                            <span>KASADA OLMASI GEREKEN (NAKİT)</span>
                                            <span className="text-emerald-500 italic">MUTABAKAT ÖNCESİ</span>
                                        </div>
                                        <div className="text-3xl  text-foreground tracking-tighter">₺{expectedCashInHand.toLocaleString('tr-TR')}</div>
                                        <p className="text-[9px] text-muted-foreground  mt-2 opacity-60">Açılış + Nakit Giriş - Nakit Çıkış = Beklenen Tutar</p>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="actualBalance" className="font-medium text-[10px]  text-muted-foreground ml-1 uppercase tracking-widest">KASADAKİ FİZİKSEL NAKİT TUTARI (TL)</Label>
                                        <Input id="actualBalance" name="actualBalance" type="number" step="0.01" required placeholder="Elinizdeki nakiti sayın ve girin" className="h-14 rounded-2xl text-lg  bg-muted/20 border-border/40 px-6 shadow-inner focus:ring-2 focus:ring-rose-500/20 transition-all border-2 focus:border-rose-500/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="font-medium text-[10px]  text-muted-foreground ml-1 uppercase tracking-widest">GÜN SONU NOTLARI</Label>
                                        <Textarea id="notes" name="notes" placeholder="Eksik/Fazla nedenleri, genel dükkan notu vb." className="h-20 rounded-2xl text-xs  bg-muted/20 border-border/40 resize-none p-4" />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/40 flex gap-3 shrink-0">
                                    <Button type="button" variant="ghost" onClick={() => setCloseModal(false)} className="flex-1 h-12 text-xs  rounded-2xl uppercase tracking-widest">İPTAL</Button>
                                    <Button type="submit" disabled={loading} className="flex-[2] h-12 text-xs  rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/20 uppercase tracking-widest">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "KASAYI MUTABAKATLA KAPAT"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}






