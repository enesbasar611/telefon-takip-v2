"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Search,
    RefreshCcw,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Package,
    User,
    ArrowLeftRight,
    AlertTriangle,
    Eye,
    ChevronDown,
    Loader2,
    MoreVertical,
    FileText,
    History,
    TrendingUp,
    TrendingDown,
    ShieldAlert,
    Undo2,
    Plus,
    Navigation
} from "lucide-react";
import { processReturn, rejectReturn } from "@/lib/actions/return-actions";
import { AddReturnModal } from "@/components/stock/add-return-modal";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { cn } from "@/lib/utils";

interface ReturnsClientProps {
    initialData: any[];
}

export function ReturnsClient({ initialData }: ReturnsClientProps) {
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Modals
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [returnAction, setReturnAction] = useState<string>("RESTOCKED");
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isAddReturnOpen, setIsAddReturnOpen] = useState(false);
    const [rejectNotes, setRejectNotes] = useState("");
    const [addReturnInitialData, setAddReturnInitialData] = useState<any>(undefined);

    // Auto-open modal from URL params (e.g. from veresiye page)
    useEffect(() => {
        const customerId = searchParams.get("customerId");
        const customerName = searchParams.get("customerName");
        const debtId = searchParams.get("debtId");
        const productId = searchParams.get("productId");
        const productName = searchParams.get("productName");
        const quantity = searchParams.get("quantity");
        const refundAmount = searchParams.get("refundAmount");
        const saleId = searchParams.get("saleId");

        if (customerId && (productId || debtId)) {
            setAddReturnInitialData({
                sourceType: "CUSTOMER" as const,
                sourceId: customerId,
                sourceName: customerName || "",
                items: [{
                    productId: productId || undefined,
                    name: productName || "",
                    quantity: parseInt(quantity || "1"),
                    refundAmount: parseFloat(refundAmount || "0"),
                    debtId: debtId || undefined,
                    saleId: saleId || undefined,
                }]
            });
            setIsAddReturnOpen(true);
        }
    }, [searchParams]);


    const filteredData = useMemo(() => {
        return initialData.filter(ticket => {
            const matchesSearch =
                ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.notes?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || ticket.returnStatus === statusFilter;
            const matchesSource = sourceFilter === "all" || ticket.sourceType === sourceFilter;

            return matchesSearch && matchesStatus && matchesSource;
        });
    }, [initialData, searchTerm, statusFilter, sourceFilter]);

    const stats = useMemo(() => {
        const pending = initialData.filter(t => t.returnStatus === "PENDING").length;
        const approvedThisMonth = initialData.filter(t =>
            t.returnStatus === "APPROVED" &&
            new Date(t.updatedAt).getMonth() === new Date().getMonth()
        ).length;
        const totalRefund = initialData
            .filter(t => t.returnStatus === "APPROVED")
            .reduce((acc, t) => acc + Number(t.refundAmount || 0), 0);

        return { pending, approvedThisMonth, totalRefund };
    }, [initialData]);

    const handleApprove = async () => {
        if (!selectedTicket) return;
        startTransition(async () => {
            const res = await processReturn(selectedTicket.id, returnAction as any);
            if (res.success) {
                toast.success("İade onaylandı. İşlem başarıyla uygulandı.");
                setIsApproveModalOpen(false);
                setSelectedTicket(null);
                router.refresh();
            } else {
                toast.error(res.error || "Onaylanırken hata oluştu.");
            }
        });
    };

    const handleReject = async () => {
        if (!selectedTicket) return;
        startTransition(async () => {
            const res = await rejectReturn(selectedTicket.id, rejectNotes);
            if (res.success) {
                toast.success("İade reddedildi.");
                setIsRejectModalOpen(false);
                setSelectedTicket(null);
                setRejectNotes("");
                router.refresh();
            } else {
                toast.error(res.error || "Reddedilirken hata oluştu.");
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 rounded-full text-[10px]"><Clock className="w-3 h-3 mr-1" /> Bekliyor</Badge>;
            case "APPROVED":
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Onaylandı</Badge>;
            case "RESTOCKED":
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> İade Alındı (Stok)</Badge>;
            case "EXCHANGED":
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Yenisi Verildi</Badge>;
            case "SENT_TO_SUPPLIER":
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-2 py-0.5 rounded-full text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Tedarikçiye Gönderildi</Badge>;
            case "REFUNDED":
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Tamamen İade Edildi</Badge>;
            case "REJECTED":
                return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-2 py-0.5 rounded-full text-[10px]"><XCircle className="w-3 h-3 mr-1" /> Reddedildi</Badge>;
            default:
                return null;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case "SERVICE": return "Teknik Servis";
            case "SALE": return "Peşin Satış";
            case "DEBT": return "Veresiye";
            case "PURCHASE": return "Tedarikçi";
            default: return source;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="w-12 h-12 text-amber-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bekleyen İadeler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Onay bekleyen toplam kayıt</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aylık Onaylanan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{stats.approvedThisMonth}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Bu ay sonuçlanan iadeler</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-none shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingDown className="w-12 h-12 text-rose-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Toplam İade Tutarı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺{stats.totalRefund.toLocaleString('tr-TR')}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Onaylanmış iadelerin toplamı</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
                <div className="flex flex-1 items-center gap-3 w-full">
                    <div className="relative flex-1 max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="İade no, ürün veya müşteri ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-background/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-10 bg-background/50 border-none rounded-xl">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            <SelectItem value="PENDING">Bekleyenler</SelectItem>
                            <SelectItem value="APPROVED">Onaylananlar</SelectItem>
                            <SelectItem value="REJECTED">Reddedilenler</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-[140px] h-10 bg-background/50 border-none rounded-xl">
                            <SelectValue placeholder="Kaynak" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                            <SelectItem value="SERVICE">Servis</SelectItem>
                            <SelectItem value="SALE">Satış</SelectItem>
                            <SelectItem value="DEBT">Veresiye</SelectItem>
                            <SelectItem value="PURCHASE">Tedarikçi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="rounded-xl h-11 px-4 flex-1 md:flex-none">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtrele
                    </Button>
                    <Button
                        onClick={() => setIsAddReturnOpen(true)}
                        className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 flex-1 md:flex-none"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni İade Kaydı
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => router.refresh()}>
                        <RefreshCcw className={cn("h-4 w-4", isPending && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 overflow-hidden shadow-xl">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider pl-6 py-4">İade Bilgisi</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider">Kaynak & Ürün</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider">Müşteri / Bayi</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">İade Tutarı</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Durum</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider pr-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                            <Undo2 className="w-12 h-12" />
                                            <p className="text-sm">Henüz bir iade kaydı bulunmuyor.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((ticket, index) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        className="group hover:bg-muted/20 border-border/40 transition-all cursor-default"
                                    >
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                                    ticket.returnStatus === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                                                        ticket.returnStatus !== "REJECTED" ? "bg-emerald-500/10 text-emerald-500" :
                                                            "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    <Navigation className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold font-mono">{ticket.ticketNumber}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {format(new Date(ticket.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-medium text-primary uppercase tracking-tight">
                                                    {getSourceLabel(ticket.sourceType)}
                                                </span>
                                                <span className="text-xs font-semibold">{ticket.product?.name || "Hizmet/Ürün Belirtilmemiş"}</span>
                                                {ticket.quantity > 1 && (
                                                    <span className="text-[10px] text-muted-foreground">{ticket.quantity} Adet</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                    {ticket.customer?.photo ? (
                                                        <img src={ticket.customer.photo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{ticket.customer?.name || ticket.supplier?.name || "Bilinmiyor"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{ticket.customer?.phone || ticket.supplier?.phone || "-"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">₺{Number(ticket.refundAmount || 0).toLocaleString('tr-TR')}</span>
                                                <span className="text-[9px] text-muted-foreground">{ticket.refundCurrency}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(ticket.returnStatus)}
                                        </TableCell>
                                        <TableCell className="pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-2xl p-1 bg-popover/90 backdrop-blur-sm">
                                                    <DropdownMenuItem className="rounded-lg gap-2 text-xs" onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        // Show a detailed detail view... (future work)
                                                    }}>
                                                        <Eye className="w-3.5 h-3.5" /> Detayları Gör
                                                    </DropdownMenuItem>

                                                    {ticket.returnStatus === "PENDING" && (
                                                        <>
                                                            <div className="h-px bg-muted my-1" />
                                                            <DropdownMenuItem
                                                                className="rounded-lg gap-2 text-xs text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10"
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setReturnAction("RESTOCKED");
                                                                    setIsApproveModalOpen(true);
                                                                }}
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> İadeyi İşle
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="rounded-lg gap-2 text-xs text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setIsRejectModalOpen(true);
                                                                }}
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" /> Reddet
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Approve Modal */}
            <AlertDialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            İadeyi Onaylıyor musunuz? İşlem Yöntemi Seçin:
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            <div className="mt-4 mb-4">
                                <Select value={returnAction} onValueChange={setReturnAction}>
                                    <SelectTrigger className="w-full bg-muted/30 border-none rounded-xl h-12">
                                        <SelectValue placeholder="İşlem Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RESTOCKED">İade Alındı (Stoğa Eklendi)</SelectItem>
                                        <SelectItem value="EXCHANGED">Yenisi Verildi (Değiştirildi)</SelectItem>
                                        <SelectItem value="SENT_TO_SUPPLIER">Tedarikçiye İade Gönderildi</SelectItem>
                                        <SelectItem value="REFUNDED">Tamamen İade Yapıldı (Borç Düş/Para İadesi)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(returnAction === "RESTOCKED" || returnAction === "REFUNDED") && selectedTicket?.restockProduct && <span className="text-emerald-500 font-medium">• {selectedTicket.quantity} Adet ürün stoğa geri eklenecektir.<br /></span>}
                            {returnAction === "EXCHANGED" && <span className="text-rose-500 font-medium">• {selectedTicket?.quantity} Adet sağlam ürün stoktan düşülecektir.<br /></span>}

                            {(returnAction === "RESTOCKED" || returnAction === "REFUNDED") && selectedTicket?.sourceType === "DEBT" && <span className="text-emerald-500 font-medium">• Müşterinin borç bakiye tutarı ₺{Number(selectedTicket.refundAmount).toLocaleString('tr-TR')} azalacaktır.</span>}
                            {(returnAction === "RESTOCKED" || returnAction === "REFUNDED") && selectedTicket?.sourceType === "SALE" && <span className="text-rose-500 font-medium">• Kasa hesabından ₺{Number(selectedTicket.refundAmount).toLocaleString('tr-TR')} para iadesi çıkışı yapılacaktır.</span>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-none bg-muted/50">Vazgeç</AlertDialogCancel>
                        <Button
                            disabled={isPending}
                            onClick={handleApprove}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Onayla ve Güncelle"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject Modal */}
            <AlertDialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-500">
                            <XCircle className="w-5 h-5" />
                            İadeyi Reddet
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            İade talebi reddedilecektir. Red nedenini aşağıya yazabilirsiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Input
                            placeholder="Red nedeni (isteğe bağlı)..."
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            className="bg-muted/30 border-none rounded-xl"
                        />
                    </div>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-none bg-muted/50">Vazgeç</AlertDialogCancel>
                        <Button
                            disabled={isPending}
                            onClick={handleReject}
                            className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "İadeyi Reddet"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AddReturnModal
                open={isAddReturnOpen}
                onOpenChange={(v) => {
                    setIsAddReturnOpen(v);
                    if (!v) setAddReturnInitialData(undefined);
                }}
                initialData={addReturnInitialData}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </div>
    );
}
