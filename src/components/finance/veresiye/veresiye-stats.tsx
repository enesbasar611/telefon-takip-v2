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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {statsData.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => onStatClick(stat.type)}
                    className="cursor-pointer"
                >
                    <Card className="border-none bg-muted/40 backdrop-blur-2xl shadow-xl shadow-black/5 overflow-hidden rounded-[2.5rem] group hover:bg-muted/50 transition-all duration-500 border border-border">
                        <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                                {stat.title}
                            </CardTitle>
                            <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter mb-1">
                                {stat.value}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
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
