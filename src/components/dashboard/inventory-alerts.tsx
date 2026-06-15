"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertTriangle,
    AlertCircle,
    ArrowRight,
    TrendingDown,
    Package
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function InventoryAlerts() {
    // Mock inventory alerts
    const alerts = [
        { id: 1, title: "Kritik Stok", description: "iPhone 11 Ekran stokta 2 adet kaldı.", priority: "HIGH", type: "LOW_STOCK" },
        { id: 2, title: "Hareketsiz Ürün", description: "Xiaomi Note 10 Pro Kılıf 90 gündür satılmadı.", priority: "MEDIUM", type: "DEAD_STOCK" },
    ];

    return (
        <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl scale-150">
                <AlertTriangle className="w-32 h-32 text-amber-500" />
            </div>

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-80">
                    <Package className="w-4 h-4 text-emerald-400" />
                    Stok Uyarıları
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                {alerts.map((alert, index) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group flex items-center justify-between p-5 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${alert.priority === "HIGH" ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                                }`}>
                                {alert.type === "LOW_STOCK" ? <TrendingDown className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                    {alert.title}
                                    {alert.priority === "HIGH" && (
                                        <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-none text-[8px] h-4 font-black">ACİL</Badge>
                                    )}
                                </h4>
                                <p className="text-xs text-white/60 mt-1 font-medium italic">{alert.description}</p>
                            </div>
                        </div>
                        <Link href="/stok" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white text-slate-950 transition-all group-hover:translate-x-1">
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                ))}

                <button className="w-full py-4 mt-2 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                    Stok Durumunu İncele
                </button>
            </CardContent>
        </Card>
    );
}
