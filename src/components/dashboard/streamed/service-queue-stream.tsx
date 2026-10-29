"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn, serializePrisma } from "@/lib/utils";
import { getRecentSales } from "@/lib/actions/dashboard-actions";
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

export function ServiceQueueStream({ title = "Servis Kuyruğu", shopId, cols = 12, rows = 3, onDataStatus }: { title?: string, shopId?: string, cols?: number, rows?: number, onDataStatus?: (isEmpty: boolean) => void }) {
    const { data: recentTickets = [], isLoading } = useQuery({
        queryKey: ["dashboard-service-queue", shopId || ""],
        queryFn: async () => {
            if (!shopId) return [];
            const recentTicketsRaw = await getRecentSales(shopId, 6);
            return serializePrisma(recentTicketsRaw);
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    useEffect(() => {
        if (!isLoading && onDataStatus) {
            onDataStatus(!recentTickets || recentTickets.length === 0);
        }
    }, [recentTickets, isLoading, onDataStatus]);

    if (isLoading) return <Card className="h-full border border-border/40 bg-card/60 backdrop-blur-xl rounded-2xl animate-pulse" />;

    return (
        <Card className="h-full flex flex-col border border-border/40 shadow-sm overflow-hidden rounded-2xl bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl transition-all duration-300 hover:shadow-md animate-in fade-in">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 px-5 py-3.5 bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="font-semibold text-sm tracking-tight uppercase text-foreground">{title}</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Aktif İş Emirleri</p>
                    </div>
                </div>
                <Link href="/servis/liste">
                    <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-wider text-foreground hover:text-primary border-border/60 hover:bg-muted h-7 rounded-lg px-2.5 transition-all">
                        YÖNET <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-2 custom-scrollbar">
                {(recentTickets ?? []).length > 0 ? (
                    <>
                        {(recentTickets ?? []).map((ticket: any) => (
                            <Link
                                key={ticket.id}
                                href={`/servis/liste?status=${ticket.status}`}
                                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/40 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border border-border/40 hover:border-border transition-all duration-200 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-lg bg-card border border-border/40 flex items-center justify-center shadow-xs relative shrink-0 group-hover:scale-105 transition-transform">
                                        <Smartphone className="h-4 w-4 text-primary/80" />
                                        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-background animate-pulse" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-xs text-foreground tracking-tight truncate uppercase group-hover:text-primary transition-colors">
                                            {ticket.deviceBrand} {ticket.deviceModel}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight truncate mt-0.5">
                                            {ticket.customer?.name} • <span className="text-primary font-semibold tabular-nums">#{ticket.ticketNumber}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <span
                                        className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider border px-2 py-0.5 rounded-md"
                                        style={{
                                            backgroundColor: `${statusColors[ticket.status]}15`,
                                            borderColor: `${statusColors[ticket.status]}30`,
                                            color: statusColors[ticket.status]
                                        }}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColors[ticket.status] }} />
                                        {statusLabels[ticket.status]}
                                    </span>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                        {ticket.technician?.name || "BOŞTA"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Smartphone className="h-7 w-7 mb-1.5 opacity-40" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider">Kuyruk Boş</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
