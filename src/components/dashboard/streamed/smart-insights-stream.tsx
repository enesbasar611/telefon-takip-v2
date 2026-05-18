"use client";

import { SmartInsights } from "@/components/dashboard/smart-insights";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { serializePrisma } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export function SmartInsightsStream({ cols = 8, rows = 4, shopId }: { cols?: number, rows?: number, shopId?: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-smart-insights", shopId || ""],
        queryFn: async () => serializePrisma(await getDashboardStats(shopId || "")),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) return <Card className="h-full border border-border/40 bg-card rounded-[2rem] animate-pulse" />;

    return (
        <div className="h-full shadow-xl rounded-[2rem] overflow-hidden animate-in fade-in">
            <SmartInsights stats={data} cols={cols} rows={rows} />
        </div>
    );
}



