"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Trash2,
    Calendar,
    User as UserIcon,
    Activity,
    ArrowRight,
    History,
    Info,
    X,
    Database,
    Wallet,
    Users,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getActivityLogs,
    clearAllActivityLogs
} from "@/lib/actions/audit-actions";
import { getTopCustomersByActivity } from "@/lib/actions/customer-actions";
import { format, subDays, startOfMonth } from "date-fns";
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
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
        return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function ActivityLogsClient({ userRole }: { userRole: string }) {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [totalAllLogs, setTotalAllLogs] = useState<number | null>(null);
    const [topCustomers, setTopCustomers] = useState<any[]>([]);
    const [loadingTopCustomers, setLoadingTopCustomers] = useState(false);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
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
    }, [filters.page, filters.limit, filters.action, filters.entityType, filters.startDate, filters.endDate]);

    useEffect(() => {
        const fetchTopCustomers = async () => {
            setLoadingTopCustomers(true);
            const res = await getTopCustomersByActivity(5);
            if (res.success) {
                setTopCustomers(res.data || []);
            }
            setLoadingTopCustomers(false);
        };
        fetchTopCustomers();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const res = await getActivityLogs({
            page: filters.page,
            limit: filters.limit,
            search: filters.search || undefined,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            action: filters.action === "all" ? undefined : filters.action,
            entityType: filters.entityType === "all" ? undefined : filters.entityType
        });
        if (res.success) {
            setLogs(res.logs || []);
            setPagination(res.pagination);
            if (res.totalAllLogs !== undefined) {
                setTotalAllLogs(res.totalAllLogs);
            }
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
            setTotalAllLogs(0);
            fetchLogs();
        } else {
            toast.error(res.error || "Loglar silinemedi.");
        }
        setIsDeleting(false);
    };

    const setDatePreset = (preset: "all" | "today" | "yesterday" | "last7" | "thisMonth") => {
        const today = new Date();
        if (preset === "all") {
            setFilters(f => ({ ...f, startDate: "", endDate: "", page: 1 }));
        } else if (preset === "today") {
            const d = format(today, "yyyy-MM-dd");
            setFilters(f => ({ ...f, startDate: d, endDate: d, page: 1 }));
        } else if (preset === "yesterday") {
            const d = format(subDays(today, 1), "yyyy-MM-dd");
            setFilters(f => ({ ...f, startDate: d, endDate: d, page: 1 }));
        } else if (preset === "last7") {
            setFilters(f => ({
                ...f,
                startDate: format(subDays(today, 7), "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
                page: 1
            }));
        } else if (preset === "thisMonth") {
            setFilters(f => ({
                ...f,
                startDate: format(startOfMonth(today), "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
                page: 1
            }));
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "PRODUCT": return <Activity className="w-3.5 h-3.5 text-blue-500" />;
            case "STAFF": return <UserIcon className="w-3.5 h-3.5 text-indigo-500" />;
            case "SALE": return <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />;
            case "SERVICE": return <History className="w-3.5 h-3.5 text-violet-500" />;
            case "FINANCE": return <Wallet className="w-3.5 h-3.5 text-amber-500" />;
            case "CUSTOMER": return <Users className="w-3.5 h-3.5 text-cyan-500" />;
            default: return <Info className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case "CREATE": return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold">OLUŞTURMA</Badge>;
            case "UPDATE": return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold">GÜNCELLEME</Badge>;
            case "DELETE": return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold">SİLME</Badge>;
            case "RETURN": return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black">İADE</Badge>;
            case "LOGIN": return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none font-bold">GİRİŞ</Badge>;
            default: return <Badge variant="outline" className="font-bold">{action}</Badge>;
        }
    };

    const activeDatePreset = (() => {
        if (!filters.startDate && !filters.endDate) return "all";
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
        const last7Str = format(subDays(new Date(), 7), "yyyy-MM-dd");
        const monthStartStr = format(startOfMonth(new Date()), "yyyy-MM-dd");

        if (filters.startDate === todayStr && filters.endDate === todayStr) return "today";
        if (filters.startDate === yesterdayStr && filters.endDate === yesterdayStr) return "yesterday";
        if (filters.startDate === last7Str && filters.endDate === todayStr) return "last7";
        if (filters.startDate === monthStartStr && filters.endDate === todayStr) return "thisMonth";
        return "custom";
    })();

    return (
        <div className="space-y-6">
            {/* Top Bar with Title, Total Logs Count, and Clear Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">İŞLEM LOGLARI</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">SİSTEM AKTİVİTE TAKİBİ</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Log Count Badge */}
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shadow-sm">
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Database className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TUTULAN LOG</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {totalAllLogs !== null ? `${totalAllLogs.toLocaleString('tr-TR')} Kayıt` : "..."}
                                </span>
                                {pagination && totalAllLogs !== null && pagination.total !== totalAllLogs && (
                                    <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        {pagination.total.toLocaleString('tr-TR')} filtrelendi
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {canDelete && (
                        <Button
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl h-11 px-5 gap-2 font-black text-xs uppercase border border-rose-500/20 transition-all"
                            onClick={() => setIsClearDialogOpen(true)}
                        >
                            <Trash2 className="w-4 h-4" /> TÜM LOGLARI TEMİZLE
                        </Button>
                    )}
                </div>
            </div>

            {/* Top Active Customers */}
            {!loadingTopCustomers && topCustomers.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">EN ÇOK İŞLEM YAPAN MÜŞTERİLER</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {topCustomers.map(customer => (
                            <Card 
                                key={customer.id} 
                                className="p-4 rounded-3xl border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 cursor-pointer hover:-translate-y-1 transition-all duration-300"
                                onClick={() => {
                                    setFilters(f => ({ ...f, search: customer.name, page: 1 }));
                                    setTimeout(() => fetchLogs(), 50);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border-2 border-slate-100 dark:border-slate-800">
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="text-sm font-bold truncate" title={customer.name}>{customer.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{customer.activityScore || 0} İŞLEM</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters Container */}
            <Card className="p-5 md:p-6 rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl space-y-4">
                {/* Search & Selects */}
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                    <div className="relative sm:col-span-2 lg:col-span-5">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Mesaj, personel veya işlem ara..."
                            className="h-12 pl-12 pr-10 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-medium"
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        />
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFilters(f => ({ ...f, search: "", page: 1 }));
                                    setTimeout(() => fetchLogs(), 50);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="lg:col-span-3">
                        <Select value={filters.action} onValueChange={(val) => setFilters(f => ({ ...f, action: val, page: 1 }))}>
                            <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold">
                                <SelectValue placeholder="İşlem Tipi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="all">Tüm İşlemler</SelectItem>
                                <SelectItem value="CREATE">Oluşturma</SelectItem>
                                <SelectItem value="UPDATE">Güncelleme</SelectItem>
                                <SelectItem value="DELETE">Silme</SelectItem>
                                <SelectItem value="RETURN">İade</SelectItem>
                                <SelectItem value="LOGIN">Giriş</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="lg:col-span-2">
                        <Select value={filters.entityType} onValueChange={(val) => setFilters(f => ({ ...f, entityType: val, page: 1 }))}>
                            <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold">
                                <SelectValue placeholder="Bölüm" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="all">Tüm Bölümler</SelectItem>
                                <SelectItem value="SALE">Satış</SelectItem>
                                <SelectItem value="SERVICE">Teknik Servis</SelectItem>
                                <SelectItem value="PRODUCT">Stok</SelectItem>
                                <SelectItem value="CUSTOMER">Müşteri / Veresiye</SelectItem>
                                <SelectItem value="FINANCE">Finans / Kasa</SelectItem>
                                <SelectItem value="STAFF">Personel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="lg:col-span-2">
                        <Select
                            value={String(filters.limit)}
                            onValueChange={(val) => setFilters(f => ({ ...f, limit: Number(val), page: 1 }))}
                        >
                            <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold">
                                <SelectValue placeholder="Sayfa Boyutu" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="20">20 Kayıt / Sayfa</SelectItem>
                                <SelectItem value="50">50 Kayıt / Sayfa</SelectItem>
                                <SelectItem value="100">100 Kayıt / Sayfa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>

                {/* Date Filters & Presets */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-slate-400 mr-1 text-xs font-bold uppercase tracking-wider">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>Tarih:</span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant={activeDatePreset === "all" ? "default" : "outline"}
                            onClick={() => setDatePreset("all")}
                            className={cn(
                                "h-8 px-3 rounded-xl text-xs font-bold transition-all",
                                activeDatePreset === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border-slate-200/70 dark:border-white/10"
                            )}
                        >
                            Tümü
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={activeDatePreset === "today" ? "default" : "outline"}
                            onClick={() => setDatePreset("today")}
                            className={cn(
                                "h-8 px-3 rounded-xl text-xs font-bold transition-all",
                                activeDatePreset === "today" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border-slate-200/70 dark:border-white/10"
                            )}
                        >
                            Bugün
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={activeDatePreset === "yesterday" ? "default" : "outline"}
                            onClick={() => setDatePreset("yesterday")}
                            className={cn(
                                "h-8 px-3 rounded-xl text-xs font-bold transition-all",
                                activeDatePreset === "yesterday" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border-slate-200/70 dark:border-white/10"
                            )}
                        >
                            Dün
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={activeDatePreset === "last7" ? "default" : "outline"}
                            onClick={() => setDatePreset("last7")}
                            className={cn(
                                "h-8 px-3 rounded-xl text-xs font-bold transition-all",
                                activeDatePreset === "last7" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border-slate-200/70 dark:border-white/10"
                            )}
                        >
                            Son 7 Gün
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={activeDatePreset === "thisMonth" ? "default" : "outline"}
                            onClick={() => setDatePreset("thisMonth")}
                            className={cn(
                                "h-8 px-3 rounded-xl text-xs font-bold transition-all",
                                activeDatePreset === "thisMonth" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border-slate-200/70 dark:border-white/10"
                            )}
                        >
                            Bu Ay
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-2xl">
                            <span className="text-[11px] font-bold text-slate-400">Başlangıç:</span>
                            <Input
                                type="date"
                                className="h-8 w-36 bg-transparent border-none text-xs font-semibold p-0 focus-visible:ring-0"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, page: 1 }))}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-2xl">
                            <span className="text-[11px] font-bold text-slate-400">Bitiş:</span>
                            <Input
                                type="date"
                                className="h-8 w-36 bg-transparent border-none text-xs font-semibold p-0 focus-visible:ring-0"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value, page: 1 }))}
                            />
                        </div>
                        {(filters.startDate || filters.endDate) && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setFilters(f => ({ ...f, startDate: "", endDate: "", page: 1 }))}
                                className="h-8 px-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold gap-1"
                                title="Tarihleri Temizle"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Temizle</span>
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Logs List & Windowed Pagination */}
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
                        <p className="text-sm font-medium text-muted-foreground mt-2">Arama veya tarih kriterlerinize uygun log kaydı bulunmamaktadır.</p>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {logs.map((log) => (
                                <Card
                                    key={log.id}
                                    className="group p-5 rounded-[2rem] border-none shadow-lg hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none bg-white dark:bg-slate-900/50 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className="flex flex-col items-center gap-1 shrink-0 px-2 min-w-[50px]">
                                            <span className="text-[11px] font-black text-slate-400 uppercase">
                                                {format(new Date(log.createdAt), 'HH:mm', { locale: tr })}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {format(new Date(log.createdAt), 'dd MMM', { locale: tr })}
                                            </span>
                                        </div>

                                        <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                                            {getTypeIcon(log.entityType)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                                {getActionBadge(log.action)}
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-slate-200 dark:border-white/10 opacity-70">
                                                    {log.entityType}
                                                </Badge>
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
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

                        {/* Fixed Smart Windowed Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 px-2">
                                <div className="text-xs font-bold text-muted-foreground">
                                    Sayfa <span className="text-slate-900 dark:text-white font-black">{pagination.currentPage}</span> / {pagination.pages}
                                    <span className="mx-2">•</span>
                                    Toplam <span className="text-slate-900 dark:text-white font-black">{pagination.total.toLocaleString('tr-TR')}</span> kayıt
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                    {/* First Page */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={filters.page === 1}
                                        onClick={() => setFilters(f => ({ ...f, page: 1 }))}
                                        className="w-9 h-9 rounded-xl text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                        title="İlk Sayfa"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </Button>

                                    {/* Previous Page */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={filters.page === 1}
                                        onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                        className="w-9 h-9 rounded-xl text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                        title="Önceki Sayfa"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    {/* Windowed Page Numbers */}
                                    {getVisiblePages(pagination.currentPage, pagination.pages).map((p, idx) => {
                                        if (p === "...") {
                                            return (
                                                <span
                                                    key={`ellipsis-${idx}`}
                                                    className="w-8 text-center text-xs font-bold text-slate-400 select-none"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        const pageNum = Number(p);
                                        const isActive = filters.page === pageNum;

                                        return (
                                            <Button
                                                key={`page-${pageNum}`}
                                                variant={isActive ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setFilters(f => ({ ...f, page: pageNum }))}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl text-xs font-black transition-all",
                                                    isActive
                                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}

                                    {/* Next Page */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={filters.page === pagination.pages}
                                        onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                        className="w-9 h-9 rounded-xl text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                        title="Sonraki Sayfa"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>

                                    {/* Last Page */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={filters.page === pagination.pages}
                                        onClick={() => setFilters(f => ({ ...f, page: pagination.pages }))}
                                        className="w-9 h-9 rounded-xl text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                        title="Son Sayfa"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </Button>
                                </div>
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
                            variant="cancel"
                            onClick={() => setIsClearDialogOpen(false)}
                            disabled={isDeleting}
                            className="rounded-2xl h-14 px-8 text-[10px] font-black uppercase tracking-widest"
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
