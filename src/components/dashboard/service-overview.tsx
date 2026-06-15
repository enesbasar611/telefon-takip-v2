"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Wrench,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function ServiceOverview({ stats }: { stats: any }) {
    const s = stats || {};

    // Internal mappings for status display
    const statusItems = [
        { label: "Bekleyen", value: s.pendingTickets || 0, color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
        { label: "İşlemde", value: s.inProgressTickets || 0, color: "text-blue-500", bg: "bg-blue-500/10", icon: Wrench },
        { label: "Hazır", value: s.readyTickets || 0, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
        { label: "İptal/Sorunlu", value: s.issueTickets || 0, color: "text-rose-500", bg: "bg-rose-500/10", icon: AlertCircle },
    ];

    return (
        <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Servis Durumu
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {statusItems.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-border/40 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`h-8 w-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-2xl font-black text-foreground">{item.value}</span>
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-6 p-4 rounded-3xl bg-slate-100 dark:bg-white/10 flex items-center justify-between group cursor-pointer hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Canlı Servis Takibi</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
            </CardContent>
        </Card>
    );
}
