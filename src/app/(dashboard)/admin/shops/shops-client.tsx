"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
    Store, Zap, ArrowRight, Code2, Users, Receipt, Calendar, Loader2,
    MoreVertical, Settings, Trash2, ShieldAlert, CheckCircle2, XCircle, Plus, Layout
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfigEditor } from "@/components/admin/config-editor";
import { ShopForm } from "@/components/admin/shop-form";
import { AdminFormsEditor } from "@/components/admin/admin-forms-editor";
import { impersonateShop, deleteShop } from "@/lib/actions/superadmin-actions";

import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function ShopsClient({ initialShops }: { initialShops: any[] }) {
    const { update } = useSession();
    const router = useRouter();
    const [shops, setShops] = useState(initialShops);
    const [activeShop, setActiveShop] = useState<any | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isFormsEditorOpen, setIsFormsEditorOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState(0);

    const handleImpersonate = async (shop: any) => {
        console.log("[handleImpersonate] Triggered for shop:", shop.name);
        if (!confirm(`Dikkat: "${shop.name}" dükkanının kimliğine bürüneceksiniz. Onaylıyor musunuz?`)) {
            console.log("[handleImpersonate] User cancelled confirm.");
            return;
        }

        setImpersonatingId(shop.id);
        try {
            console.log("[handleImpersonate] Calling impersonateShop action...");
            const res = await impersonateShop(shop.id);
            console.log("[handleImpersonate] Action response:", res);

            if (res.success) {
                // Force session update before redirect
                console.log("[handleImpersonate] Success, updating session...");
                await update();
                console.log("[handleImpersonate] Session updated, redirecting...");

                toast.success(`${shop.name} kimliğine geçildi. Yönlendiriliyorsunuz...`);
                // Use window.location for a hard refresh to ensure all server components pick up the new session
                window.location.href = "/dashboard";
            } else {
                setImpersonatingId(null);
                toast.error(res.error);
            }
        } catch (error: any) {
            console.error("[handleImpersonate] Exception:", error);
            setImpersonatingId(null);
            toast.error("Bir hata oluştu: " + error.message);
        }
    };

    const handleDelete = async (shop: any) => {
        if (!confirm(`DÜKKAN SİLİNECEK! "${shop.name}" dükkanını ve dükkana bağlı TÜM verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
            return;
        }

        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const confirmName = prompt(`Silme işlemini onaylamak için lütfen şu kodu girin: ${randomCode}`);
        if (confirmName !== randomCode) {
            toast.error("Kod eşleşmedi, silme iptal edildi.");
            return;
        }

        setIsDeleting(true);
        // Artificial progress for better UX
        const interval = setInterval(() => {
            setDeleteProgress(prev => (prev < 90 ? prev + 10 : prev));
        }, 800);

        const res = await deleteShop(shop.id);
        clearInterval(interval);
        setDeleteProgress(100);

        setTimeout(() => {
            setIsDeleting(false);
            setDeleteProgress(0);
            if (res.success) {
                setShops(prev => prev.filter(s => s.id !== shop.id));
                toast.success("Dükkan başarıyla silindi.");
                router.refresh();
            } else {
                toast.error(res.error);
            }
        }, 500);
    };

    const handleSaved = () => {
        router.refresh();
        setIsEditorOpen(false);
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    onClick={() => { setActiveShop(null); setIsFormOpen(true); }}
                    className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
                >
                    <Plus className="h-4 w-4" /> Yeni Dükkan Ekle
                </Button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[280px]">Dükkan & Durum</TableHead>
                                <TableHead className="w-[220px]">Dükkan Sahibi</TableHead>
                                <TableHead>Yük & İstatistikler</TableHead>
                                <TableHead>Modüller</TableHead>
                                <TableHead className="text-right">Aksiyonlar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Store className="h-8 w-8 opacity-20" />
                                            <p>Sistemde herhangi bir dükkan bulunamadı.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {shops.map((shop) => {
                                const owner = shop.users?.[0];
                                return (
                                    <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${shop.isActive ? "bg-primary/10" : "bg-red-500/10"}`}>
                                                        <Store className={`h-5 w-5 ${shop.isActive ? "text-primary" : "text-red-500"}`} />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-foreground truncate max-w-[150px]">{shop.name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 font-medium">
                                                            {shop.industry}
                                                        </Badge>
                                                        <span className="text-[9px] font-mono text-muted-foreground opacity-50">#{shop.id.slice(-6)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {owner ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[13px] font-bold text-foreground truncate max-w-[180px]">{owner.name}</div>
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                                                        <div className="h-1 w-1 rounded-full bg-blue-500" />
                                                        {owner.email}
                                                    </div>
                                                    {owner.phone && (
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                                                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                                            {owner.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground italic font-medium">Sahip Bilgisi Yok</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="grid grid-cols-3 gap-2 w-fit">
                                                <div className="flex flex-col" title="Kullanıcılar">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">USR</span>
                                                    <span className="text-sm font-bold">{shop._count?.users || 0}</span>
                                                </div>
                                                <div className="flex flex-col" title="Müşteriler">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">CST</span>
                                                    <span className="text-sm font-bold text-blue-500">{shop._count?.customers || 0}</span>
                                                </div>
                                                <div className="flex flex-col" title="Servisler">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">SRV</span>
                                                    <span className="text-sm font-bold text-emerald-500">{shop._count?.serviceTickets || 0}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {shop.enabledModules.slice(0, 2).map((mod: string) => (
                                                    <Badge key={mod} variant="secondary" className="text-[9px] py-0 px-1 bg-muted text-muted-foreground border-0 font-bold">
                                                        {mod}
                                                    </Badge>
                                                ))}
                                                {shop.enabledModules.length > 2 && (
                                                    <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-muted text-muted-foreground border-0 font-bold">
                                                        +{shop.enabledModules.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-9 px-3 rounded-xl gap-2 font-bold text-xs bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white transition-all"
                                                    onClick={() => handleImpersonate(shop)}
                                                    disabled={impersonatingId === shop.id}
                                                >
                                                    {impersonatingId === shop.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                                    ) : (
                                                        <ArrowRight className="h-4 w-4" />
                                                    )}
                                                    Aç
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-900 border-border dark:border-white/10 text-foreground dark:text-white rounded-xl shadow-2xl">
                                                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Yönetim</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => { setActiveShop(shop); setIsFormOpen(true); }} className="gap-2 cursor-pointer focus:bg-white/5">
                                                            <Settings className="h-4 w-4 text-blue-400" /> Genel Ayarlar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setActiveShop(shop); setIsEditorOpen(true); }} className="gap-2 cursor-pointer focus:bg-white/5">
                                                            <Code2 className="h-4 w-4 text-emerald-400" /> Konfigürasyon (JSON)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setActiveShop(shop); setIsFormsEditorOpen(true); }} className="gap-2 cursor-pointer focus:bg-white/5">
                                                            <Layout className="h-4 w-4 text-indigo-400" /> Form Tasarımı
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem onClick={() => handleImpersonate(shop)} className="gap-2 cursor-pointer focus:bg-white/5">
                                                            <ShieldAlert className="h-4 w-4 text-amber-400" /> Kimlik Bürünme
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem onClick={() => handleDelete(shop)} className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 font-bold">
                                                            <Trash2 className="h-4 w-4" /> Dükkanı Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-border dark:border-white/10 text-foreground dark:text-white rounded-3xl">
                    <DialogHeader className="flex flex-col items-center justify-center pt-6">
                        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                            <Trash2 className="h-10 w-10 text-red-500 animate-bounce" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center">Dükkan Siliniyor...</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground pt-2">
                            Dükkana bağlı tüm veriler, kayıtlar ve kullanıcılar tamamen temizleniyor. Lütfen bekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                                <span>İşlem Durumu</span>
                                <span>%{deleteProgress}</span>
                            </div>
                            <Progress value={deleteProgress} className="h-3 bg-white/5" indicatorClassName="bg-gradient-to-r from-red-500 to-orange-500" />
                        </div>
                        <div className="bg-muted dark:bg-white/5 rounded-2xl p-4 flex items-start gap-4 border border-border dark:border-white/5">
                            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground dark:text-muted-foreground/80 leading-relaxed uppercase tracking-tight font-medium">
                                <strong className="text-amber-600 dark:text-amber-500">UYARI:</strong> Bu işlem veritabanı seviyesinde kalıcıdır. Silinen veriler kurtarılamaz. İşlem tamamlanana kadar sayfayı kapatmayın.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AnimatePresence>
                {activeShop && isEditorOpen && (
                    <ConfigEditor
                        shop={activeShop}
                        open={isEditorOpen}
                        onOpenChange={setIsEditorOpen}
                        onSaved={handleSaved}
                    />
                )}
                {isFormOpen && (
                    <ShopForm
                        shop={activeShop}
                        open={isFormOpen}
                        onOpenChange={setIsFormOpen}
                        onSaved={handleSaved}
                    />
                )}
                {isFormsEditorOpen && (
                    <AdminFormsEditor
                        shop={activeShop}
                        open={isFormsEditorOpen}
                        onOpenChange={setIsFormsEditorOpen}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

