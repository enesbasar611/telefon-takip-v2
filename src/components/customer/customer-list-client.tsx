"use client";

import { useState, useTransition, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus, Users, Search, Phone, Star, Building2, UserCircle, Eye,
    MoreHorizontal, Zap, Crown, ShieldCheck, Gem, Trash2,
    ChevronLeft, ChevronRight, Loader2, Sparkles,
    AlertTriangle, CheckCircle2
} from "lucide-react";
import {
    Dialog, DialogContent
} from "@/components/ui/dialog";
import { getLoyaltyTier } from "@/lib/loyalty-utils";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCustomer } from "@/lib/actions/customer-actions";
import { toast } from "sonner";
import { useDebounce } from "@/lib/hooks/use-debounce";

const getTierColor = (color: string) => {
    switch (color) {
        case "slate": return "text-slate-400 bg-slate-400/10 border-slate-400/20";
        case "zinc": return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
        case "amber": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        case "purple": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
        default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
};

interface Props {
    initialCustomers: any[];
    totalPages: number;
    totalCount: number;
    currentPage: number;
}

export function CustomerListClient({ initialCustomers, totalPages, totalCount, currentPage }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const debouncedSearch = useDebounce(search, 500);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteOptions, setDeleteOptions] = useState({
        deleteRecords: true,
        revertStock: false,
        clearBalance: true,
    });
    const [isPending, startTransition] = useTransition();

    const getCustomerCount = (customer: any, key: "tickets" | "sales") => {
        return customer._count?.[key] ?? customer[key]?.length ?? 0;
    };

    // Sync search to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            params.set("search", debouncedSearch);
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.push(`${pathname}?${params.toString()}`);
    }, [debouncedSearch]);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        startTransition(async () => {
            const result = await deleteCustomer(deleteId, deleteOptions);
            if (result.success) {
                toast.success("Müşteri başarıyla silindi.");
                router.refresh();
            } else {
                toast.error((result as any).error || "Silme işlemi başarısız.");
            }
            setDeleteId(null);
        });
    };

    return (
        <div className="animate-in fade-in duration-700 space-y-10">
            <PageHeader
                title="Müşteri Portföyü"
                description={`Toplam ${totalCount} müşteri kayıtlı. Müşteri bazlı işlem geçmişini ve sadakat puanlarını takip edin.`}
                icon={Users}
                actions={
                    <Link href="/musteriler/yeni">
                        <Button className="bg-blue-500 hover:bg-blue-400 text-black px-8 h-12 rounded-2xl transition-all hover:-translate-y-1 flex gap-3">
                            <Plus className="h-5 w-5 stroke-[3px]" />
                            YENİ MÜŞTERİ TANIMLA
                        </Button>
                    </Link>
                }
            />

            {/* Search */}
            <div className="grid grid-cols-1 gap-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Müşteri adı, telefon veya e-posta ile ara..."
                        className="h-16 pl-12 rounded-[1.5rem] text-sm border-border/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                    {isPending && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="md:rounded-2xl md:border border-border/40 overflow-hidden bg-card shadow-xl">
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="font-medium bg-muted/10">
                            <TableRow className="border-b border-border/40 hover:bg-transparent">
                                <TableHead className="font-medium px-8 py-5 text-[10px] text-muted-foreground/60 uppercase tracking-widest">Profil Bilgisi</TableHead>
                                <TableHead className="font-medium py-5 text-[10px] text-muted-foreground/60 uppercase tracking-widest">Sadakat</TableHead>
                                <TableHead className="font-medium py-5 text-[10px] text-muted-foreground/60 uppercase tracking-widest">İletişim</TableHead>
                                <TableHead className="font-medium py-5 text-[10px] text-muted-foreground/60 uppercase tracking-widest text-center">İşlem Hacmi</TableHead>
                                <TableHead className="font-medium px-8 py-5 text-[10px] text-muted-foreground/60 uppercase tracking-widest text-right">Aksiyon</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialCustomers.map((customer: any) => {
                                const tier = getLoyaltyTier(customer.loyaltyPoints || 0);
                                return (
                                    <TableRow key={customer.id} className="border-b border-border/20 group hover:bg-muted/10 transition-colors">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center relative group-hover:bg-muted/50 transition-all overflow-hidden">
                                                    {customer.photo ? (
                                                        <img src={customer.photo} alt={customer.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <UserCircle className="h-7 w-7 text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
                                                    )}
                                                    {customer.isVip && (
                                                        <div className="absolute top-0 right-0 h-4 w-4 bg-blue-500 flex items-center justify-center rounded-bl-lg">
                                                            <Zap className="h-2 w-2 text-white fill-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-foreground group-hover:text-blue-500 transition-colors">{customer.name}</span>
                                                        {customer.isVip && (
                                                            <Badge className="bg-blue-500/10 text-blue-500 border-none text-[8px] px-2 py-1 rounded-lg">VIP</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                                                        {customer.type === 'KURUMSAL' ? <Building2 className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />}
                                                        {customer.type || "BİREYSEL"}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getTierColor(tier.color)} border-none text-[9px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit`}>
                                                <Sparkles className="h-3 w-3" />
                                                {tier.name} ({customer.loyaltyPoints || 0})
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-blue-500">
                                                    <Phone className="h-3 w-3" />
                                                    {customer.phone || "—"}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground/60 truncate max-w-[150px]">
                                                    {customer.email || "E-posta yok"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-6">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-foreground text-base ">{getCustomerCount(customer, "tickets")}</span>
                                                    <span className="text-[8px]  text-muted-foreground/60 mt-0.5 uppercase">Servis</span>
                                                </div>
                                                <div className="flex flex-col items-center border-l border-border/30 pl-6">
                                                    <span className="text-foreground text-base ">{getCustomerCount(customer, "sales")}</span>
                                                    <span className="text-[8px]  text-muted-foreground/60 mt-0.5 uppercase">Satış</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/musteriler/${customer.id}`}>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl border border-border/40 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 transition-all">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="p-2 min-w-[200px]">
                                                        <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 p-3 text-center uppercase tracking-widest">Profil Yönetimi</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <Link href={`/musteriler/duzenle/${customer.id}`}>
                                                            <DropdownMenuItem className="p-3 text-[10px] rounded-lg cursor-pointer flex gap-3 items-center text-foreground">
                                                                <UserCircle className="h-4 w-4 text-blue-500" /> Profili Düzenle
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="p-3 text-[10px] rounded-lg cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 flex gap-3 items-center"
                                                            onClick={() => setDeleteId(customer.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Kalıcı Olarak Sil
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

                {/* Mobile Card View */}
                <div className="flex flex-col divide-y divide-border/20 min-h-[400px] md:hidden">
                    {initialCustomers.map((customer: any) => {
                        const tier = getLoyaltyTier(customer.loyaltyPoints || 0);
                        return (
                            <div key={customer.id} className="p-4 flex flex-col gap-4 active:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center relative overflow-hidden">
                                            {customer.photo ? (
                                                <img src={customer.photo} alt={customer.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserCircle className="h-7 w-7 text-muted-foreground/50" />
                                            )}
                                            {customer.isVip && (
                                                <div className="absolute top-0 right-0 h-4 w-4 bg-blue-500 flex items-center justify-center rounded-bl-lg">
                                                    <Zap className="h-2 w-2 text-white fill-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-foreground">{customer.name}</span>
                                                {customer.isVip && (
                                                    <Badge className="bg-blue-500/10 text-blue-500 border-none text-[8px] px-2 py-0.5 rounded-lg">VIP</Badge>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-blue-500 font-medium">{customer.phone || "—"}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`${getTierColor(tier.color)} border-none text-[8px] px-2 py-1 rounded-lg flex items-center gap-1`}>
                                        <Sparkles className="h-2.5 w-2.5" />
                                        {tier.name}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted/20 rounded-xl p-3 flex flex-col items-center justify-center border border-border/30">
                                        <span className="text-lg font-bold text-foreground">{getCustomerCount(customer, "tickets")}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Servis Kaydı</span>
                                    </div>
                                    <div className="bg-muted/20 rounded-xl p-3 flex flex-col items-center justify-center border border-border/30">
                                        <span className="text-lg font-bold text-foreground">{getCustomerCount(customer, "sales")}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Toplam Satış</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link href={`/musteriler/${customer.id}`} className="flex-1">
                                        <Button className="w-full h-11 bg-muted/50 hover:bg-muted text-foreground rounded-xl border border-border/40 gap-2 text-xs">
                                            <Eye className="h-4 w-4" /> Detayları Gör
                                        </Button>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border border-border/40 text-muted-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="p-2 min-w-[200px]">
                                            <Link href={`/musteriler/duzenle/${customer.id}`}>
                                                <DropdownMenuItem className="p-3 text-[10px] rounded-lg cursor-pointer flex gap-3 items-center">
                                                    <UserCircle className="h-4 w-4 text-blue-500" /> Profili Düzenle
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuItem
                                                className="p-3 text-[10px] rounded-lg cursor-pointer text-rose-500 flex gap-3 items-center"
                                                onClick={() => setDeleteId(customer.id)}
                                            >
                                                <Trash2 className="h-4 w-4" /> Kalıcı Olarak Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                            Sayfa {currentPage} / {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-10 w-10 rounded-xl border-border/40 hover:bg-muted transition-all"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1 px-2">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = currentPage;
                                    if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    if (pageNum > 0 && pageNum <= totalPages) {
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "ghost"}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={cn(
                                                    "h-10 w-10 rounded-xl text-[10px] font-bold transition-all",
                                                    currentPage === pageNum ? "bg-blue-500 text-black hover:bg-blue-400" : "text-muted-foreground"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="h-10 w-10 rounded-xl border-border/40 hover:bg-muted transition-all"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-0 overflow-hidden sm:max-w-[500px] shadow-2xl">
                    <div className="p-8 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <Trash2 className="h-7 w-7 text-rose-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white tracking-tight">Müşteriyi Sil</h3>
                                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest mt-1">Veri Temizleme ve Stok Yönetimi</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex gap-3 italic">
                                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                                <p className="text-[12px] text-rose-200/80 leading-relaxed font-medium">
                                    Dikkat: Bu müşteri silindiğinde, aşağıdaki seçimlerinize göre sistemdeki tüm bağlı veriler de etkilenir.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                <button
                                    onClick={() => setDeleteOptions(prev => ({ ...prev, deleteRecords: !prev.deleteRecords }))}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                        deleteOptions.deleteRecords ? "bg-blue-500/5 border-blue-500/20 text-blue-400" : "bg-white/[0.02] border-white/5 text-muted-foreground hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold">İşlem Geçmişini Sil</p>
                                        <p className="text-[10px] opacity-60">Satış ve servis kayıtları tamamen kaldırılır.</p>
                                    </div>
                                    <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", deleteOptions.deleteRecords ? "border-blue-500 bg-blue-500" : "border-muted/20")}>
                                        {deleteOptions.deleteRecords && <CheckCircle2 className="h-4 w-4 text-black stroke-[3px]" />}
                                    </div>
                                </button>

                                {deleteOptions.deleteRecords && (
                                    <button
                                        onClick={() => setDeleteOptions(prev => ({ ...prev, revertStock: !prev.revertStock }))}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left animate-in slide-in-from-top-2",
                                            deleteOptions.revertStock ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-white/[0.02] border-white/5 text-muted-foreground hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">Ürünleri Stoka İade Et</p>
                                            <p className="text-[10px] opacity-60">Silinen satışlardaki ürünler envanter sayısına geri eklenir.</p>
                                        </div>
                                        <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", deleteOptions.revertStock ? "border-emerald-500 bg-emerald-500" : "border-muted/20")}>
                                            {deleteOptions.revertStock && <CheckCircle2 className="h-4 w-4 text-black stroke-[3px]" />}
                                        </div>
                                    </button>
                                )}

                                <button
                                    onClick={() => setDeleteOptions(prev => ({ ...prev, clearBalance: !prev.clearBalance }))}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                        deleteOptions.clearBalance ? "bg-amber-500/5 border-amber-500/20 text-amber-500" : "bg-white/[0.02] border-white/5 text-muted-foreground hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold">Bakiyeyi ve Borçları Sil</p>
                                        <p className="text-[10px] opacity-60">Müşterinin borç ve alacak kayıtları finansal dökümden çıkarılır.</p>
                                    </div>
                                    <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", deleteOptions.clearBalance ? "border-amber-500 bg-amber-500" : "border-muted/20")}>
                                        {deleteOptions.clearBalance && <CheckCircle2 className="h-4 w-4 text-black stroke-[3px]" />}
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteId(null)}
                                className="flex-1 h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                            >
                                Vazgeç
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="flex-[2] h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all shadow-[0_0_30px_rgba(225,29,72,0.2)]"
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verileri Kalıcı Olarak Sil"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// cn is already imported or defined elsewhere if needed, but we keep it here if it's the only one
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}




