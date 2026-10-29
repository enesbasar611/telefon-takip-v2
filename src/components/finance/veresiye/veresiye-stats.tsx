"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CountingNumber } from "@/components/ui/counting-number";

interface VeresiyeStatsProps {
    statsData: {
        type: string;
        title: string;
        value: string;
        subValue: string | React.ReactNode;
        icon: any;
        color: string;
        bg: string;
    }[];
    onStatClick: (type: string) => void;
}

const themeMap: Record<string, {
    bg: string;
    border: string;
    glow: string;
    iconWrap: string;
    line: string;
}> = {
    RECEIVABLE_TRY: {
        bg: "bg-gradient-to-br from-emerald-500/10 via-card/90 to-teal-500/5 dark:from-emerald-950/25 dark:via-card/90 dark:to-[#04241a]/60",
        border: "border-emerald-500/25 dark:border-emerald-400/25 hover:border-emerald-500/50",
        glow: "shadow-[0_4px_16px_0_rgba(16,185,129,0.08)] dark:shadow-[0_8px_24px_0_rgba(16,185,129,0.15)]",
        iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        line: "bg-emerald-500",
    },
    RECEIVABLE_USD: {
        bg: "bg-gradient-to-br from-sky-500/10 via-card/90 to-blue-500/5 dark:from-sky-950/25 dark:via-card/90 dark:to-[#041d33]/60",
        border: "border-sky-500/25 dark:border-sky-400/25 hover:border-sky-500/50",
        glow: "shadow-[0_4px_16px_0_rgba(14,165,233,0.08)] dark:shadow-[0_8px_24px_0_rgba(14,165,233,0.15)]",
        iconWrap: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20",
        line: "bg-sky-500",
    },
    GENERAL_TOTAL: {
        bg: "bg-gradient-to-br from-amber-500/10 via-card/90 to-orange-500/5 dark:from-amber-950/25 dark:via-card/90 dark:to-[#291703]/60",
        border: "border-amber-500/25 dark:border-amber-400/25 hover:border-amber-500/50",
        glow: "shadow-[0_4px_16px_0_rgba(245,158,11,0.08)] dark:shadow-[0_8px_24px_0_rgba(245,158,11,0.15)]",
        iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        line: "bg-amber-500",
    },
    COLLECTED: {
        bg: "bg-gradient-to-br from-indigo-500/10 via-card/90 to-purple-500/5 dark:from-indigo-950/25 dark:via-card/90 dark:to-[#170a36]/60",
        border: "border-indigo-500/25 dark:border-indigo-400/25 hover:border-indigo-500/50",
        glow: "shadow-[0_4px_16px_0_rgba(99,102,241,0.08)] dark:shadow-[0_8px_24px_0_rgba(99,102,241,0.15)]",
        iconWrap: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
        line: "bg-indigo-500",
    },
};

export function VeresiyeStats({ statsData, onStatClick }: VeresiyeStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statsData.map((stat, i) => {
                const theme = themeMap[stat.type] || themeMap.RECEIVABLE_TRY;
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                        onClick={() => onStatClick(stat.type)}
                        className="cursor-pointer"
                    >
                        <Card className={cn(
                            "relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 group hover:shadow-md active:scale-[0.99]",
                            theme.bg,
                            theme.border,
                            theme.glow
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-4 pb-1 sm:pb-1.5 space-y-0">
                                <CardTitle className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground/85 dark:text-muted-foreground/75 truncate">
                                    {stat.title}
                                </CardTitle>
                                <div className={cn(
                                    "p-1.5 sm:p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0 shadow-xs",
                                    theme.iconWrap
                                )}>
                                    <stat.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-3.5 sm:p-4 pt-1 sm:pt-1">
                                <div className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tabular-nums tracking-tight mb-1 truncate">
                                    <CountingNumber value={stat.value} trigger="view" grouping />
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground/80 tracking-wide truncate">
                                    {stat.subValue}
                                </div>
                            </CardContent>
                            <div className={cn(
                                "absolute bottom-0 left-0 h-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                theme.line
                            )} />
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
