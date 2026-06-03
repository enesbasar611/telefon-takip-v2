"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { getServiceMetrics } from "@/lib/actions/report-actions";
import { serializePrisma, cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
    PENDING: "#94a3b8",      // Grey
    APPROVED: "#3b82f6",     // Blue
    REPAIRING: "#3b82f6",    // Orange
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

export function ServiceStatusStream({ title = "Servis Durumu", cols = 8, rows = 4, onDataStatus }: { title?: string, cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
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

    if (isLoading) return <Card className="h-full border border-border/40 bg-card rounded-[2rem] animate-pulse" />;

    const serviceMetrics = data.map((m: any) => ({
        ...m,
        status: m.name,
        name: statusLabels[m.name] || m.name,
        color: statusColors[m.name] || "#cbd5e1"
    }));

    const totalServiceUnits = data.reduce((acc: number, m: any) => acc + m.value, 0);

    return (
        <Card className="h-full flex flex-col shadow-xl overflow-hidden group rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:shadow-2xl animate-in fade-in">
            <CardHeader className={cn(
                "flex-shrink-0 flex flex-row items-center justify-between",
                isVerySmall || isShort ? "p-4 pb-2" : "p-8 pb-4"
            )}>
                <div className="flex flex-col gap-1">
                    <CardTitle className={cn(
                        "font-medium tracking-tight font-sans uppercase",
                        isVerySmall || isShort ? "text-sm" : "text-xl"
                    )}>{title}</CardTitle>
                    {!isVerySmall && !isShort && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Kapasite Analizi</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <div className={cn(
                        "text-foreground leading-none font-bold",
                        isVerySmall || isShort ? "text-lg" : "text-2xl"
                    )}>{totalServiceUnits}</div>
                    {!isVerySmall && !isShort && <div className="text-[9px] text-muted-foreground/60 tracking-widest uppercase">Cihaz</div>}
                </div>
            </CardHeader>
            <CardContent className={cn(
                "flex-1 min-h-0",
                isVerySmall || isShort ? "p-4 pt-0" : "p-8 pt-2"
            )}>
                <div className="h-full w-full">
                    <ServiceStatusChart data={serviceMetrics} />
                </div>
            </CardContent>
        </Card>
    );
}




