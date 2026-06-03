"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Wrench,
    CheckCircle2,
    TrendingUp,
    Zap,
    Clock,
    ArrowUpRight
} from "lucide-react";

interface ServiceKpiCardsProps {
    counts: {
        active: number;
        ready: number;
        readyValue: number;
        monthlyRevenue: number;
        all: number;
    };
}

export function ServiceKpiCards({ counts }: ServiceKpiCardsProps) {
    const stats = [
        {
            title: "Aktif İşler",
            value: counts.active,
            label: "Mevcut Onarımda",
            icon: Wrench,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
        },
        {
            title: "Teslime Hazır",
            value: counts.ready,
            label: `₺${counts.readyValue.toLocaleString('tr-TR')} Bekleyen`,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
        },
        {
            title: "Aylık Gelir",
            value: `₺${counts.monthlyRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
            label: "Bu Ay Teslim Edilen",
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            title: "Toplam Kayıt",
            value: counts.all,
            label: "Sistem Geçmişi",
            icon: Zap,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-0 md:px-0 mb-8">
            {stats.map((stat, i) => (
                <Card
                    key={i}
                    className={cn(
                        "p-6 rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-border/80 transition-all duration-500",
                    )}
                >
                    {/* Background Glow */}
                    <div className={cn(
                        "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full",
                        stat.bg
                    )} />

                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded-lg">
                                CANLI <ArrowUpRight className="h-3 w-3" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-3xl font-black tracking-tight text-foreground">
                                {stat.value}
                            </h3>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                {stat.title}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <Clock className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase">
                                {stat.label}
                            </span>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
