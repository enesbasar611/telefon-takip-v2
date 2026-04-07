"use client";

import { useEffect, useState } from "react";
import { getProfile, getStaffPerformance, updateProfile, updatePassword } from "@/lib/actions/staff-actions";
import { User, Mail, Phone, Calendar, Briefcase, MapPin, Building2, TrendingUp, CheckCircle2, History, Loader2, ExternalLink, Settings, ShieldCheck, Camera, Save, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Edit Form State
    const [editData, setEditData] = useState({ name: "", surname: "", phone: "", image: "" });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Password State
    const [pwdData, setPwdData] = useState({ old: "", new: "", confirm: "" });
    const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);

    const loadData = async () => {
        try {
            const p = await getProfile();
            setProfile(p);
            if (p) {
                setEditData({ name: p.name || "", surname: p.surname || "", phone: p.phone || "", image: p.image || "" });
                const perf = await getStaffPerformance(p.id);
                setPerformance(perf);
            }
        } catch (error) {
            toast.error("Bilgiler güncellenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateProfile = async () => {
        if (!editData.name) return toast.error("İsim alanı boş bırakılamaz.");
        setIsSaving(true);
        try {
            const res = await updateProfile(editData);
            if (res.success) {
                toast.success("Profil başarıyla güncellendi.");
                setProfile(res.user);
                setIsEditModalOpen(false);
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (pwdData.new !== pwdData.confirm) return toast.error("Şifreler eşleşmiyor.");
        if (pwdData.new.length < 6) return toast.error("Şifre en az 6 karakter olmalıdır.");

        setIsSaving(true);
        try {
            const res = await updatePassword({ old: pwdData.old, new: pwdData.new });
            if (res.success) {
                toast.success("Şifre başarıyla güncellendi.");
                setPwdData({ old: "", new: "", confirm: "" });
                setIsPwdModalOpen(false);
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Şifre güncellenemedi.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!profile) return null;

    const stats = [
        { label: "Tamamlanan Servis", value: performance?.serviceCount || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Toplam Satış", value: performance?.saleCount || 0, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Toplam Ciro", value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(performance?.totalRevenue || 0), icon: Briefcase, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Tahakkuk Eden Prim", value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(performance?.commission || 0), icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Cover */}
            <div className="relative h-56 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 shadow-2xl">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.4),transparent_60%)]" />
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                <div className="absolute top-6 right-6 flex gap-3">
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 h-9 rounded-xl gap-2 font-semibold">
                                <Settings className="w-4 h-4" /> Profili Düzenle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-[#0f0f0f] border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-500" /> Profil Bilgilerini Güncelle
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5 py-4">
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center gap-4 py-2">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-black/20 text-muted-foreground overflow-hidden">
                                                {editData.image ? (
                                                    <img src={editData.image} alt="Profil" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera className="w-8 h-8" />
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="w-full space-y-1.5">
                                            <Label className="text-xs font-bold uppercase opacity-60">Profil Fotoğrafı URL</Label>
                                            <Input
                                                placeholder="https://gorsel-linki.com/foto.jpg"
                                                value={editData.image}
                                                onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                                className="bg-slate-50 dark:bg-black/40 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase opacity-60">İsim</Label>
                                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="bg-slate-50 dark:bg-black/40 rounded-xl" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase opacity-60">Soyisim</Label>
                                            <Input value={editData.surname} onChange={(e) => setEditData({ ...editData, surname: e.target.value })} className="bg-slate-50 dark:bg-black/40 rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase opacity-60">Telefon</Label>
                                        <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="bg-slate-50 dark:bg-black/40 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="gap-3">
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl border-slate-200 dark:border-white/10">Vazgeç</Button>
                                <Button onClick={handleUpdateProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 px-8">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Kaydet</>}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isPwdModalOpen} onOpenChange={setIsPwdModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 h-9 rounded-xl gap-2 font-semibold">
                                <ShieldCheck className="w-4 h-4" /> Şifre Değiştir
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-[#0f0f0f] border-slate-200 dark:border-white/10 rounded-2xl max-w-sm">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-orange-500" /> Güvenlik Ayarları
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase opacity-60">Mevcut Şifre</Label>
                                    <Input type="password" value={pwdData.old} onChange={(e) => setPwdData({ ...pwdData, old: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase opacity-60">Yeni Şifre</Label>
                                    <Input type="password" value={pwdData.new} onChange={(e) => setPwdData({ ...pwdData, new: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase opacity-60">Yeni Şifre (Tekrar)</Label>
                                    <Input type="password" value={pwdData.confirm} onChange={(e) => setPwdData({ ...pwdData, confirm: e.target.value })} className="rounded-xl" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleUpdatePassword} disabled={isSaving} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Şifreyi Güncelle"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="w-28 h-28 rounded-2xl relative group overflow-hidden border-2 border-white/20 shadow-2xl">
                        {profile.image ? (
                            <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white uppercase">
                                {profile.name?.charAt(0)}{profile.surname?.charAt(0)}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 pb-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                {profile.name} {profile.surname}
                            </h1>
                            <Badge variant="secondary" className="bg-blue-500 text-white border-0 font-bold px-3 py-1">
                                {profile.role}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-blue-50/70 text-sm flex items-center gap-1.5 font-medium">
                                <Mail className="w-4 h-4 opacity-70" /> {profile.email}
                            </p>
                            {profile.phone && (
                                <p className="text-blue-50/70 text-sm flex items-center gap-1.5 font-medium border-l border-white/10 pl-4">
                                    <Phone className="w-4 h-4 opacity-70" /> {profile.phone}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="p-6 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                        <h2 className="text-sm font-black text-slate-800 dark:text-white/40 mb-6 uppercase tracking-[0.2em]">Profil Özeti</h2>
                        <div className="space-y-6 relative">
                            <InfoRow icon={User} label="Tam İsim" value={`${profile.name} ${profile.surname}`} />
                            <InfoRow icon={Mail} label="Hesap" value={profile.email} />
                            <InfoRow icon={Calendar} label="Kayıt" value={new Date(profile.createdAt).toLocaleDateString('tr-TR')} />
                            <InfoRow icon={ShieldCheck} label="Yetki Seviyesi" value={profile.role} />
                            <InfoRow icon={TrendingUp} label="Performans Katsayısı" value={`%${profile.commissionRate || 0}`} />
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group">
                        <h2 className="text-sm font-black text-slate-800 dark:text-white/40 mb-6 uppercase tracking-[0.2em]">Mağaza Bilgileri</h2>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-black border border-orange-500/20">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{profile.shop?.name}</p>
                                    <p className="text-[11px] text-muted-foreground font-bold">{profile.shop?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-2">
                                <InfoRow icon={MapPin} label="Konum" value={profile.shop?.address || "Belirtilmemiş"} />
                                <InfoRow icon={Phone} label="Mağaza Telefon" value={profile.shop?.phone || "Belirtilmemiş"} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Performance & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.map((stat) => (
                            <Card key={stat.label} className="p-5 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/5 shadow-sm group hover:border-blue-500/30 transition-all transition-gpu duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:rotate-12", stat.bg)}>
                                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground/60 uppercase font-black tracking-widest">{stat.label}</p>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
                                        </div>
                                    </div>
                                    <div className="hidden group-hover:block animate-in fade-in slide-in-from-right-2">
                                        <div className={cn("w-2 h-12 rounded-full", stat.bg.replace('/10', '/30'))} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Recent Activity */}
                    <Card className="bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group">
                        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0f0f0f]">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-blue-500" />
                                <h2 className="text-sm font-black text-slate-800 dark:text-white/40 uppercase tracking-[0.2em]">Son Servis İşlemleri</h2>
                            </div>
                            <Link href="/servis/liste" className="text-[10px] text-blue-500 hover:text-blue-600 font-black tracking-widest flex items-center gap-1.5 transition-colors group/link">
                                TÜMÜNÜ GÖR <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-black/40 text-[10px] text-muted-foreground/60 uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">FİŞ</th>
                                        <th className="px-6 py-4">MÜŞTERİ / CİHAZ</th>
                                        <th className="px-6 py-4">DURUM</th>
                                        <th className="px-6 py-4">TUTAR</th>
                                        <th className="px-6 py-4">TARİH</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {profile.assignedTickets?.map((ticket: any) => (
                                        <tr key={ticket.id} className="group/row hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-mono font-black text-blue-500 bg-blue-500/5 px-2 py-1 rounded-lg">#{ticket.ticketNumber}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-800 dark:text-white/90 group-hover/row:text-blue-500 transition-colors uppercase">{ticket.customer?.name}</p>
                                                    <p className="text-[11px] text-muted-foreground font-bold opacity-70 tracking-tight">{ticket.deviceBrand} {ticket.deviceModel}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        ticket.status === 'DELIVERED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-wider",
                                                        ticket.status === 'DELIVERED' ? "text-emerald-500" : "text-blue-500"
                                                    )}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">₺{ticket.actualCost}</span>
                                            </td>
                                            <td className="px-6 py-5 text-[11px] text-muted-foreground font-bold italic opacity-60">
                                                {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4 group/row">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center justify-center text-muted-foreground flex-shrink-0 group-hover/row:border-blue-500/30 transition-all group-hover/row:scale-105">
                <Icon className="w-5 h-5 group-hover/row:text-blue-500 transition-colors" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.15em] opacity-40">{label}</p>
                <p className="text-sm font-black text-slate-900 dark:text-white/80 group-hover/row:text-white transition-colors truncate">{value}</p>
            </div>
        </div>
    );
}
