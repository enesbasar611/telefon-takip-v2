"use client";

import { useState, useTransition } from "react";
import {
    Cpu,
    Sparkles,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Package,
    Clock,
    RefreshCw,
    Trash2,
    Calendar,
    Copy,
    Check,
    History,
    ShieldAlert,
    BarChart3,
    DollarSign,
    Zap,
    ChevronRight,
    ArrowUpRight,
    Wallet,
    Layers,
    X,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    ForecastMetrics,
    ReportType,
    generateExecutiveAIReport,
    deleteAIReport,
    getMonthEndForecastMetrics
} from "@/lib/actions/ai-forecast-actions";
import { deleteAIAlert, triggerAIAnalysis } from "@/lib/actions/stock-ai-actions";
import { addShortageItem } from "@/lib/actions/shortage-actions";
import { EditProductModal } from "@/components/product/edit-product-modal";

interface StockAIClientProps {
    initialMetrics: ForecastMetrics | null;
    initialLatestReport: any;
    initialHistory: any[];
    initialAlerts: any[];
}

const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; icon: any; color: string; bg: string; border: string }> = {
    MONTH_END_PROJECTION: {
        label: "AY SONU CİRO PROJEKSİYONU",
        icon: TrendingUp,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
    },
    FINANCIAL_SNAPSHOT: {
        label: "GELİR-GİDER & FİNANSAL GÖRÜNÜM",
        icon: BarChart3,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
    },
    STOCK_FORECAST: {
        label: "KRİTİK STOK & İKMAL ANALİZİ",
        icon: Package,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
    },
    RECEIVABLES_ALERT: {
        label: "VERESİYE & TAHSİLAT RİSKİ",
        icon: ShieldAlert,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
    },
};

export function StockAIClient({
    initialMetrics,
    initialLatestReport,
    initialHistory,
    initialAlerts
}: StockAIClientProps) {
    const [metrics, setMetrics] = useState<ForecastMetrics | null>(initialMetrics);
    const [activeReport, setActiveReport] = useState<any>(initialLatestReport);
    const [history, setHistory] = useState<any[]>(initialHistory);
    const [alerts, setAlerts] = useState<any[]>(initialAlerts);

    const [activeCommand, setActiveCommand] = useState<ReportType | null>(null);
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"FORECAST" | "ALERTS">("FORECAST");

    // Product modal state for alerts
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isScanningAlerts, setIsScanningAlerts] = useState(false);

    // Run executive report generation
    const handleRunExecutiveReport = async (type: ReportType) => {
        setActiveCommand(type);
        try {
            const res = await generateExecutiveAIReport(type);
            if (res.success && res.report) {
                setActiveReport(res.report);
                setHistory(prev => [res.report, ...prev.filter(r => r.id !== res.report.id)]);
                if (res.report.metrics) {
                    setMetrics(res.report.metrics);
                }
                toast.success("B.A.Ş.A.R. Raporu başarıyla oluşturuldu ve kasaya kaydedildi.");
            } else {
                toast.error(res.error || "Rapor oluşturulamadı.");
            }
        } catch (error) {
            console.error("Executive report error:", error);
            toast.error("Rapor oluşturulurken bağlantı hatası.");
        } finally {
            setActiveCommand(null);
        }
    };

    // Refresh zero-token telemetry
    const handleRefreshTelemetry = async () => {
        setIsRefreshingTelemetry(true);
        try {
            const fresh = await getMonthEndForecastMetrics();
            setMetrics(fresh);
            toast.success("Telemetri verileri güncellendi (Sıfır Token).");
        } catch (error) {
            toast.error("Veriler yenilenirken hata oluştu.");
        } finally {
            setIsRefreshingTelemetry(false);
        }
    };

    // Select a report from vault
    const handleSelectReport = (report: any) => {
        setActiveReport(report);
        if (report.metrics) {
            setMetrics(report.metrics);
        }
        setIsVaultOpen(false);
        toast.info("Kayıtlı rapor yüklendi (Sıfır Token).");
    };

    // Delete a report from vault
    const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await deleteAIReport(id);
        if (res.success) {
            setHistory(prev => prev.filter(r => r.id !== id));
            if (activeReport?.id === id) {
                const next = history.find(r => r.id !== id) || null;
                setActiveReport(next);
            }
            toast.success("Rapor kasadan silindi.");
        } else {
            toast.error("Rapor silinemedi.");
        }
    };

    // Copy report markdown
    const handleCopyReport = () => {
        if (!activeReport?.content) return;
        navigator.clipboard.writeText(activeReport.content);
        setCopied(true);
        toast.success("Rapor panoya kopyalandı!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Scan heuristic stock alerts
    const handleScanAlerts = async () => {
        setIsScanningAlerts(true);
        try {
            const res = await triggerAIAnalysis();
            if (res.success) {
                toast.success(`Analiz tamamlandı! ${res.count} yeni ikmal önerisi bulundu.`);
                const { getAIAlerts } = await import("@/lib/actions/stock-ai-actions");
                const freshAlerts = await getAIAlerts();
                setAlerts(freshAlerts);
            } else {
                toast.error("Tarama sırasında hata oluştu.");
            }
        } catch {
            toast.error("İşlem başarısız.");
        } finally {
            setIsScanningAlerts(false);
        }
    };

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-500 max-w-full overflow-x-hidden">
            {/* ── 1. B.A.Ş.A.R. KOMUTA PANELİ BAŞLIĞI ────────────────────── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/20 p-6 md:p-10 shadow-2xl shadow-cyan-950/30">
                {/* Holographic grid and glow background */}
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-24 translate-x-24" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Title & Telemetry Status */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                                <Cpu className="h-6 w-6 text-cyan-400 animate-pulse" />
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>

                            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 px-3 py-1 text-[10px] uppercase font-mono tracking-widest gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                B.A.Ş.A.R. SİSTEM TELEMETRİSİ // ÇEVRİMİÇİ
                            </Badge>

                            <Badge className="bg-slate-800/80 text-muted-foreground border-slate-700 px-3 py-1 text-[10px] uppercase font-mono tracking-wider">
                                GEMINI 2.5 FLASH YAPAY ZEKA MOTORU
                            </Badge>

                            {metrics?.todayStr && (
                                <span className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-widest">
                                    {metrics.todayStr}
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight uppercase flex items-center gap-2">
                                B.A.Ş.A.R. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Komuta ve Tahmin Kokpiti</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                                Ay sonu net ciro projeksiyonu, kâr/zarar analizi ve yapay zeka destekli operasyonel karar masası.
                            </p>
                        </div>
                    </div>

                    {/* Quick Utility Controls */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        <Button
                            variant="outline"
                            onClick={handleRefreshTelemetry}
                            disabled={isRefreshingTelemetry}
                            className="h-11 px-4 rounded-xl border-cyan-500/20 bg-slate-900/60 hover:bg-cyan-500/10 text-cyan-300 text-xs font-mono tracking-wider gap-2 shadow-sm"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshingTelemetry && "animate-spin text-cyan-400")} />
                            <span>SIFIR TOKEN İLE YENİLE</span>
                        </Button>

                        <Button
                            onClick={() => setIsVaultOpen(true)}
                            className="h-11 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
                        >
                            <History className="h-4 w-4" />
                            <span>Rapor Kasası ({history.length})</span>
                        </Button>
                    </div>
                </div>

                {/* ── COMMAND ACTION BUTTONS (4 CORE TILES) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-cyan-500/15">
                    {/* 1. Run Month-End Forecast */}
                    <Button
                        onClick={() => handleRunExecutiveReport("MONTH_END_PROJECTION")}
                        disabled={!!activeCommand}
                        className={cn(
                            "h-14 rounded-2xl flex items-center justify-between px-4 transition-all duration-300 border",
                            "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-400 shadow-lg shadow-cyan-500/5",
                            activeCommand === "MONTH_END_PROJECTION" && "ring-2 ring-cyan-400 animate-pulse"
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                                {activeCommand === "MONTH_END_PROJECTION" ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
                                ) : (
                                    <TrendingUp className="h-4 w-4 text-cyan-300" />
                                )}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wider truncate">Ay Sonu Tahmini</p>
                                <p className="text-[9px] text-cyan-400/70 font-mono">Net Ciro Projeksiyonu</p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-cyan-400/60 shrink-0 ml-2" />
                    </Button>

                    {/* 2. Financial & P&L Snapshot */}
                    <Button
                        onClick={() => handleRunExecutiveReport("FINANCIAL_SNAPSHOT")}
                        disabled={!!activeCommand}
                        className={cn(
                            "h-14 rounded-2xl flex items-center justify-between px-4 transition-all duration-300 border",
                            "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 shadow-lg shadow-emerald-500/5",
                            activeCommand === "FINANCIAL_SNAPSHOT" && "ring-2 ring-emerald-400 animate-pulse"
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                                {activeCommand === "FINANCIAL_SNAPSHOT" ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-300" />
                                ) : (
                                    <BarChart3 className="h-4 w-4 text-emerald-300" />
                                )}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wider truncate">Gelir-Gider & Kâr</p>
                                <p className="text-[9px] text-emerald-400/70 font-mono">Satış / Servis / Gider</p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-emerald-400/60 shrink-0 ml-2" />
                    </Button>

                    {/* 3. Critical Stock & Cost Report */}
                    <Button
                        onClick={() => handleRunExecutiveReport("STOCK_FORECAST")}
                        disabled={!!activeCommand}
                        className={cn(
                            "h-14 rounded-2xl flex items-center justify-between px-4 transition-all duration-300 border",
                            "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-500/5",
                            activeCommand === "STOCK_FORECAST" && "ring-2 ring-amber-400 animate-pulse"
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                {activeCommand === "STOCK_FORECAST" ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                                ) : (
                                    <Package className="h-4 w-4 text-amber-300" />
                                )}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wider truncate">Stok & İkmal</p>
                                <p className="text-[9px] text-amber-400/70 font-mono">Tükenme Riski & Maliyet</p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-amber-400/60 shrink-0 ml-2" />
                    </Button>

                    {/* 4. Overdue Receivables Alert */}
                    <Button
                        onClick={() => handleRunExecutiveReport("RECEIVABLES_ALERT")}
                        disabled={!!activeCommand}
                        className={cn(
                            "h-14 rounded-2xl flex items-center justify-between px-4 transition-all duration-300 border",
                            "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 hover:border-rose-400 shadow-lg shadow-rose-500/5",
                            activeCommand === "RECEIVABLES_ALERT" && "ring-2 ring-rose-400 animate-pulse"
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                                {activeCommand === "RECEIVABLES_ALERT" ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-rose-300" />
                                ) : (
                                    <ShieldAlert className="h-4 w-4 text-rose-300" />
                                )}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wider truncate">Veresiye Alarmı</p>
                                <p className="text-[9px] text-rose-400/70 font-mono">Tahsilat Riski & Nakit Akışı</p>
                            </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-rose-400/60 shrink-0 ml-2" />
                    </Button>
                </div>
            </div>

            {/* ── 2. ZERO-TOKEN EXECUTIVE TELEMETRY STRIP (4 HUD CARDS) ────────────── */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Ay Sonu Net Ciro Tahmini */}
                    <Card className="rounded-3xl bg-card/80 border-cyan-500/20 hover:border-cyan-500/40 transition-all p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-mono tracking-widest mb-2">
                            <span>AY SONU TAHMİNİ</span>
                            <span className="text-cyan-400">GÜNCEL HIZ</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                            ₺{metrics.projectedMonthEndRevenue.toLocaleString("tr-TR")}
                        </div>
                        <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                <span>Ay İlerlemesi (%{metrics.monthProgressPercent})</span>
                                <span>Gün {metrics.dayOfMonth} / {metrics.daysInMonth}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                                    style={{ width: `${metrics.monthProgressPercent}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-muted-foreground font-mono">
                                Günlük Ortalama: <strong className="text-foreground">₺{metrics.dailyAverageRevenue.toLocaleString("tr-TR")}</strong>
                            </p>
                        </div>
                    </Card>

                    {/* Card 2: MoM Büyüme (Zamana Göre Eşdeğer Karşılaştırma) */}
                    <Card className="rounded-3xl bg-card/80 border-emerald-500/20 hover:border-emerald-500/40 transition-all p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-mono tracking-widest mb-2">
                            <span>DÖNEMSEL BÜYÜME (GEÇEN AYA GÖRE)</span>
                            <Badge className={cn(
                                "text-[9px] font-mono font-bold px-2 py-0.5 border",
                                metrics.growthRateTTD >= 0
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            )}>
                                {metrics.growthRateTTD >= 0 ? "+" : ""}%{metrics.growthRateTTD}
                            </Badge>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            ₺{metrics.currentNetRevenue.toLocaleString("tr-TR")}
                        </div>
                        <div className="mt-3 space-y-1 text-[10px] font-mono text-muted-foreground">
                            <p className="flex justify-between">
                                <span>Geçen Ay Aynı Dönem:</span>
                                <span className="text-foreground font-bold">₺{metrics.prevMonthTTDNet.toLocaleString("tr-TR")}</span>
                            </p>
                            <p className="text-[9px] text-muted-foreground/80">
                                1-{metrics.dayOfMonth} günleri arası net ciro kıyaslaması.
                            </p>
                        </div>
                    </Card>

                    {/* Card 3: Gelir Dağılımı (Satış vs Servis vs Gider) */}
                    <Card className="rounded-3xl bg-card/80 border-border/60 hover:border-primary/30 transition-all p-5 shadow-lg relative overflow-hidden group">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-mono tracking-widest mb-2">
                            <span>GELİR DENGESİ</span>
                            <span className="text-muted-foreground font-mono">BU AY</span>
                        </div>
                        <div className="space-y-2 mt-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Satış Geliri:
                                </span>
                                <span className="font-bold font-mono">₺{metrics.currentSales.toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500" /> Teknik Servis:
                                </span>
                                <span className="font-bold font-mono">₺{metrics.currentService.toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                                <span className="flex items-center gap-1.5 text-rose-400">
                                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Toplam Gider:
                                </span>
                                <span className="font-bold font-mono text-rose-400">-₺{metrics.currentExpenses.toLocaleString("tr-TR")}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Card 4: Risk Radarı (Kritik Stok & Veresiyeler) */}
                    <Card className="rounded-3xl bg-card/80 border-amber-500/20 hover:border-amber-500/40 transition-all p-5 shadow-lg relative overflow-hidden group">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-mono tracking-widest mb-2">
                            <span>RİSK VE NAKİT RADARI</span>
                            <span className="text-amber-400 font-mono">GÜNCEL</span>
                        </div>
                        <div className="space-y-2 mt-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Kritik Stok Riski:</span>
                                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-400">
                                    {metrics.criticalStockCount} ÜRÜN
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Açık Veresiye:</span>
                                <span className="font-bold font-mono text-amber-300">
                                    ₺{metrics.totalOpenDebts.toLocaleString("tr-TR")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-border/40 text-muted-foreground">
                                <span>Bugünün Hasılatı:</span>
                                <span className="text-emerald-400 font-bold">₺{metrics.todayRevenue.toLocaleString("tr-TR")}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── 3. VIEW MODE TABS (EXECUTIVE COCKPIT vs HEURISTIC ALERTS) ────────── */}
            <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeTab === "FORECAST" ? "default" : "ghost"}
                        onClick={() => setActiveTab("FORECAST")}
                        className={cn(
                            "rounded-xl h-10 px-5 text-xs font-bold uppercase tracking-wider gap-2",
                            activeTab === "FORECAST" ? "bg-cyan-600 hover:bg-cyan-500 text-slate-950" : "text-muted-foreground"
                        )}
                    >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Komuta Raporu & Strateji</span>
                    </Button>

                    <Button
                        variant={activeTab === "ALERTS" ? "default" : "ghost"}
                        onClick={() => setActiveTab("ALERTS")}
                        className={cn(
                            "rounded-xl h-10 px-5 text-xs font-bold uppercase tracking-wider gap-2",
                            activeTab === "ALERTS" ? "bg-cyan-600 hover:bg-cyan-500 text-slate-950" : "text-muted-foreground"
                        )}
                    >
                        <Package className="h-3.5 w-3.5" />
                        <span>Operasyonel Stok Uyarıları ({alerts.length})</span>
                    </Button>
                </div>

                {activeTab === "ALERTS" && (
                    <Button
                        size="sm"
                        onClick={handleScanAlerts}
                        disabled={isScanningAlerts}
                        className="rounded-xl h-9 text-[11px] font-mono bg-blue-600 hover:bg-blue-500 text-white gap-2"
                    >
                        {isScanningAlerts ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        SİSTEMİ TARA
                    </Button>
                )}
            </div>

            {/* ── 4. MAIN CONTENT AREA ────────────────────────────────────────────── */}
            {activeTab === "FORECAST" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left / Center: Active Report Stage (8/12) */}
                    <div className="lg:col-span-8 space-y-6">
                        {activeReport ? (
                            <Card className="rounded-[2.5rem] bg-card border-cyan-500/20 overflow-hidden shadow-2xl relative">
                                {/* Header of active report */}
                                <div className="p-6 md:p-8 border-b border-border/50 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {REPORT_TYPE_CONFIG[activeReport.reportType as ReportType] && (
                                                <Badge className={cn("text-[10px] font-mono px-3 py-1 border", REPORT_TYPE_CONFIG[activeReport.reportType as ReportType].bg, REPORT_TYPE_CONFIG[activeReport.reportType as ReportType].color, REPORT_TYPE_CONFIG[activeReport.reportType as ReportType].border)}>
                                                    {REPORT_TYPE_CONFIG[activeReport.reportType as ReportType].label}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-muted-foreground">
                                                ⚡ SIFIR TOKEN (VERİ TABANI KAYDI)
                                            </Badge>
                                            <span className="text-[11px] font-mono text-muted-foreground">
                                                {format(new Date(activeReport.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                                            </span>
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                                            {activeReport.title}
                                        </h2>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyReport}
                                            className="h-9 px-3 rounded-xl border-border/50 hover:bg-muted text-xs font-mono gap-1.5"
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                            <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRunExecutiveReport(activeReport.reportType as ReportType)}
                                            disabled={!!activeCommand}
                                            className="h-9 px-3 rounded-xl border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400 text-xs font-mono gap-1.5"
                                        >
                                            <RefreshCw className={cn("h-3.5 w-3.5", activeCommand && "animate-spin")} />
                                            <span>Yenile</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Report Markdown Content */}
                                <CardContent className="p-6 md:p-10 space-y-6 text-foreground/90">
                                    <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                                        {activeReport.content}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Empty State when no report exists */
                            <Card className="rounded-[2.5rem] border-dashed border-cyan-500/30 py-20 bg-card/40 flex flex-col items-center justify-center text-center p-8">
                                <div className="h-16 w-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                                    <Cpu className="h-8 w-8 text-cyan-400" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">
                                    Henüz Kayıtlı Bir Yönetici Raporu Bulunmuyor
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
                                    Yukarıdaki butonlardan birine basarak ilk Ay Sonu Net Ciro veya Finansal Görünüm raporunuzu oluşturabilirsiniz.
                                </p>
                                <Button
                                    onClick={() => handleRunExecutiveReport("MONTH_END_PROJECTION")}
                                    disabled={!!activeCommand}
                                    className="h-12 px-8 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider gap-2 shadow-lg shadow-cyan-600/20"
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Ay Sonu Projeksiyonunu Başlat</span>
                                </Button>
                            </Card>
                        )}
                    </div>

                    {/* Right: Quick Insights & History Vault Column (4/12) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* History Vault Card */}
                        <Card className="rounded-[2.5rem] bg-card border-border/60 overflow-hidden shadow-lg">
                            <CardHeader className="p-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <History className="h-4 w-4 text-cyan-400" /> RAPOR KASASI
                                    </CardTitle>
                                    <CardDescription className="text-[10px] mt-0.5">
                                        Sıfır token ile geçmiş stratejileri inceleyin
                                    </CardDescription>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    {history.length} KAYIT
                                </span>
                            </CardHeader>

                            <CardContent className="p-3 divide-y divide-border/20 max-h-[500px] overflow-y-auto">
                                {history.length === 0 ? (
                                    <p className="text-center py-8 text-xs text-muted-foreground/60">
                                        Kasada henüz geçmiş rapor yok.
                                    </p>
                                ) : (
                                    history.map((rep) => {
                                        const cfg = REPORT_TYPE_CONFIG[rep.reportType as ReportType] || REPORT_TYPE_CONFIG.MONTH_END_PROJECTION;
                                        const Icon = cfg.icon;
                                        const isSelected = activeReport?.id === rep.id;

                                        return (
                                            <div
                                                key={rep.id}
                                                onClick={() => handleSelectReport(rep)}
                                                className={cn(
                                                    "p-3.5 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group",
                                                    isSelected ? "bg-cyan-500/10 border border-cyan-500/30" : "hover:bg-muted/40"
                                                )}
                                            >
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5", cfg.bg, cfg.color, cfg.border)}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground tracking-tight truncate group-hover:text-cyan-400 transition-colors">
                                                            {rep.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                            {format(new Date(rep.createdAt), "dd MMM, HH:mm", { locale: tr })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={(e) => handleDeleteReport(rep.id, e)}
                                                    className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Selling Products HUD Card */}
                        {metrics?.topProducts && metrics.topProducts.length > 0 && (
                            <Card className="rounded-[2.5rem] bg-card border-border/60 overflow-hidden shadow-lg p-6 space-y-4">
                                <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-emerald-400" /> BU AY EN ÇOK SATANLAR
                                </h4>
                                <div className="space-y-3">
                                    {metrics.topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="min-w-0 pr-2">
                                                <p className="font-medium text-foreground truncate">{p.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">{p.quantity} Adet Satıldı</p>
                                            </div>
                                            <span className="font-bold font-mono text-emerald-400 shrink-0">
                                                ₺{p.revenue.toLocaleString("tr-TR")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            ) : (
                /* ── 5. OPERATIONAL STOCK HEURISTICS TAB ────────────────────────────── */
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                            Algoritmik Stok Alarmları ({alerts.length} Kayıt)
                        </h2>
                    </div>

                    {alerts.length === 0 ? (
                        <Card className="rounded-[2.5rem] border-dashed py-16 bg-card/40 text-center p-8">
                            <CardContent className="flex flex-col items-center justify-center gap-2">
                                <Package className="h-10 w-10 text-muted-foreground/30" />
                                <h3 className="font-bold text-muted-foreground uppercase tracking-widest text-sm">Tertemiz</h3>
                                <p className="text-xs text-muted-foreground/60">Şu an için kritik stok veya durgun envanter uyarısı bulunmuyor.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alerts.map((alert: any) => {
                                const isCritical = alert.type === "CRITICAL" || alert.type === "LOW_STOCK";
                                return (
                                    <Card key={alert.id} className={cn(
                                        "rounded-3xl bg-card border transition-all p-5 shadow-md flex flex-col justify-between gap-4",
                                        isCritical ? "border-rose-500/20 hover:border-rose-500/40" : "border-border/60 hover:border-primary/30"
                                    )}>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] font-mono",
                                                    isCritical ? "border-rose-500/30 text-rose-400 bg-rose-500/10" : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                                )}>
                                                    {alert.type}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {format(new Date(alert.createdAt), "dd MMM, HH:mm", { locale: tr })}
                                                </span>
                                            </div>

                                            <h4 className="text-sm font-bold text-foreground leading-snug">
                                                {alert.message}
                                            </h4>

                                            {alert.product && (
                                                <p className="text-[11px] font-mono text-muted-foreground">
                                                    Referans: <strong className="text-foreground">{alert.product.name}</strong> ({alert.product.stock} adet)
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    await deleteAIAlert(alert.id);
                                                    setAlerts(prev => prev.filter(a => a.id !== alert.id));
                                                    toast.success("Uyarı gizlendi.");
                                                }}
                                                className="h-9 px-3 rounded-xl text-xs text-muted-foreground hover:text-rose-400"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>

                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    if (!alert.product) return;
                                                    if (isCritical) {
                                                        await addShortageItem({ productId: alert.product.id, name: alert.product.name, quantity: 1 });
                                                        toast.success(`${alert.product.name} eksik listesine eklendi.`);
                                                        await deleteAIAlert(alert.id);
                                                        setAlerts(prev => prev.filter(a => a.id !== alert.id));
                                                    } else if (alert.type === "STAGNANT") {
                                                        setSelectedProduct(alert.product);
                                                        setIsEditModalOpen(true);
                                                    } else {
                                                        window.location.href = `/stok?search=${encodeURIComponent(alert.product?.name)}`;
                                                    }
                                                }}
                                                className="flex-1 h-9 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider gap-1.5"
                                            >
                                                <span>{isCritical ? "+ Eksik Listesine Ekle" : "İncele"}</span>
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── 6. SLIDE-OVER REPORT HISTORY VAULT DRAWER ──────────────────────── */}
            <AnimatePresence>
                {isVaultOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-md h-full bg-slate-950 border-l border-cyan-500/20 p-6 flex flex-col justify-between shadow-2xl relative"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-cyan-400" />
                                    <h3 className="font-black text-sm uppercase tracking-wider text-foreground">
                                        Strateji ve Rapor Kasası
                                    </h3>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setIsVaultOpen(false)}
                                    className="h-8 w-8 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-border/20 py-4 space-y-2">
                                {history.length === 0 ? (
                                    <p className="text-center text-xs text-muted-foreground/60 py-12">
                                        Henüz kaydedilmiş rapor yok.
                                    </p>
                                ) : (
                                    history.map((rep) => {
                                        const cfg = REPORT_TYPE_CONFIG[rep.reportType as ReportType] || REPORT_TYPE_CONFIG.MONTH_END_PROJECTION;
                                        const Icon = cfg.icon;
                                        return (
                                            <div
                                                key={rep.id}
                                                onClick={() => handleSelectReport(rep)}
                                                className="p-4 rounded-2xl bg-card/60 hover:bg-cyan-500/10 border border-border/40 hover:border-cyan-500/30 cursor-pointer transition-all space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <Badge className={cn("text-[9px] font-mono", cfg.bg, cfg.color, cfg.border)}>
                                                        {cfg.label}
                                                    </Badge>
                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                        {format(new Date(rep.createdAt), "dd MMM, HH:mm", { locale: tr })}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-foreground leading-snug">
                                                    {rep.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {rep.content.slice(0, 120)}...
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="pt-4 border-t border-border/40 text-[10px] font-mono text-muted-foreground text-center">
                                Tüm raporlar yerel veritabanında saklanır (Sıfır token tüketimi).
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Edit Modal */}
            <EditProductModal
                product={selectedProduct}
                categories={[]}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </div>
    );
}
