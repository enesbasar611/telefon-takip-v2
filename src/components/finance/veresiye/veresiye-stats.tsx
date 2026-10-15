"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditCard, Wallet, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

export function VeresiyeStats({ statsData, onStatClick }: VeresiyeStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {statsData.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => onStatClick(stat.type)}
                    className="cursor-pointer"
                >
                    <Card className="border-none bg-muted/40 backdrop-blur-2xl shadow-lg sm:shadow-xl shadow-black/5 overflow-hidden rounded-xl sm:rounded-[2.5rem] group hover:bg-muted/50 transition-all duration-500 border border-border">
                        <CardHeader className="flex flex-row items-center justify-between px-3.5 pt-3.5 sm:px-8 sm:pt-8 pb-1 sm:pb-2">
                            <CardTitle className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-muted-foreground/70 truncate">
                                {stat.title}
                            </CardTitle>
                            <div className={cn("p-2 sm:p-4 rounded-lg sm:rounded-2xl transition-all duration-500 group-hover:scale-110 shrink-0", stat.bg, stat.color)}>
                                <stat.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-3.5 pb-3.5 sm:px-8 sm:pb-8">
                            <div className="text-base sm:text-3xl font-black text-foreground tabular-nums tracking-tighter mb-0.5 sm:mb-1 truncate">
                                {stat.value}
                            </div>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                                {stat.subValue}
                            </p>
                        </CardContent>
                        <div className={cn("absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity", stat.bg)} />
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
