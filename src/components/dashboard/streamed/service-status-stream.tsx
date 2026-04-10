import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceStatusChart } from "@/components/charts/service-status-chart";
import { getServiceMetrics } from "@/lib/actions/report-actions";
import { serializePrisma } from "@/lib/utils";

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

export async function ServiceStatusStream({ title = "Servis Durumu" }: { title?: string }) {
    const serviceMetricsRaw = await getServiceMetrics();
    const metrics = serializePrisma(serviceMetricsRaw);

    const serviceMetrics = metrics.map((m: any) => ({
        ...m,
        status: m.name,
        name: statusLabels[m.name] || m.name,
        color: statusColors[m.name] || "#cbd5e1"
    }));

    const totalServiceUnits = metrics.reduce((acc: number, m: any) => acc + m.value, 0);

    return (
        <Card className="shadow-xl overflow-hidden group rounded-[2rem] bg-card border border-border/40 transition-all duration-500 hover:shadow-2xl animate-in fade-in duration-1000">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                <div className="flex flex-col gap-1">
                    <CardTitle className="font-medium text-xl  tracking-tight font-sans uppercase">{title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <p className="text-[10px] text-muted-foreground  uppercase tracking-wider">Kapasite Analizi</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-2xl  text-foreground leading-none">{totalServiceUnits}</div>
                    <div className="text-[9px]  text-muted-foreground/60 tracking-widest uppercase">Cihaz</div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-2">
                <ServiceStatusChart data={serviceMetrics} />
            </CardContent>
        </Card>
    );
}




