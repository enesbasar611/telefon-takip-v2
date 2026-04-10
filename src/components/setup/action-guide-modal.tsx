"use client";

import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import {
    Smartphone,
    Package,
    CreditCard,
    Settings2,
    ChevronRight,
    Sparkles,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getIndustryLabel } from "@/lib/industry-utils";

interface ActionGuideModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shopName: string;
    shop?: any;
}

const colorVariants: any = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white shadow-blue-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white shadow-emerald-500/20",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white shadow-amber-500/20",
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white shadow-indigo-500/20",
};

export function ActionGuideModal({ open, onOpenChange, shopName, shop }: ActionGuideModalProps) {
    const router = useRouter();

    const ACTIONS = [
        {
            id: "service",
            title: `Yeni ${getIndustryLabel(shop, "serviceTicket")} Kaydı`,
            desc: `${getIndustryLabel(shop, "customerAsset")} girişini hızla sisteme kabul edin.`,
            icon: Smartphone,
            color: "blue",
            href: "/servis?action=new",
            delay: 0.1
        },
        {
            id: "product",
            title: "Stok Girişi Yap",
            desc: "Ürünlerinizi barkod veya manuel ekleyin.",
            icon: Package,
            color: "emerald",
            href: "/stok?action=new",
            delay: 0.2
        },
        {
            id: "sale",
            title: "Hızlı Satış Paneli",
            desc: "Barkod okutarak saniyeler içinde satış yapın.",
            icon: CreditCard,
            color: "amber",
            href: "/satis",
            delay: 0.3
        },
        {
            id: "settings",
            title: "Dükkan Ayarları",
            desc: "Logo, fatura ve kullanıcı yetkilerini düzenleyin.",
            icon: Settings2,
            color: "indigo",
            href: "/ayarlar",
            delay: 0.4
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-black/90 backdrop-blur-3xl border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className="relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[300px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

                    <div className="p-10 relative z-10 space-y-8">
                        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge className="h-6 bg-white/5 border-white/10 text-white/60 font-black text-[9px] tracking-widest uppercase rounded-full px-2.5 py-0.5">Kurulum Tamamlandı</Badge>
                                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter italic text-white leading-none pt-2">
                                    Hoş Geldiniz, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">{shopName}</span>!
                                </h2>
                                <p className="text-gray-400 text-sm font-medium">Sistemi kullanmaya başlamak için ilk adımı seçin.</p>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-1 gap-4">
                            {ACTIONS.map((action) => (
                                <motion.button
                                    key={action.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: action.delay }}
                                    onClick={() => {
                                        onOpenChange(false);
                                        router.push(action.href);
                                    }}
                                    className="group relative flex items-center gap-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
                                >
                                    <div className={cn(
                                        "h-16 w-16 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-xl",
                                        colorVariants[action.color]
                                    )}>
                                        <action.icon className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black italic text-lg text-white group-hover:translate-x-1 transition-transform">{action.title}</h3>
                                        <p className="text-xs font-medium text-gray-500 leading-relaxed mt-1">{action.desc}</p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center text-gray-700 group-hover:text-white transition-colors">
                                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <div className="pt-4 flex flex-col items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="text-[10px] font-black tracking-widest text-gray-500 hover:text-white uppercase transition-all"
                            >
                                ŞİMDİLİK DASHBOARD'A GİT <ChevronRight className="h-3 w-3 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Badge({ className, children }: any) {
    return (
        <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none", className)}>
            {children}
        </div>
    );
}
