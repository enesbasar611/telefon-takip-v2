"use client";

import { useRef } from "react";
import { ExportButtons } from "@/components/reports/export-buttons";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { DeviceBrandChart } from "@/components/charts/device-brand-chart";
import { TopProductsChart } from "@/components/charts/top-products-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    TrendingUp, TrendingDown, Wrench, Users, AlertTriangle,
    BarChart3, Wallet, Smartphone, Package, Activity, Zap
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface RaporlarClientProps {
    stats: any;
    salesData: any[];
    serviceMetrics: any[];
    cashflow: any[];
    topProducts: any[];
    brandDistribution: any[];
    exportData: any;
}

const statCardConfigs = [
    { label: "Bu Ay Net Satış", key: "currentMonthRevenue", icon: TrendingUp, color: "emerald", fmt: "currency" },
    { label: "Tamamlanan Servis", key: "completedServicesThisMonth", icon: Wrench, color: "blue", fmt: "number" },
    { label: "Toplam Müşteri", key: "totalCustomers", icon: Users, color: "violet", fmt: "number" },
    { label: "Kritik Stok Uyarısı", key: "criticalStockCount", icon: AlertTriangle, color: "red", fmt: "number" },
];

const colorMap: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    violet: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
};

const statusLabels: Record<string, string> = {
    PENDING: "Beklemede", APPROVED: "Onay Bekliyor", REPAIRING: "Tamirde",
    WAITING_PART: "Parça Bekliyor", READY: "Hazır", DELIVERED: "Teslim Edildi", CANCELLED: "İptal"
};

export function RaporlarClient({
    stats, salesData, serviceMetrics, cashflow, topProducts, brandDistribution, exportData
}: RaporlarClientProps) {
    const dashboardRef = useRef<HTMLDivElement>(null!);

    return (
        <div ref={dashboardRef} className="flex flex-col gap-8 bg-background text-foreground min-h-screen lg:p-10 p-6 pb-24 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.6rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_24px_theme(colors.primary/0.15)] shrink-0">
                        <BarChart3 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Gerçek Zamanlı</span>
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">Raporlar & Analizler</h1>
                        <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                            {format(new Date(), "d MMMM yyyy", { locale: tr })} • Tüm veriler canlı yüklenmektedir
                        </p>
                    </div>
                </div>
                <ExportButtons exportData={exportData} dashboardRef={dashboardRef} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCardConfigs.map((cfg, i) => {
                    const Icon = cfg.icon;
                    const value = stats?.[cfg.key] ?? 0;
                    const colorCls = colorMap[cfg.color];
                    return (
                        <Card key={i} className={cn("rounded-[2rem] bg-card border border-border/40 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group")}>
                            <CardContent className="p-6 flex flex-col justify-between min-h-[150px]">
                                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-110", colorCls)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="mt-4">
                                    <p className="text-[10px] font-bold text-muted-foreground/60 tracking-[0.18em] uppercase mb-1">{cfg.label}</p>
                                    <p className={cn("text-3xl font-bold tracking-tight", colorCls.split(" ")[0])}>
                                        {cfg.fmt === "currency" ? `₺${Number(value).toLocaleString("tr-TR")}` : value}
                                    </p>
                                    {cfg.key === "currentMonthRevenue" && (
                                        <p className={cn("text-xs font-bold mt-1", stats?.revenueGrowth >= 0 ? "text-emerald-500" : "text-red-500")}>
                                            {stats?.revenueGrowth >= 0 ? "+" : ""}{stats?.revenueGrowth}% geçen aya göre
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Charts: Bento Grid */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* Satış Trendi - 2 cols */}
                <Card className="lg:col-span-2 rounded-[2rem] bg-card border border-border/40 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-7 pb-5">
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight uppercase">Günlük Satış Trendi</CardTitle>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Bu ayın satış performansı</p>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                            <Activity className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Canlı</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-7 pt-4">
                        <SalesTrendChart data={salesData} />
                    </CardContent>
                </Card>

                {/* Servis Dağılımı - 1 col */}
                <Card className="rounded-[2rem] bg-card border border-border/40 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-border/40 p-7 pb-5">
                        <CardTitle className="text-lg font-bold tracking-tight uppercase">Servis Durum Dağılımı</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Statü bazlı analiz</p>
                    </CardHeader>
                    <CardContent className="p-7 pt-4">
                        <ServiceStatusChart data={serviceMetrics} />
                    </CardContent>
                </Card>

                {/* Nakit Akışı - 2 cols */}
                <Card className="lg:col-span-2 rounded-[2rem] bg-card border border-border/40 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-7 pb-5">
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight uppercase">Nakit Akışı</CardTitle>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Gelir vs Gider karşılaştırması</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Gelir</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Gider</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-7 pt-4">
                        <CashflowChart data={cashflow} />
                    </CardContent>
                </Card>

                {/* Cihaz Marka Dağılımı - 1 col */}
                <Card className="rounded-[2rem] bg-card border border-border/40 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-border/40 p-7 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                <Smartphone className="h-4.5 w-4.5 text-violet-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight uppercase">Cihaz Markaları</CardTitle>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">Servis bazlı dağılım</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-7 pt-4">
                        {brandDistribution.length > 0 ? (
                            <DeviceBrandChart data={brandDistribution} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
                                <Smartphone className="h-12 w-12 text-muted-foreground/20" />
                                <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-wide">Henüz Veri Yok</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* En Çok Satan Ürünler */}
            <Card className="rounded-[2rem] bg-card border border-border/40 shadow-xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-7 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Package className="h-4.5 w-4.5 text-amber-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight uppercase">En Çok Satan Ürünler</CardTitle>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">Satış adedi bazlı sıralama</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Top 6</span>
                    </div>
                </CardHeader>
                <CardContent className="p-7 pt-4">
                    {topProducts.length > 0 ? (
                        <TopProductsChart data={topProducts} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
                            <Package className="h-12 w-12 text-muted-foreground/20" />
                            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-wide">Satış Verisi Bulunamadı</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
