"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    ShoppingCart,
    Wrench,
    Users,
    Smartphone,
    CreditCard,
    FileText,
    Settings
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const actions = [
    {
        title: "Yeni Satış",
        description: "Hızlı satış işlemini başlat",
        icon: ShoppingCart,
        href: "/satis",
        color: "bg-blue-500",
        delay: 0.1
    },
    {
        title: "Servis Kaydı",
        description: "Yeni cihaz teknik servis kaydı",
        icon: Wrench,
        href: "/teknik-servis",
        color: "bg-amber-500",
        delay: 0.2
    },
    {
        title: "Müşteri Ekle",
        description: "Yeni müşteri profili oluştur",
        icon: Users,
        href: "/rehber",
        color: "bg-emerald-500",
        delay: 0.3
    },
    {
        title: "Ürün Ekle",
        description: "Stoka yeni ürün girişi yap",
        icon: Smartphone,
        href: "/stok",
        color: "bg-purple-500",
        delay: 0.4
    },
    {
        title: "Ödeme Al",
        description: "Tahsilat veya ödeme kaydı",
        icon: CreditCard,
        href: "/finans",
        color: "bg-rose-500",
        delay: 0.5
    },
    {
        title: "Dönem Kapat",
        description: "Ay sonu finansal arşivi oluştur",
        icon: FileText,
        href: "/personel",
        color: "bg-slate-600",
        delay: 0.6
    }
];

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {actions.map((action) => (
                <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: action.delay }}
                >
                    <Link href={action.href}>
                        <Card className="group border-none shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden bg-card/60 backdrop-blur-xl border border-white/10">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className={`h-12 w-12 rounded-2xl ${action.color} text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <action.icon className="w-6 h-6" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{action.title}</h4>
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{action.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
