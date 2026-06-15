"use client";

import { useState } from "react";
import {
    Users,
    Wallet,
    Wrench,
    AlertTriangle,
    ArrowUpRight,
    Settings,
    LayoutDashboard,
    Smartphone,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    Banknote,
    ArrowDownCircle,
    Zap,
    Activity,
    ShoppingCart
} from "lucide-react";
import { StatWidgetWrapper } from "@/components/dashboard/stat-widget-wrapper";
import { DashboardEditButton } from "@/components/dashboard/dashboard-edit-button";
import { StaffDashboardClient } from "@/components/dashboard/staff-dashboard-client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { LiveClock } from "@/components/dashboard/live-clock";
import { QuickShortcuts } from "@/components/dashboard/quick-shortcuts";
import { DashboardOnboardingClient } from "@/components/setup/dashboard-onboarding-client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Streamed Components
import { RevenueAnalysisStream } from "@/components/dashboard/streamed/revenue-analysis-stream";
import { ServiceStatusStream } from "@/components/dashboard/streamed/service-status-stream";
import { SmartInsightsStream } from "@/components/dashboard/streamed/smart-insights-stream";
import { LiveActivityStream } from "@/components/dashboard/streamed/live-activity-stream";
import { RecentTransactionsStream } from "@/components/dashboard/streamed/recent-transactions-stream";
import { ServiceQueueStream } from "@/components/dashboard/streamed/service-queue-stream";
import { TopProductsStream } from "@/components/dashboard/streamed/top-products-stream";
import { ShortageStatusCard } from "@/components/dashboard/widgets/shortage-status-card";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

interface AdminDashboardProps {
    stats: any;
    rates?: any;
    user: any;
    shop: any;
    categories: any;
    suppliers: any;
    staffData: any;
    userName: string;
    shopId?: string;
    defaultCurrency?: string;
}

export function AdminDashboard({
    stats,
    rates,
    user,
    shop,
    categories,
    suppliers,
    staffData,
    userName,
    shopId,
    defaultCurrency = "TRY"
}: AdminDashboardProps) {
    const [viewMode, setViewMode] = useState<"system" | "staff">("system");

    // Format and enhance stats
    const s = stats || {};
    const usdRate = rates?.usd || 34;

    const formatCurrency = (val: any) => {
        const num = Number(val || 0);
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getUSD = (val: any) => {
        const num = Number(val || 0);
        return (num / usdRate).toFixed(2);
    };

    const statItems = [
        {
            id: "stat_sales",
            label: "Kasa Bakiyesi",
            value: s.kasaBalance,
            subValue: `Günün Satışı: ${defaultCurrency === "USD" ? `$${(Number(s.todaySales) / usdRate).toFixed(2)}` : `₺${formatCurrency(s.todaySales)}`}`,
            iconId: "Wallet",
            colorClass: "text-primary",
            bgClass: "bg-primary/10",
            badge: "Güncel",
            usdValue: getUSD(s.kasaBalance)
        },
        {
            id: "stat_accounts",
            label: "Satış Hacmi",
            value: s.todaySales,
            subValue: "Bugünkü ciro",
            iconId: "ShoppingCart",
            colorClass: "text-primary",
            bgClass: "bg-primary/10",
            usdValue: getUSD(s.todaySales)
        },
        {
            id: "stat_income",
            label: "Servis Gelirleri",
            value: s.todayRepairIncome,
            iconId: "Wrench",
            colorClass: "text-secondary",
            bgClass: "bg-secondary/10",
            trend: s.repairIncomeChange >= 0 ? `+${s.repairIncomeChange}%` : `${s.repairIncomeChange}%`,
            usdValue: getUSD(s.todayRepairIncome)
        },
        {
            id: "stat_pending",
            label: "Bekleyen Servisler",
            value: s.pendingServices || "0",
            iconId: "Clock",
            colorClass: "text-blue-500",
            bgClass: "bg-blue-500/10",
            badge: "Acil"
        },
        {
            id: "stat_collections",
            label: "Tahsilatlar",
            value: s.collectedPayments,
            iconId: "Banknote",
            colorClass: "text-amber-500",
            bgClass: "bg-amber-500/10",
            usdValue: getUSD(s.collectedPayments)
        },
        {
            id: "stat_ready",
            label: "Hazır Cihazlar",
            value: s.readyDevices || "0",
            iconId: "CheckCircle2",
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10"
        },
        {
            id: "stat_stock",
            label: "Kritik stok",
            value: s.criticalStock || "0",
            outOfStockCount: s.outOfStockCount || "0",
            iconId: "AlertTriangle",
            colorClass: "text-rose-500",
            bgClass: "bg-rose-500/10",
            badge: "Kritik"
        },
        {
            id: "stat_debts",
            label: "Toplam borçlar",
            value: s.totalDebts,
            iconId: "ArrowDownCircle",
            colorClass: "text-indigo-500",
            bgClass: "bg-indigo-500/10",
            usdValue: getUSD(s.totalDebts)
        },
    ];

    const widgets = {
        // Stats
        stat_sales: <StatWidgetWrapper type="DAILY_SALES" stat={statItems[0]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_accounts: <StatWidgetWrapper type="CASH_BALANCE" stat={statItems[1]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_income: <StatWidgetWrapper type="REPAIR_INCOME" stat={statItems[2]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_pending: <StatWidgetWrapper type="PENDING_SERVICES" stat={statItems[3]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_collections: <StatWidgetWrapper type="COLLECTIONS" stat={statItems[4]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_ready: <StatWidgetWrapper type="READY_DEVICES" stat={statItems[5]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_stock: <StatWidgetWrapper type="CRITICAL_STOCK" stat={statItems[6]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,
        stat_debts: <StatWidgetWrapper type="TOTAL_DEBTS" stat={statItems[7]} shopId={shopId || ""} defaultCurrency={defaultCurrency} />,

        // Modules
        revenue: <RevenueAnalysisStream />,
        activity: <LiveActivityStream />,
        service_status: <ServiceStatusStream />,
        ai_insights: <SmartInsightsStream shopId={shopId || ""} />,
        transactions: <RecentTransactionsStream shopId={shopId || ""} />,
        service_queue: <ServiceQueueStream title="Servis Kuyruğu" />,
        inventory: <TopProductsStream shopId={shopId || ""} />,
        shortage_status: <ShortageStatusCard />,
    };

    const initialLayout = user?.dashboardLayout || [];

    return (
        <div className="space-y-8 pb-10">
            <DashboardOnboardingClient categories={categories} shop={shop} />

            {/* Original Editorial Header Style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl shadow-primary/5">
                        <LayoutDashboard className="h-7 w-7 text-primary animate-in zoom-in duration-500" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                                {viewMode === "system" ? (shop?.name ? `${shop.name.toUpperCase()} PANELİ` : "SİSTEM PANALİ") : "PERSONEL DURUMU"}
                            </h1>
                            <div className="flex items-center bg-card/40 backdrop-blur-md border border-border/40 p-0 rounded-full shadow-sm overflow-hidden scale-90 origin-left">
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border-r border-border/40">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[8px] text-emerald-600 tracking-tight font-bold uppercase">AKTİF</span>
                                </div>
                                <div className="px-3 py-1">
                                    <span className="text-[8px] text-muted-foreground tracking-tight uppercase font-bold">GERÇEK ZAMANLI</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                            <span>OPERASYON VE FİNANCE TAKİP MERKEZİ</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(), "d MMMM yyyy", { locale: tr })}</span>
                            <LiveClock />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                    <DashboardEditButton />
                    <QuickShortcuts shop={shop} categories={categories} suppliers={suppliers} />

                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-inner">
                        <Button
                            variant={viewMode === "system" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("system")}
                            className={cn(
                                "rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-300",
                                viewMode === "system" ? "shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                            SİSTEM
                        </Button>
                        <Button
                            variant={viewMode === "staff" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("staff")}
                            className={cn(
                                "rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-300",
                                viewMode === "staff" ? "shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Users className="w-3.5 h-3.5 mr-2" />
                            PERSONEL
                        </Button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === "system" ? (
                    <motion.div
                        key="system"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        <DashboardClient
                            initialLayout={initialLayout}
                            widgets={widgets}
                            shopId={shopId || ""}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="staff"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <StaffDashboardClient data={staffData} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
