"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { CountingNumber } from "@/components/ui/counting-number";
import { getServiceMetrics } from "@/lib/actions/report-actions";
import { serializePrisma, cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
    PENDING: "#94a3b8",      // Grey
    APPROVED: "#3b82f6",     // Blue
    REPAIRING: "#f59e0b",    // Amber
    WAITING_PART: "#8b5cf6", // Purple
    READY: "#10b981",        // Green
    DELIVERED: "#059669",    // Dark Green
    CANCELLED: "#ef4444",    // Red
};

const statusLabels: Record<string, string> = {
    PENDING: "Beklemede",
    APPROVED: "Onaylandı",
    REPAIRING: "Tamirde",
    WAITING_PART: "Parça bekliyor",
    READY: "Hazır",
    DELIVERED: "Teslim edildi",
    CANCELLED: "İptal edildi",
};

export function ServiceStatusStream({ title = "Servis Durumu", cols = 9, rows = 3, onDataStatus }: { title?: string, cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
    const isVerySmall = cols < 8;
    const isShort = rows < 3;

    const { data = [], isLoading } = useQuery({
        queryKey: ["dashboard-service-metrics"],
        queryFn: async () => {
            const serviceMetricsRaw = await getServiceMetrics();
            const data = serializePrisma(serviceMetricsRaw);
            if (onDataStatus) {
                const total = (data || []).reduce((acc: number, m: any) => acc + (m.value || 0), 0);
                onDataStatus(!data || data.length === 0 || total === 0);
            }
            return data;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />;

    const serviceMetrics = data.map((m: any) => ({
        ...m,
        status: m.name,
        name: statusLabels[m.name] || m.name,
        color: statusColors[m.name] || "#cbd5e1"
    }));

    const totalServiceUnits = data.reduce((acc: number, m: any) => acc + m.value, 0);

    return (
        <Card className="h-full flex flex-col shadow-sm overflow-hidden group rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl border border-border/40 dark:border-white/[0.08] transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 bg-muted/10",
                isVerySmall || isShort ? "p-3 pb-2.5" : "px-5 py-3.5"
            )}>
                <div className="flex flex-col gap-0.5">
                    <CardTitle className={cn(
                        "font-semibold tracking-tight uppercase text-foreground",
                        isVerySmall ? "text-xs" : "text-sm"
                    )}>{title}</CardTitle>
                    {!isVerySmall && !isShort && (
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Kapasite Analizi</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <div className={cn(
                        "text-foreground leading-none font-extrabold tabular-nums",
                        isVerySmall || isShort ? "text-base" : "text-xl"
                    )}>
                        <CountingNumber value={totalServiceUnits} />
                    </div>
                    {!isVerySmall && !isShort && <div className="text-[9px] text-muted-foreground/70 tracking-wider uppercase font-semibold">Cihaz</div>}
                </div>
            </CardHeader>
            <CardContent className={cn(
                "flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-start space-y-4",
                isVerySmall || isShort ? "p-3 pt-2" : "p-4 sm:p-5"
            )}>
                <div className="w-full">
                    <ServiceStatusChart data={serviceMetrics} />
                </div>
            </CardContent>
        </Card>
    );
}
