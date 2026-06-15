"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Trash2,
    Filter,
    Calendar,
    User as UserIcon,
    Activity,
    ArrowRight,
    History,
    AlertCircle,
    CheckCircle2,
    Info,
    MoreVertical,
    Download,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getActivityLogs,
    clearAllActivityLogs
} from "@/lib/actions/audit-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActivityLogsClient({ userRole }: { userRole: string }) {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [filters, setFilters] = useState({
        page: 1,
        search: "",
        action: "all",
        entityType: "all",
        startDate: "",
        endDate: ""
    });

    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canDelete = userRole === "SUPER_ADMIN" || userRole === "SHOP_MANAGER";

    useEffect(() => {
        fetchLogs();
    }, [filters.page, filters.action, filters.entityType]);

    const fetchLogs = async () => {
        setLoading(true);
        const res = await getActivityLogs({
            ...filters,
            action: filters.action === "all" ? undefined : filters.action,
            entityType: filters.entityType === "all" ? undefined : filters.entityType
        });
        if (res.success) {
            setLogs(res.logs || []);
            setPagination(res.pagination);
        } else {
            toast.error(res.error || "Loglar yüklenirken bir hata oluştu.");
        }
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(f => ({ ...f, page: 1 }));
        fetchLogs();
    };

    const handleClearAll = async () => {
        setIsDeleting(true);
        const res = await clearAllActivityLogs();
        if (res.success) {
            toast.success("Tüm loglar temizlendi.");
            setIsClearDialogOpen(false);
            fetchLogs();
        } else {
            toast.error(res.error || "Loglar silinemedi.");
        }
        setIsDeleting(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "PRODUCT": return <Activity className="w-3.5 h-3.5" />;
            case "STAFF": return <UserIcon className="w-3.5 h-3.5" />;
            case "SALE": return <ArrowRight className="w-3.5 h-3.5" />;
            case "SERVICE": return <History className="w-3.5 h-3.5" />;
            default: return <Info className="w-3.5 h-3.5" />;
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case "CREATE": return <Badge className="bg-emerald-500/10 text-emerald-600 border-none">OLUŞTURMA</Badge>;
            case "UPDATE": return <Badge className="bg-blue-500/10 text-blue-600 border-none">GÜNCELLEME</Badge>;
            case "DELETE": return <Badge className="bg-rose-500/10 text-rose-600 border-none">SİLME</Badge>;
            case "LOGIN": return <Badge className="bg-amber-500/10 text-amber-600 border-none">GİRİŞ</Badge>;
            default: return <Badge variant="outline">{action}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">İŞLEM LOGLARI</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">SİSTEM AKTİVİTE TAKİBİ</p>
                </div>
                {canDelete && (
                    <Button
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl h-12 px-6 gap-2 font-black text-xs uppercase"
                        onClick={() => setIsClearDialogOpen(true)}
                    >
                        <Trash2 className="w-4 h-4" /> TÜM LOGLARI TEMİZLE
                    </Button>
                )}
            </div>

            <Card className="p-6 rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Mesaj, personel veya işlem ara..."
                            className="h-14 pl-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-medium"
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        />
                    </div>
                    <Select value={filters.action} onValueChange={(val) => setFilters(f => ({ ...f, action: val, page: 1 }))}>
                        <SelectTrigger className="h-14 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold">
                            <SelectValue placeholder="İşlem Tipi" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all">Tüm İşlemler</SelectItem>
                            <SelectItem value="CREATE">Oluşturma</SelectItem>
                            <SelectItem value="UPDATE">Güncelleme</SelectItem>
                            <SelectItem value="DELETE">Silme</SelectItem>
                            <SelectItem value="LOGIN">Giriş</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.entityType} onValueChange={(val) => setFilters(f => ({ ...f, entityType: val, page: 1 }))}>
                        <SelectTrigger className="h-14 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold">
                            <SelectValue placeholder="Bölüm" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="all">Tüm Bölümler</SelectItem>
                            <SelectItem value="SALE">Satış</SelectItem>
                            <SelectItem value="SERVICE">Teknik Servis</SelectItem>
                            <SelectItem value="PRODUCT">Stok</SelectItem>
                            <SelectItem value="STAFF">Personel</SelectItem>
                            <SelectItem value="FINANCE">Finans</SelectItem>
                        </SelectContent>
                    </Select>
                </form>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">GÜNCEL VERİLER ÇEKİLİYOR...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <Card className="p-20 text-center rounded-[2.5rem] border-none shadow-xl bg-white/50 dark:bg-slate-900/30">
                        <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <X className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">KAYIT BULUNAMADI</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-2">Arama kriterlerinize uygun log kaydı bulunmamaktadır.</p>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {logs.map((log) => (
                                <Card
                                    key={log.id}
                                    className="group p-5 rounded-[2rem] border-none shadow-lg hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none bg-white dark:bg-slate-900/50 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">
                                                {format(new Date(log.createdAt), 'HH:mm', { locale: tr })}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-300">
                                                {format(new Date(log.createdAt), 'dd MMM', { locale: tr })}
                                            </span>
                                        </div>

                                        <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                                            {getTypeIcon(log.entityType)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                {getActionBadge(log.action)}
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-slate-100 dark:border-white/5 opacity-50">
                                                    {log.entityType}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {log.message}
                                            </p>
                                            {log.entityName && (
                                                <p className="text-[10px] font-medium text-muted-foreground mt-1 italic">
                                                    İlgili Kayıt: {log.entityName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="hidden md:flex items-center gap-3 shrink-0 pr-4">
                                            <Avatar className="h-8 w-8 rounded-xl ring-2 ring-slate-100 dark:ring-white/5">
                                                <AvatarImage src={log.user?.image} />
                                                <AvatarFallback className="text-[10px] font-black bg-slate-100 dark:bg-white/10">
                                                    {log.user ? `${log.user.name?.[0] || ""}${log.user.surname?.[0] || ""}` : "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                                                    {log.user ? `${log.user.name} ${log.user.surname || ''}` : "SİSTEM"}
                                                </span>
                                                <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
                                                    {log.user?.role || "OTOMATİK"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-8">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={filters.page === 1}
                                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                    className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                                >
                                    Önceki
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                                        <Button
                                            key={p}
                                            variant={filters.page === p ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setFilters(f => ({ ...f, page: p }))}
                                            className={cn(
                                                "w-10 h-10 rounded-xl text-xs font-black",
                                                filters.page === p ? "bg-slate-900 text-white" : "text-muted-foreground"
                                            )}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={filters.page === pagination.pages}
                                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                    className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                                >
                                    Sonraki
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Clear All Dialog */}
            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-card border-none text-slate-900 dark:text-white rounded-[2.5rem] shadow-2xl overflow-hidden p-0">
                    <div className="bg-rose-500/10 p-8 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-[1.4rem] bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <Trash2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Kayıtlar Siliniyor</DialogTitle>
                            <DialogDescription className="text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-widest mt-1 italic">
                                BU İŞLEM GERİ ALINAMAZ
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="p-8">
                        <p className="text-sm font-medium text-muted-foreground text-center">
                            Tüm işlem loglarını silmek istediğinize emin misiniz? Bu işlemden sonra geçmişe dönük işlem takibi yapılamayacaktır.
                        </p>
                    </div>
                    <DialogFooter className="p-8 pt-0 gap-3 border-t border-slate-50 dark:border-white/5 pt-8">
                        <Button
                            variant="ghost"
                            onClick={() => setIsClearDialogOpen(false)}
                            disabled={isDeleting}
                            className="rounded-2xl h-14 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleClearAll}
                            disabled={isDeleting}
                            className="rounded-3xl h-14 px-10 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/20 disabled:grayscale transition-all"
                        >
                            {isDeleting ? "SİLİNİYOR..." : "HER ŞEYİ SİL"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
