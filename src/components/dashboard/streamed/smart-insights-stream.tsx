"use client";

import { SmartInsights } from "@/components/dashboard/smart-insights";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { serializePrisma } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export function SmartInsightsStream({ cols = 8, rows = 4, shopId, onDataStatus }: { cols?: number, rows?: number, shopId?: string, onDataStatus?: (isEmpty: boolean) => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-smart-insights", shopId || ""],
        queryFn: async () => {
            const dataRaw = await getDashboardStats();
            const data = serializePrisma(dataRaw);
            if (onDataStatus) {
                onDataStatus(!data || Object.keys(data).length === 0);
            }
            return data;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card/60 rounded-2xl animate-pulse" />;

    return (
        <div className="h-full shadow-sm rounded-2xl overflow-hidden animate-in fade-in">
            <SmartInsights stats={data} cols={cols} rows={rows} />
        </div>
    );
}
