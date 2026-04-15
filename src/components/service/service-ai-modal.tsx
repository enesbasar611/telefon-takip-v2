"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sparkles,
    AlertCircle,
    Package,
    Clock,
    Receipt,
    Wrench,
    X,
    CheckCircle2,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        possibleCauses: string[];
        suggestedParts: { name: string; estimatedPrice: number; inStock?: boolean }[];
        repairTimeRange: string;
        estimatedTotalPrice: number;
        riskLevel: "Düşük" | "Orta" | "Yüksek";
        professionalNote?: string;
    } | null;
    deviceInfo: {
        brand: string;
        model: string;
    };
}

export function ServiceAIModal({ isOpen, onClose, data, deviceInfo }: ServiceAIModalProps) {
    if (!data) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-none shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem]">
                <DialogHeader className="p-8 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-xl font-bold tracking-tight">BAŞAR AI Teknik Analiz</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-muted-foreground">
                                {deviceInfo.brand} {deviceInfo.model} için yapay zeka teşhisi
                            </DialogDescription>
                        </div>
                        <Badge className={cn(
                            "ml-auto px-4 py-1.5 rounded-full text-[10px] font-bold border shadow-sm",
                            data.riskLevel === "Yüksek" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                data.riskLevel === "Orta" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}>
                            RİSK: {data.riskLevel.toUpperCase()}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-8 space-y-8">
                        {/* 1. Teşhisler */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                </div>
                                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Olası Teşhisler</h4>
                            </div>
                            <div className="grid gap-3">
                                {data.possibleCauses.map((cause, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:border-blue-500/30 transition-all">
                                        <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed">{cause}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 2. Parçalar */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                    <Package className="h-4 w-4 text-emerald-500" />
                                </div>
                                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Gerekli Malzemeler</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {data.suggestedParts.map((part, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col gap-1 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-bold">{part.name}</span>
                                            {part.inStock !== undefined && (
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] px-2 py-0",
                                                    part.inStock ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-rose-500 border-rose-500/20 bg-rose-500/5"
                                                )}>
                                                    {part.inStock ? "STOKTA" : "YOK"}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">₺{part.estimatedPrice.toLocaleString('tr-TR')}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Profesyonel Not */}
                        {data.professionalNote && (
                            <section className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <ShieldAlert className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Uzman Görüşü</h5>
                                    <p className="text-sm leading-relaxed italic text-blue-700 dark:text-blue-300">
                                        {data.professionalNote}
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-8 bg-muted/30 border-t border-border/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="grid grid-cols-2 gap-8 w-full sm:w-auto">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">İŞ SÜRESİ</span>
                                </div>
                                <span className="text-xl font-bold">{data.repairTimeRange}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PROJE BEDELİ</span>
                                </div>
                                <span className="text-xl font-black text-emerald-500">₺{data.estimatedTotalPrice.toLocaleString('tr-TR')}</span>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-foreground text-background hover:opacity-90 font-bold transition-all"
                        >
                            Anladım
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
