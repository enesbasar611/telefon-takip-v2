"use client";

import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BarChart3, CalendarDays, CircleDollarSign, Loader2, PackageCheck, ReceiptText, TrendingUp, Wrench } from "lucide-react";
import { getServiceProfitAnalytics } from "@/lib/actions/service-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "@/lib/context/dashboard-data-context";
import { convertServiceProfitAnalyticsCurrency, type ServiceAnalyticsDisplayCurrency } from "@/lib/service/service-profit-analytics";
import { cn } from "@/lib/utils";

type RangePreset = "today" | "week" | "month" | "custom";

const presets: Array<{ key: RangePreset; label: string; icon: typeof CalendarDays }> = [
  { key: "today", label: "Gunluk", icon: CalendarDays },
  { key: "week", label: "Haftalik", icon: BarChart3 },
  { key: "month", label: "Aylik", icon: TrendingUp },
  { key: "custom", label: "Iki Tarih", icon: CalendarDays },
];

function toDateInputValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getPresetRange(preset: RangePreset, customStart: string, customEnd: string) {
  const now = new Date();

  if (preset === "week") {
    const start = startOfDay(now);
    start.setDate(now.getDate() - 6);
    return { start, end: endOfDay(now) };
  }

  if (preset === "month") {
    const start = startOfDay(now);
    start.setDate(1);
    return { start, end: endOfDay(now) };
  }

  if (preset === "custom" && customStart && customEnd) {
    return {
      start: startOfDay(new Date(`${customStart}T00:00:00`)),
      end: endOfDay(new Date(`${customEnd}T00:00:00`)),
    };
  }

  return { start: startOfDay(now), end: endOfDay(now) };
}

function formatCurrency(value: number, currency: ServiceAnalyticsDisplayCurrency) {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "TRY" ? 0 : 2,
    maximumFractionDigits: currency === "TRY" ? 0 : 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value || 0);
}

export function ServiceProfitCards() {
  const { rates, defaultCurrency } = useDashboardData();
  const today = toDateInputValue(new Date());
  const [preset, setPreset] = useState<RangePreset>("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  const range = useMemo(
    () => getPresetRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const { data: result, isFetching } = useQuery({
    queryKey: ["service-profit-analytics", range.start.toISOString(), range.end.toISOString()],
    queryFn: () =>
      getServiceProfitAnalytics({
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

  const baseAnalytics = result?.data || {
    serviceCount: 0,
    partsQuantity: 0,
    laborRevenue: 0,
    partsRevenue: 0,
    grossRevenue: 0,
    partsCost: 0,
    overhead: 0,
    netProfit: 0,
  };
  const displayCurrency = (["TRY", "USD", "EUR"].includes(defaultCurrency) ? defaultCurrency : "TRY") as ServiceAnalyticsDisplayCurrency;
  const analytics = convertServiceProfitAnalyticsCurrency(baseAnalytics, displayCurrency, rates || {});

  const stats = [
    {
      title: "Yapilan Servis",
      value: formatNumber(analytics.serviceCount),
      detail: "Teslim edilmis servis adedi",
      icon: Wrench,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      title: "Kullanilan Parca",
      value: formatNumber(analytics.partsQuantity),
      detail: `${formatCurrency(analytics.partsRevenue, displayCurrency)} parca geliri`,
      icon: PackageCheck,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      title: "Toplam Tahsilat",
      value: formatCurrency(analytics.grossRevenue, displayCurrency),
      detail: `${formatCurrency(analytics.laborRevenue, displayCurrency)} iscilik + servis`,
      icon: ReceiptText,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Net Kazanc",
      value: formatCurrency(analytics.netProfit, displayCurrency),
      detail: `${formatCurrency(analytics.partsCost + analytics.overhead, displayCurrency)} maliyet dusuldu`,
      icon: CircleDollarSign,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-white/[0.02] p-3 sm:p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-foreground">
            Servis Kazanç Özeti
          </h2>
          <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-muted-foreground">
            Teslim edilen servislerden gelir, parça kullanımı ve net kazancı takip edin.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 lg:items-end">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {presets.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={preset === item.key ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset(item.key)}
                className={cn(
                  "h-8 sm:h-9 shrink-0 rounded-lg sm:rounded-xl px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-black uppercase tracking-wider",
                  preset === item.key && "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
                )}
              >
                <item.icon className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {item.label}
              </Button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="h-9 sm:h-10 w-full rounded-lg sm:rounded-xl border-border/60 bg-background/60 text-xs sm:w-40"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="h-9 sm:h-10 w-full rounded-lg sm:rounded-xl border-border/60 bg-background/60 text-xs sm:w-40"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              "relative overflow-hidden rounded-xl sm:rounded-2xl border bg-card/40 p-2.5 sm:p-5 shadow-none transition-colors",
              stat.border
            )}
          >
            <div className={cn("absolute right-0 top-0 h-14 w-14 sm:h-20 sm:w-20 rounded-full blur-xl sm:blur-3xl", stat.bg)} />
            <div className="relative z-10 flex items-start justify-between gap-1.5 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground truncate">
                  {stat.title}
                </p>
                <div className="mt-1 sm:mt-3 flex items-center gap-1 sm:gap-2">
                  <p className="truncate text-sm sm:text-2xl font-black tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  {isFetching && <Loader2 className="h-2.5 w-2.5 sm:h-4 sm:w-4 shrink-0 animate-spin text-muted-foreground" />}
                </div>
                <p className="mt-1 sm:mt-3 text-[9px] sm:text-xs font-medium text-muted-foreground line-clamp-1">
                  {stat.detail}
                </p>
              </div>
              <div className={cn("rounded-md sm:rounded-xl p-1.5 sm:p-3 shrink-0", stat.bg)}>
                <stat.icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", stat.color)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
