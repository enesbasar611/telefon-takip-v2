"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Trophy,
    Plus,
    Trash2,
    Target,
    Zap,
    Users,
    Activity,
    Info
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createMilestone, deleteMilestone } from "@/lib/actions/staff-finance-actions";
import { useToast } from "@/hooks/use-toast";
import { Role } from "@prisma/client";
import { STAFF_ROLE_LABELS } from "@/lib/staff-permissions";

export function MilestoneManagement({ milestones, onSuccess }: { milestones: any[], onSuccess: () => void }) {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const [formData, setFormData] = useState({
        role: "TECHNICIAN" as Role,
        targetType: "SERVICE_COUNT" as any,
        targetValue: 0,
        bonusAmount: 0
    });

    const handleCreate = async () => {
        if (formData.targetValue <= 0 || formData.bonusAmount <= 0) {
            toast({ title: "Hata", description: "Lütfen geçerli değerler giriniz.", variant: "destructive" });
            return;
        }

        setIsPending(true);
        try {
            const res = await createMilestone(formData);
            if (res.success) {
                toast({ title: "Başarılı", description: "Hedef yayına alındı." });
                onSuccess();
                setIsCreateOpen(false);
                setFormData({
                    role: "TECHNICIAN",
                    targetType: "SERVICE_COUNT",
                    targetValue: 0,
                    bonusAmount: 0
                });
            }
        } catch (error: any) {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        } finally {
            setIsPending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;

        try {
            const res = await deleteMilestone(id);
            if (res.success) {
                toast({ title: "Başarılı", description: "Hedef silindi." });
                onSuccess();
            }
        } catch (error: any) {
            toast({ title: "Hata", description: error.message, variant: "destructive" });
        }
    };

    return (
        <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-violet-500/5">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">PERSONEL HEDEFLERİ</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rol bazlı performans ve bonus yönetimi</p>
                    </div>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest gap-2 h-12 px-6">
                            <Plus className="h-4 w-4" />
                            YENİ HEDEF EKLE
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase italic tracking-tighter text-2xl">HEDEF TANIMLA</DialogTitle>
                            <DialogDescription className="text-xs font-medium">
                                Belirli bir rol için aylık performans hedefi ve başarı bonusu belirleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">İLGİLİ ROL</Label>
                                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as Role })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold">
                                        <SelectValue placeholder="Rol Seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-xl">
                                        {Object.entries(STAFF_ROLE_LABELS).map(([role, label]) => (
                                            <SelectItem key={role} value={role} className="font-bold">{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">HEDEF TİPİ</Label>
                                <Select value={formData.targetType} onValueChange={(v) => setFormData({ ...formData, targetType: v })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold">
                                        <SelectValue placeholder="Hedef Tipi" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-xl">
                                        <SelectItem value="SERVICE_COUNT" className="font-bold">Hizmet Sayısı (Adet)</SelectItem>
                                        <SelectItem value="SALES_AMOUNT" className="font-bold">Satış Cirosu (TL)</SelectItem>
                                        <SelectItem value="COURIER_TASK" className="font-bold">Kurye Görevi (Adet)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">HEDEF DEĞER</Label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold"
                                        placeholder="Örn: 50"
                                        value={formData.targetValue || ""}
                                        onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">BONUS TUTAR (₺)</Label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold text-emerald-600"
                                        placeholder="Örn: 500"
                                        value={formData.bonusAmount || ""}
                                        onChange={(e) => setFormData({ ...formData, bonusAmount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                disabled={isPending}
                                onClick={handleCreate}
                                className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-[0.2em]"
                            >
                                {isPending ? "Kaydediliyor..." : "HEDEFİ OLUŞTUR"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="font-bold text-[10px] uppercase text-slate-400 pl-8 h-12">ROL</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase text-slate-400 h-12">HEDEF TİPİ</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase text-slate-400 h-12">HEDEF DEĞER</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase text-slate-400 h-12">BONUS</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase text-slate-400 h-12">DURUM</TableHead>
                            <TableHead className="font-bold text-[10px] uppercase text-slate-400 text-right pr-8 h-12">İŞLEMLER</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {milestones.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 opacity-50">
                                        <Info className="h-12 w-12 mb-2" />
                                        <p className="font-black uppercase tracking-widest text-xs">Henüz bir hedef tanımlanmadı.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            milestones.map((m) => (
                                <TableRow key={m.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="pl-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <span className="font-black text-sm text-slate-900 dark:text-white">
                                                {STAFF_ROLE_LABELS[m.role as Role] || m.role}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {m.targetType === 'SALES_AMOUNT' ? (
                                                <Zap className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <Target className="h-4 w-4 text-blue-500" />
                                            )}
                                            <span className="font-bold text-xs">
                                                {m.targetType === 'SERVICE_COUNT' ? 'Hizmet Sayısı' :
                                                    m.targetType === 'SALES_AMOUNT' ? 'Satış Cirosu' : 'Kurye Görevi'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-black text-sm">
                                            {Number(m.targetValue).toLocaleString('tr-TR')} {m.targetType === 'SALES_AMOUNT' ? '₺' : 'Adet'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-xs px-3 py-1 rounded-xl">
                                            +{Number(m.bonusAmount).toLocaleString('tr-TR')} ₺
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-500/10 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg">
                                            AKTİF
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
                                            onClick={() => handleDelete(m.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-white/5 border-t border-white/5 mt-auto">
                <div className="flex items-start gap-4">
                    <Info className="h-5 w-5 text-violet-500 shrink-0 mt-1" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nasıl Çalışır?</p>
                        <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                            Burada tanımlanan hedefler, ilgili roldeki tüm personel için geçerli olur. Personel kendi dashboard ekranında bu hedeflere olan ilerlemesini anlık olarak takip edebilir. Hedefe ulaşıldığında belirlenen bonus tutarı hakedişe otomatik olarak yansımaz, ancak hakediş raporlarında "Başarı Bonusu" olarak gösterilir.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

