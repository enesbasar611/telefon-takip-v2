"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    ArrowUpRight,
    Monitor,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export function DailySessions() {
    // Mock data for initial rendering to fix build
    const sessions = [
        { id: 1, name: "Sabah Vardiyası", status: "OPEN", total: 12450, staff: "Ahmet Y.", time: "08:30" },
        { id: 2, name: "Öğle Vardiyası", status: "CLOSED", total: 8900, staff: "Mehmet K.", time: "13:45" },
    ];

    return (
        <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card overflow-hidden h-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-blue-500" />
                        Günlük Oturumlar
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter">BUGÜN</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {sessions.map((session, index) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-blue-500/20 hover:bg-blue-500/5 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm ${session.status === "OPEN" ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 dark:bg-white/10 text-muted-foreground"
                                }`}>
                                {session.status === "OPEN" ? <Clock className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-foreground">{session.name}</h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{session.staff} • {session.time}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-foreground">₺{session.total.toLocaleString('tr-TR')}</p>
                            <Badge variant="secondary" className={`text-[8px] font-black uppercase px-2 py-0 h-4 mt-1 ${session.status === "OPEN" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-600"
                                }`}>
                                {session.status === "OPEN" ? "AÇIK" : "KAPALI"}
                            </Badge>
                        </div>
                    </motion.div>
                ))}

                <button className="w-full py-3 rounded-2xl border border-dashed border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300">
                    Tüm Oturumları Gör
                </button>
            </CardContent>
        </Card>
    );
}
