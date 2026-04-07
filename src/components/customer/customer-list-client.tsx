"use client";

import { useState, useTransition, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus, Users, Search, Phone, Star, Building2, UserCircle, Eye,
    MoreHorizontal, Zap, Crown, ShieldCheck, Gem, Trash2,
    ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
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

const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { label: "PLATİN", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Gem };
    if (points >= 500) return { label: "ALTIN", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Crown };
    if (points >= 200) return { label: "GÜMÜŞ", color: "text-gray-300 bg-gray-300/10 border-gray-300/20", icon: ShieldCheck };
    return { label: "BRONZ", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Star };
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
    const [isPending, startTransition] = useTransition();

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
            const result = await deleteCustomer(deleteId);
            if (result.success) {
                toast.success("Müşteri başarıyla silindi.");
                router.refresh();
            } else {
                toast.error(result.error || "Silme işlemi başarısız.");
            }
            setDeleteId(null);
        });
    };

    return (
        <div className="p-8 bg-background text-foreground min-h-screen space-y-8">
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
            <div className="rounded-2xl border border-border/40 overflow-hidden bg-card shadow-xl">
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
                                        <Badge variant="outline" className={`${tier.color} border-none text-[9px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit`}>
                                            <tier.icon className="h-3 w-3" />
                                            {tier.label} ({customer.loyaltyPoints || 0})
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
                                                <span className="text-foreground text-base ">{customer.tickets?.length || 0}</span>
                                                <span className="text-[8px]  text-muted-foreground/60 mt-0.5 uppercase">Servis</span>
                                            </div>
                                            <div className="flex flex-col items-center border-l border-border/30 pl-6">
                                                <span className="text-foreground text-base ">{customer.sales?.length || 0}</span>
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
                        {initialCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-24 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-4">
                                        <Users className="h-16 w-16 opacity-10" />
                                        <p className="text-lg">{search ? "Arama kriterine uyan müşteri bulunamadı." : "Henüz kayıtlı müşteri yok."}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

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
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-background border-border/50 rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Müşteriyi silmek istediğinizden emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Bu işlem geri alınamaz. Müşteriye ait tüm servis ve satış kayıtları etkilenebilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="bg-white/5 border-border/50 text-muted-foreground hover:bg-white/10 hover:text-white rounded-xl">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kalıcı Olarak Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Re-implement cn since it was lost or not imported correctly if I missed it
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}




