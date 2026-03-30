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

interface DailySession {
    id: string;
    status: "OPEN" | "CLOSED";
    openingBalance: number;
    createdAt: string;
    openedBy?: { name: string } | null;
}

export function DailySessionControl({ session }: { session: DailySession | null }) {
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [closeModal, setCloseModal] = useState(false);

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
                                <h3 className="text-base font-black flex items-center gap-3 tracking-tight">
                                    KASA KAPALI
                                    <Badge variant="outline" className="text-[10px] font-black border-blue-500/30 text-blue-500 uppercase tracking-widest px-2 py-0.5 bg-background">Oturum Gerekli</Badge>
                                </h3>
                                <p className="text-[11px] text-muted-foreground font-bold mt-1.5 opacity-80">İşlem yapmaya başlamak için lütfen günlük kasa oturumunu açın.</p>
                            </div>
                        </div>

                        <Dialog open={openModal} onOpenChange={setOpenModal}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl shadow-lg shadow-blue-500/20 h-10 px-6 text-xs font-bold gap-2">
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
                                                <DialogTitle className="text-2xl font-black tracking-tight">Günlük Oturumu Başlat</DialogTitle>
                                                <DialogDescription className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-70">
                                                    Güne Başlangıç Sistemi
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="openingBalance" className="text-[10px] font-bold text-muted-foreground ml-1 uppercase letter-spacing-wider">DEVREDEN NAKİT TUTAR (TL)</Label>
                                            <Input id="openingBalance" name="openingBalance" type="number" required defaultValue="0" className="h-11 rounded-xl text-sm font-bold bg-muted/20 border-border/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="text-[10px] font-bold text-muted-foreground ml-1 uppercase letter-spacing-wider">NOTLAR (İSTEĞE BAĞLI)</Label>
                                            <Textarea id="notes" name="notes" placeholder="Vardiya notu, eksik/fazla bilgisi vb." className="h-24 rounded-xl text-xs font-bold bg-muted/20 border-border/40 resize-none" />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <Button type="button" variant="ghost" onClick={() => setOpenModal(false)} className="flex-1 h-11 text-xs font-bold rounded-2xl">İPTAL</Button>
                                        <Button type="submit" disabled={loading} className="flex-[2] h-11 text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20">
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
                                <h3 className="text-base font-black tracking-tight">KASA AÇIK</h3>
                                <Badge variant="outline" className="text-[10px] font-black border-emerald-500/30 text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-background">AKTİF OTURUM</Badge>
                            </div>
                            <div className="flex items-center gap-5 mt-2">
                                <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    <Calendar className="h-3.5 w-3.5 text-emerald-500/60" /> {format(new Date(session.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                                </p>
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    Açılış: <span className="text-foreground font-black">₺{Number(session.openingBalance).toLocaleString('tr-TR')}</span>
                                </p>
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    Sorumlu: <span className="text-foreground font-black">{session.openedBy?.name || 'SİSTEM'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <Dialog open={closeModal} onOpenChange={setCloseModal}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white h-10 px-6 text-xs font-bold gap-2">
                                GÜNÜ BİTİR / KASA KAPAT <ChevronRight className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md border-border/40 p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
                            <form onSubmit={handleCloseSession} className="p-8">
                                <DialogHeader className="mb-8 p-0">
                                    <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                                        <Lock className="h-6 w-6 text-rose-500" />
                                    </div>
                                    <DialogTitle className="text-xl font-bold">Günlük Oturumu Kapat</DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground font-medium mt-1">
                                        Kasayı kapatmadan önce elinizdeki fiziksel nakit tutarı sayıp giriniz.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
                                    <div className="bg-muted/30 p-4 rounded-2xl mb-6">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1">
                                            <span>SİSTEMDE OLMASI GEREKEN</span>
                                            <span className="text-emerald-500 italic">OTOMATİK HESAPLANDI</span>
                                        </div>
                                        <div className="text-lg font-bold text-muted-foreground">Oturum bitiminde otomatik hesaplanacaktır</div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="actualBalance" className="text-[10px] font-bold text-muted-foreground ml-1 uppercase letter-spacing-wider">KASADAKİ FİZİKSEL TUTAR (TL)</Label>
                                        <Input id="actualBalance" name="actualBalance" type="number" required placeholder="Elinizdeki nakiti girin" className="h-11 rounded-xl text-sm font-bold bg-muted/20 border-border/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-[10px] font-bold text-muted-foreground ml-1 uppercase letter-spacing-wider">KAPANIŞ NOTLARI</Label>
                                        <Textarea id="notes" name="notes" placeholder="Açık/Fazla varsa nedeni vb." className="h-24 rounded-xl text-xs font-bold bg-muted/20 border-border/40 resize-none" />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setCloseModal(false)} className="flex-1 h-11 text-xs font-bold rounded-2xl">İPTAL</Button>
                                    <Button type="submit" disabled={loading} className="flex-[2] h-11 text-xs font-bold rounded-2xl bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "OTURUMU KAPAT VE BİTİR"}
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
