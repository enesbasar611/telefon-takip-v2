"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Banknote, Boxes, Package, ReceiptText, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import type { SalesHistoryReport } from "@/lib/actions/activity-actions";

const paymentColors = ["#2563eb", "#10b981", "#f59e0b", "#f43f5e"];

function changeLabel(value: number) {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}%${Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function metricTone(value: number) {
    return value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
}

function insightTone(insight: string) {
    const lower = insight.toLocaleLowerCase("tr-TR");
    if (lower.includes("arttı") || lower.includes("artış")) {
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    }
    if (lower.includes("düştü") || lower.includes("zarar") || lower.includes("azaldı")) {
        return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    }
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function useMoneyFormatter() {
    const { defaultCurrency, rates } = useDashboardData();
    const usdRate = Number(rates?.usd) > 0 ? Number(rates.usd) : 35;
    const eurRate = Number(rates?.eur) > 0 ? Number(rates.eur) : 38;

    return (value: number) => {
        const amount = defaultCurrency === "USD" ? value / usdRate : defaultCurrency === "EUR" ? value / eurRate : value;
        const symbol = defaultCurrency === "USD" ? "$" : defaultCurrency === "EUR" ? "€" : "₺";
        return `${symbol}${amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
    };
}

export function SalesHistoryReportPanel({ report, isLoading = false }: { report: SalesHistoryReport; isLoading?: boolean }) {
    const formatMoney = useMoneyFormatter();
    const current = report.periods.current;
    const previous = report.periods.previous;
    const twoAgo = report.periods.twoAgo;

    const periodComparison = [
        { name: current.label, ciro: current.revenue, kar: current.profit },
        { name: previous.label, ciro: previous.revenue, kar: previous.profit },
        { name: twoAgo.label, ciro: twoAgo.revenue, kar: twoAgo.profit },
    ].reverse();

    const kpis = [
        {
            label: "Seçili Aralık Cirosu",
            value: formatMoney(current.revenue),
            change: report.comparisons.revenueVsPrevious,
            detail: `${current.saleCount} satış, ${current.itemCount} ürün`,
            icon: TrendingUp,
        },
        {
            label: "Tahmini Kâr",
            value: formatMoney(current.profit),
            change: report.comparisons.profitVsPrevious,
            detail: `Ortalama fiş ${formatMoney(current.averageSale)}`,
            icon: Banknote,
        },
        {
            label: "Satılan Ürün",
            value: current.itemCount.toLocaleString("tr-TR"),
            change: report.comparisons.saleCountVsPrevious,
            detail: `${current.debtSales} veresiye satış`,
            icon: Boxes,
        },
        {
            label: "Önceki Aralığa Göre",
            value: changeLabel(report.comparisons.revenueVsPrevious),
            change: report.comparisons.revenueVsTwoAgo,
            detail: `Bir önceki benzer aralığa göre ${changeLabel(report.comparisons.revenueVsTwoAgo)}`,
            icon: ReceiptText,
        },
    ];

    return (
        <div className={cn("space-y-5 transition-opacity", isLoading && "opacity-70")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    const PositiveIcon = kpi.change >= 0 ? ArrowUpRight : ArrowDownRight;
                    return (
                        <Card key={kpi.label} className="rounded-2xl border-border/50 bg-card/70 shadow-sm">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground">{kpi.label}</p>
                                        <p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Icon className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <span className="text-xs text-muted-foreground">{kpi.detail}</span>
                                    <Badge variant="outline" className={cn("rounded-lg gap-1", metricTone(kpi.change))}>
                                        <PositiveIcon className="h-3 w-3" />
                                        {changeLabel(kpi.change)}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-5">
                <Card className="rounded-2xl border-border/50 bg-card/70 shadow-sm overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="font-semibold text-base">Seçili Aralık Günlük Akış</h3>
                                <p className="text-xs text-muted-foreground">Ciro ve tahmini kârın günlere dağılımı.</p>
                            </div>
                            <Badge variant="outline" className="rounded-lg">{current.label}</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={report.dailyTrend}>
                                <defs>
                                    <linearGradient id="salesRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.26} />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="salesProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border/40" stroke="currentColor" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => formatMoney(Number(v)).replace(/,00$/, "")} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} axisLine={false} tickLine={false} width={70} />
                                <Tooltip
                                    content={({ active, payload, label }) => active && payload?.length ? (
                                        <div className="rounded-xl border border-border bg-popover p-3 shadow-xl">
                                            <p className="text-xs font-semibold mb-2">{label}</p>
                                            {payload.map((item: any) => (
                                                <p key={item.dataKey} className="text-xs text-muted-foreground">
                                                    {item.name}: <span className="font-semibold text-foreground">{formatMoney(Number(item.value || 0))}</span>
                                                </p>
                                            ))}
                                        </div>
                                    ) : null}
                                />
                                <Area type="monotone" name="Ciro" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#salesRevenue)" dot={false} />
                                <Area type="monotone" name="Kâr" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#salesProfit)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/50 bg-card/70 shadow-sm">
                    <CardContent className="p-5">
                        <h3 className="font-semibold text-base">Ödeme Dağılımı</h3>
                        <p className="text-xs text-muted-foreground mb-4">Seçili aralıktaki ödeme kanalları.</p>
                        <ResponsiveContainer width="100%" height={210}>
                            <PieChart>
                                <Pie data={report.paymentBreakdown} dataKey="total" nameKey="label" innerRadius={52} outerRadius={82} paddingAngle={4}>
                                    {report.paymentBreakdown.map((entry, index) => (
                                        <Cell key={entry.method} fill={paymentColors[index % paymentColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatMoney(Number(value || 0))} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                            {report.paymentBreakdown.map((item, index) => (
                                <div key={item.method} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: paymentColors[index % paymentColors.length] }} />
                                        {item.label}
                                    </span>
                                    <span className="font-semibold">{formatMoney(item.total)}</span>
                                </div>
                            ))}
                            {report.paymentBreakdown.length === 0 && (
                                <p className="text-sm text-muted-foreground">Bu aralıkta ödeme verisi bulunmuyor.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-5">
                <Card className="rounded-2xl border-border/50 bg-card/70 shadow-sm">
                    <CardContent className="p-5">
                        <h3 className="font-semibold text-base">Aralık Karşılaştırması</h3>
                        <p className="text-xs text-muted-foreground mb-4">Seçili aralığı önceki benzer dönemlerle yan yana görün.</p>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={periodComparison}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border/40" stroke="currentColor" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => formatMoney(Number(v)).replace(/,00$/, "")} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.55 }} axisLine={false} tickLine={false} width={70} />
                                <Tooltip formatter={(value: any) => formatMoney(Number(value || 0))} />
                                <Bar dataKey="ciro" name="Ciro" fill="#2563eb" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="kar" name="Kâr" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/50 bg-card/70 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="font-semibold text-base">En Çok Ciro Getiren Ürünler</h3>
                                <p className="text-xs text-muted-foreground">Seçili aralıktaki ürün bazlı satış performansı.</p>
                            </div>
                            <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                            {report.topProducts.map((product, index) => (
                                <div key={product.name} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.quantity} adet satıldı, tahmini kâr {formatMoney(product.profit)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">{formatMoney(product.revenue)}</p>
                                    </div>
                                </div>
                            ))}
                            {report.topProducts.length === 0 && (
                                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Bu aralıkta ürün satışı bulunmuyor.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl border-border/50 bg-card/70 shadow-sm">
                <CardContent className="p-5">
                    <h3 className="font-semibold text-base mb-3">Kısa Yorum</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {report.insights.map((insight) => (
                            <div key={insight} className={cn("rounded-xl border px-4 py-3 text-sm font-medium", insightTone(insight))}>
                                {insight}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
