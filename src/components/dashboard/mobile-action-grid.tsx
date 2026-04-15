"use client";

import { motion } from "framer-motion";
import { PlusCircle, Search, ShoppingCart, MessageCircle, Users, Package, Smartphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MobileActionGrid() {
    const actions = [
        {
            label: "Yeni Servis",
            subLabel: "Kayıt Oluştur",
            icon: PlusCircle,
            href: "/servis/yeni",
            color: "bg-blue-500",
            iconColor: "text-blue-500",
        },
        {
            label: "Sorgula",
            subLabel: "Cihaz Durumu",
            icon: Search,
            href: "/sorgula",
            color: "bg-emerald-500",
            iconColor: "text-emerald-500",
        },
        {
            label: "Hızlı Satış",
            subLabel: "POS Ekranı",
            icon: ShoppingCart,
            href: "/satis",
            color: "bg-amber-500",
            iconColor: "text-amber-500",
        },
        {
            label: "Düşük Stok",
            subLabel: "Sipariş Bekleyen",
            icon: Package,
            href: "/stok",
            color: "bg-rose-500",
            iconColor: "text-rose-500",
        },
        {
            label: "E-CRM",
            subLabel: "Yeni Müşteri",
            icon: Users,
            href: "/musteriler/yeni",
            color: "bg-violet-500",
            iconColor: "text-violet-500",
        },
        {
            label: "Cihazlar",
            subLabel: "Cihaz Merkezi",
            icon: Smartphone,
            href: "/cihaz-listesi",
            color: "bg-blue-600",
            iconColor: "text-blue-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 px-4 pb-8">
            {actions.map((action, idx) => {
                const Content = (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-start p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-zinc-800 shadow-xl shadow-black/5 group relative overflow-hidden active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors"
                    >
                        {/* Background Accent Gradient */}
                        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 rounded-full -mr-10 -mt-10", action.color)} />

                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 bg-white dark:bg-zinc-800 shadow-lg border border-border/50")}>
                            <action.icon className={cn("h-6 w-6", action.iconColor)} />
                        </div>

                        <div className="flex flex-col text-left">
                            <span className="text-[15px] font-black tracking-tight leading-none text-foreground">
                                {action.label}
                            </span>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2 leading-none opacity-60">
                                {action.subLabel}
                            </span>
                        </div>
                    </motion.div>
                );

                if (action.href.startsWith('http')) {
                    return (
                        <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer" className="select-none touch-none no-underline">
                            {Content}
                        </a>
                    );
                }

                return (
                    <Link key={action.label} href={action.href} className="select-none touch-none no-underline">
                        {Content}
                    </Link>
                );
            })}
        </div>
    );
}
