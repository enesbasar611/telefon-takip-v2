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
import {
    Store, Zap, ArrowRight, Code2, Users, Receipt, Calendar, Loader2,
    MoreVertical, Settings, Trash2, ShieldAlert, CheckCircle2, XCircle, Plus
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
import { impersonateShop, deleteShop } from "@/lib/actions/superadmin-actions";

export function ShopsClient({ initialShops }: { initialShops: any[] }) {
    const router = useRouter();
    const [shops, setShops] = useState(initialShops);
    const [activeShop, setActiveShop] = useState<any | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

    const handleImpersonate = async (shop: any) => {
        if (!confirm(`Dikkat: "${shop.name}" dükkanının kimliğine bürüneceksiniz. Onaylıyor musunuz?`)) {
            return;
        }

        setImpersonatingId(shop.id);
        const res = await impersonateShop(shop.id);
        setImpersonatingId(null);

        if (res.success) {
            toast.success(`${shop.name} kimliğine geçildi. Yönlendiriliyorsunuz...`);
            window.location.href = "/dashboard";
        } else {
            toast.error(res.error);
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

        const res = await deleteShop(shop.id);
        if (res.success) {
            toast.success("Dükkan başarıyla silindi.");
            router.refresh();
        } else {
            toast.error(res.error);
        }
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
                    className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                >
                    <Plus className="h-4 w-4" /> Yeni Dükkan Ekle
                </Button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[300px]">Dükkan & Durum</TableHead>
                                <TableHead>Yük & İstatistikler</TableHead>
                                <TableHead>Modüller</TableHead>
                                <TableHead>Kayıt</TableHead>
                                <TableHead className="text-right">Aksiyonlar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Store className="h-8 w-8 opacity-20" />
                                            <p>Sistemde herhangi bir dükkan bulunamadı.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {shops.map((shop) => (
                                <TableRow key={shop.id} className="hover:bg-muted/20 transition-colors group">
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${shop.isActive ? "bg-primary/10" : "bg-red-500/10"}`}>
                                                    <Store className={`h-5 w-5 ${shop.isActive ? "text-primary" : "text-red-500"}`} />
                                                </div>
                                                {shop.isActive ? (
                                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" title="Aktif" />
                                                ) : (
                                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-background" title="Pasif" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-foreground truncate max-w-[180px]">{shop.name}</div>
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
                                        <div className="grid grid-cols-3 gap-2 w-fit">
                                            <div className="flex flex-col" title="Kullanıcılar">
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">USR</span>
                                                <span className="text-sm font-bold">{shop._count.users}</span>
                                            </div>
                                            <div className="flex flex-col" title="Müşteriler">
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">CST</span>
                                                <span className="text-sm font-bold text-blue-500">{shop._count.customers}</span>
                                            </div>
                                            <div className="flex flex-col" title="Servisler">
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">SRV</span>
                                                <span className="text-sm font-bold text-emerald-500">{shop._count.serviceTickets}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {shop.enabledModules.slice(0, 3).map((mod: string) => (
                                                <Badge key={mod} variant="secondary" className="text-[9px] py-0 px-1 bg-white/5 text-gray-400 border-0">
                                                    {mod}
                                                </Badge>
                                            ))}
                                            {shop.enabledModules.length > 3 && (
                                                <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-white/5 text-gray-400 border-0">
                                                    +{shop.enabledModules.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-[10px] font-medium text-muted-foreground">
                                            {new Date(shop.createdAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', year: 'numeric' })}
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
                                                Sistemi Aç
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 text-white rounded-xl shadow-2xl">
                                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Yönetim</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => { setActiveShop(shop); setIsFormOpen(true); }} className="gap-2 cursor-pointer focus:bg-white/5">
                                                        <Settings className="h-4 w-4 text-blue-400" /> Genel Ayarlar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setActiveShop(shop); setIsEditorOpen(true); }} className="gap-2 cursor-pointer focus:bg-white/5">
                                                        <Code2 className="h-4 w-4 text-emerald-400" /> Konfigürasyon (JSON)
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

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
            </AnimatePresence>
        </div>
    );
}
