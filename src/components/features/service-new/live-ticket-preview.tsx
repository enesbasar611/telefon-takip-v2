"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    UserPlus,
    Smartphone,
    AlertCircle,
    Clock,
    Sparkles,
    Wrench,
    CheckCircle2,
    Trash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiveTicketPreviewProps {
    technicians: any[];
}

export function LiveTicketPreview({ technicians }: LiveTicketPreviewProps) {
    const { watch } = useFormContext();

    const watchedCustomerName = watch("customerName");
    const watchedCustomerPhone = watch("customerPhone");
    const watchedDeviceBrand = watch("deviceBrand");
    const watchedDeviceModel = watch("deviceModel");
    const watchedProblemDesc = watch("problemDesc");
    const watchedEstimatedCost = watch("estimatedCost");
    const watchedDownPayment = watch("downPayment");
    const watchedEstimatedDeliveryDate = watch("estimatedDeliveryDate");
    const watchedTechnicianId = watch("technicianId");
    const watchedDevicePassword = watch("devicePassword");

    return (
        <div className="hidden lg:block sticky top-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
            <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-border/30 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden group-hover:border-primary/20 transition-all duration-500">
                    {/* Card Header Design */}
                    <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-between px-8 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white dark:from-white via-transparent to-transparent" />

                        <motion.div
                            className="relative flex items-center gap-4"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="bg-primary/10 dark:bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-primary/10 dark:border-white/10 shadow-inner">
                                <Smartphone className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-[0.3em]">CANLI ÖNİZLEME</span>
                                <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">SİSTEM AKTİF</span>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-2">
                            <motion.div
                                className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">BAĞLI</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Customer Section */}
                        <div className="space-y-4">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] block">MÜŞTERİ</span>
                            <div className="flex items-center gap-4 group/item">
                                <div className="h-12 w-12 rounded-2xl bg-primary/5 dark:bg-primary/5 border border-primary/10 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground leading-none mb-1">{watchedCustomerName || "— — —"}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground/60">{watchedCustomerPhone || "0 (000) 000 00 00"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Device Section */}
                        <div className="space-y-4">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] block">CİHAZ & ARIZA</span>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/40 dark:bg-white/5 border border-border/30 dark:border-white/5 p-4 rounded-2xl space-y-1 hover:bg-muted/60 dark:hover:bg-white/[0.07] transition-all">
                                    <span className="text-[8px] font-black text-muted-foreground/50 uppercase">MODEL</span>
                                    <p className="text-[11px] font-black text-foreground truncate">{(watchedDeviceBrand + " " + watchedDeviceModel).trim() || "Cihaz Belirtilmedi"}</p>
                                </div>
                                <div className="bg-muted/40 dark:bg-white/5 border border-border/30 dark:border-white/5 p-4 rounded-2xl space-y-1 hover:bg-muted/60 dark:hover:bg-white/[0.07] transition-all">
                                    <span className="text-[8px] font-black text-muted-foreground/50 uppercase">ŞİFRE</span>
                                    <p className="text-[11px] font-black text-foreground truncate">{watchedDevicePassword || "Şifre Yok"}</p>
                                </div>
                            </div>

                            <div className="bg-primary/[0.03] dark:bg-white/[0.03] border-l-2 border-primary/30 p-4 rounded-r-2xl space-y-1.5 transition-all">
                                <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">ARIZA TANIMI</span>
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic line-clamp-3">
                                    {watchedProblemDesc || "Henüz bir arıza açıklaması girilmedi..."}
                                </p>
                            </div>
                        </div>

                        {/* Logistics Section */}
                        <div className="space-y-4">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] block">OPERASYON</span>
                            <div className="flex items-center justify-between bg-muted/30 dark:bg-white/[0.02] p-4 rounded-2xl border border-border/30 dark:border-white/5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-muted-foreground/50 uppercase">SORUMLU</span>
                                    <span className="text-[11px] font-bold text-foreground">
                                        {technicians.find(t => t.id === watchedTechnicianId)?.name || "Atama Bekliyor"}
                                    </span>
                                </div>
                                <div className="text-right flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-muted-foreground/50 uppercase text-right">TESLİMAT</span>
                                    <span className="text-[11px] font-bold text-foreground">
                                        {watchedEstimatedDeliveryDate ? format(new Date(watchedEstimatedDeliveryDate), "d MMM HH:mm", { locale: tr }) : "Belirsiz"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Total Section */}
                        <div className="pt-6 border-t border-border/30 dark:border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">TOPLAM BEDEL</span>
                                <span className="text-3xl font-black text-foreground tracking-tighter">₺{Number(watchedEstimatedCost || 0).toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-right">
                                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500/60 uppercase block">KAPORA</span>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₺{Number(watchedDownPayment || 0).toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer Design */}
                    <div className="bg-muted/30 dark:bg-white/5 p-4 flex items-center justify-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-foreground/10 dark:bg-white/20" />
                        <div className="h-1 w-12 rounded-full bg-foreground/10 dark:bg-white/20" />
                        <div className="h-1 w-1 rounded-full bg-foreground/10 dark:bg-white/20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
