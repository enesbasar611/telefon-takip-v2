"use client";

import { motion } from "framer-motion";
import { Wrench, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { StatType } from "./modals/stat-detail-modal";

interface MobileStatsHeaderProps {
    stats: {
        pendingServices: number;
        readyAssets: number;
        todayRevenue: number;
        activeRepairs: number;
        kasaBalance: string;
        kasaBalanceRaw: number;
        totalDevices: number;
    };
    onStatClick?: (type: StatType) => void;
}

export function MobileStatsHeader({ stats, onStatClick }: MobileStatsHeaderProps) {
    const cards = [
        {
            label: "Güncel Kasa",
            value: stats.kasaBalance,
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            type: "DAILY_SALES" as StatType,
        },
        {
            label: "Toplam Cihaz",
            value: stats.totalDevices,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            href: "/cihaz-listesi",
        },
        {
            label: "Bekleyen",
            value: stats.pendingServices,
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            type: "PENDING_SERVICES" as StatType,
        },
        {
            label: "Hazır",
            value: stats.readyAssets,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            type: "READY_DEVICES" as StatType,
        },
    ];

    return (
        <div className="w-full overflow-hidden py-2">
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 custom-scrollbar-hide snap-x snap-mandatory">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex-shrink-0 w-[160px] snap-start"
                        onClick={() => {
                            if (card.type && onStatClick) onStatClick(card.type);
                            if (card.href) window.location.href = card.href;
                        }}
                    >
                        <div className="p-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-zinc-800 shadow-xl shadow-black/5 flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer">
                            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", card.bg)}>
                                <card.icon className={cn("h-5 w-5", card.color)} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                    {card.label}
                                </span>
                                <span className="text-xl font-black mt-1 leading-none tracking-tight">
                                    {card.value}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
