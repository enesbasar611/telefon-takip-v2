"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Activity,
    User,
    History,
    MessageSquare,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function StaffActivity() {
    // Mock recent activities
    const activities = [
        { id: 1, user: "Enes B.", action: "iPhone 13 Ekran Değişimi tamamladı", time: "5 dk önce", type: "SERVICE" },
        { id: 2, user: "Mert S.", action: "Samsung S22 satışı gerçekleştirdi", time: "12 dk önce", type: "SALE" },
        { id: 3, user: "Yusuf T.", action: "Müşteri kaydı güncelledi", time: "25 dk önce", type: "UPDATE" },
        { id: 4, user: "Sistem", action: "Yedekleme başarıyla tamamlandı", time: "1 saat önce", type: "SYSTEM" },
    ];

    return (
        <Card className="rounded-[2.5rem] border-border/20 shadow-xl bg-card overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    Ekip Aktivitesi
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 relative"
                    >
                        {index !== activities.length - 1 && (
                            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-100 dark:bg-white/5" />
                        )}
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden border border-border/40">
                            {activity.type === "SYSTEM" ? <Zap className="w-4 h-4 text-rose-500" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-xs font-black text-foreground truncate">{activity.user}</h4>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.time}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{activity.action}</p>
                        </div>
                    </motion.div>
                ))}

                <button className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group">
                    <History className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    Tüm Kayıtları Gör
                </button>
            </CardContent>
        </Card>
    );
}
