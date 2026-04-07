"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wrench, CheckCircle2, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatsProps {
    tickets: any[];
}

export function ServiceStats({ tickets }: ServiceStatsProps) {
    const stats = [
        {
            label: "AKTİF SERVİS",
            value: tickets.filter(t => ["PENDING", "APPROVED", "REPAIRING", "WAITING_PART"].includes(t.status)).length,
            icon: Wrench,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            description: "İşlem bekleyen ve devam eden"
        },
        {
            label: "TESLİME HAZIR",
            value: tickets.filter(t => t.status === "READY").length,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            description: "Müşteri bekleyen cihazlar"
        },
        {
            label: "KRİTİK / GECİKEN",
            value: tickets.filter(t => t.status !== "DELIVERED" && t.status !== "CANCELLED" && t.priority === 3).length,
            icon: AlertCircle,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            description: "Acil müdahale bekleyenler"
        },
        {
            label: "BUGÜNKÜ KAYIT",
            value: tickets.filter(t => {
                const today = new Date();
                const ticketDate = new Date(t.createdAt);
                return today.toDateString() === ticketDate.toDateString();
            }).length,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            description: "Bugün açılan servis fişleri"
        }
    ];

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-700">
            {stats.map((stat, i) => (
                <Card key={i} className="rounded-3xl border-none shadow-xl shadow-slate-200/50 dark:shadow-black/40 bg-card/60 backdrop-blur-3xl transition-all duration-500 hover:translate-y-[-4px] group">
                    <CardContent className="p-8 flex flex-col justify-between min-h-[160px]">
                        <div className="flex items-center justify-between">
                            <div className={cn("p-4 rounded-2xl border shadow-inner transition-transform group-hover:scale-110", stat.bg, stat.border)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            <TrendingUp className="h-4 w-4 text-foreground/90" />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px]  text-muted-foreground tracking-wider mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl  text-foreground">{stat.value}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">{stat.description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}



