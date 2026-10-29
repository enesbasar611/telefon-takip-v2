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
import { ReceivablesStream } from "@/components/dashboard/streamed/receivables-stream";
import { BorderBeam } from "border-beam";
import { ThinkingOrb } from "thinking-orbs";

interface AdminDashboardProps {
    stats: any;
    rates?: any;
    user: any;
    shop: any;
    categories: any;
    suppliers: any;
    staffData: any;
    staffOverview?: any;
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
    staffOverview,
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
            label: "Veresiyeler",
            value: s.totalDebts,
            iconId: "ArrowDownCircle",
            colorClass: "text-indigo-500",
            bgClass: "bg-indigo-500/10",
            usdValue: getUSD(s.totalDebts)
        },
    ];

    const widgets = {
        // Stats
        stat_sales: <StatWidgetWrapper type="DAILY_SALES" stat={statItems[0]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_accounts: <StatWidgetWrapper type="CASH_BALANCE" stat={statItems[1]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_income: <StatWidgetWrapper type="REPAIR_INCOME" stat={statItems[2]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_pending: <StatWidgetWrapper type="PENDING_SERVICES" stat={statItems[3]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_collections: <StatWidgetWrapper type="COLLECTIONS" stat={statItems[4]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_ready: <StatWidgetWrapper type="READY_DEVICES" stat={statItems[5]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_stock: <StatWidgetWrapper type="CRITICAL_STOCK" stat={statItems[6]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,
        stat_debts: <StatWidgetWrapper type="TOTAL_DEBTS" stat={statItems[7]} shopId={shopId || ""} defaultCurrency={defaultCurrency} shop={shop} categories={categories} suppliers={suppliers} rates={rates} />,

        // Modules
        revenue: <RevenueAnalysisStream />,
        activity: <LiveActivityStream />,
        service_status: <ServiceStatusStream />,
        ai_insights: <SmartInsightsStream shopId={shopId || ""} />,
        transactions: <RecentTransactionsStream shopId={shopId || ""} />,
        service_queue: <ServiceQueueStream title="Servis Kuyruğu" />,
        inventory: <TopProductsStream shopId={shopId || ""} />,
        shortage_status: <ShortageStatusCard />,
        receivables: <ReceivablesStream shopId={shopId || ""} />,
    };

    const initialLayout = user?.dashboardLayout || [];

    return (
        <div className="space-y-5 pb-6">
            <DashboardOnboardingClient categories={categories} shop={shop} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-5">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border/40 shadow-xs text-primary shrink-0">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground uppercase truncate">
                                {viewMode === "system" ? (shop?.name ? `${shop.name.toUpperCase()} PANELİ` : "SİSTEM PANELİ") : "PERSONEL DURUMU"}
                            </h1>
                            <BorderBeam size="sm" colorVariant="colorful" strength={0.8} className="rounded-full">
                                <div className="flex items-center bg-card/90 dark:bg-[#0c121d]/90 backdrop-blur-md rounded-full shadow-xs overflow-hidden border border-border/40">
                                    <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-0.5 bg-emerald-500/10 border-r border-border/40">
                                        <ThinkingOrb state="solving" size={20} color="#10b981" />
                                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">AKTİF</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">CANLI</span>
                                </div>
                            </BorderBeam>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex-wrap">
                            <span className="hidden sm:inline">Operasyon & Finans Merkezi</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(), "d MMMM yyyy", { locale: tr })}</span>
                            <LiveClock />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
                    <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                        <DashboardEditButton />
                        <QuickShortcuts shop={shop} categories={categories} suppliers={suppliers} />

                        <div className="flex p-0.5 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/40 shadow-xs shrink-0">
                            <Button
                                variant={viewMode === "system" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("system")}
                                className={cn(
                                    "rounded-lg px-3 py-1 text-xs font-semibold transition-all shrink-0 h-7",
                                    viewMode === "system" ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                SİSTEM
                            </Button>
                            <Button
                                variant={viewMode === "staff" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("staff")}
                                className={cn(
                                    "rounded-lg px-3 py-1 text-xs font-semibold transition-all shrink-0 h-7",
                                    viewMode === "staff" ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Users className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                PERSONEL
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === "system" ? (
                    <motion.div
                        key="system"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.01 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-5"
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
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <StaffDashboardClient data={staffData} teamData={staffOverview} defaultCurrency={defaultCurrency} usdRate={usdRate} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
