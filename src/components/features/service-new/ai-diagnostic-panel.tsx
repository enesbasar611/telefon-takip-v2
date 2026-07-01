"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
    Sparkles,
    Zap,
    AlertCircle,
    Loader2,
    Clock,
    Package,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Plus,
    AlertTriangle,
    FileText,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AIDiagnosticResult } from "@/lib/actions/gemini-actions";

interface AIDiagnosticPanelProps {
    isDiagnosticPending: boolean;
    diagnosticResult: AIDiagnosticResult | null;
    onAnalyze: () => void;
    onAddPartToStock?: (partName: string, estimatedPrice: number) => void;
}

type ModalType = "problem" | "parts" | "time" | null;

const riskConfig = {
    "Düşük": { 
        color: "text-emerald-700 dark:text-emerald-400", 
        bg: "bg-emerald-50 dark:bg-emerald-500/10", 
        border: "border-emerald-200 dark:border-emerald-500/20", 
        icon: CheckCircle2 
    },
    "Orta": { 
        color: "text-amber-700 dark:text-amber-400", 
        bg: "bg-amber-50 dark:bg-amber-500/10", 
        border: "border-amber-200 dark:border-amber-500/20", 
        icon: AlertTriangle 
    },
    "Yüksek": { 
        color: "text-rose-700 dark:text-rose-400", 
        bg: "bg-rose-50 dark:bg-rose-500/10", 
        border: "border-rose-200 dark:border-rose-500/20", 
        icon: ShieldAlert 
    },
};

export function AIDiagnosticPanel({
    isDiagnosticPending,
    diagnosticResult,
    onAnalyze,
    onAddPartToStock
}: AIDiagnosticPanelProps) {
    const { register, watch, formState: { errors } } = useFormContext();
    const problemDesc = watch("problemDesc");
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const risk = diagnosticResult?.riskLevel || "Düşük";
    const riskStyle = riskConfig[risk] || riskConfig["Düşük"];
    const RiskIcon = riskStyle.icon;

    return (
        <div className="space-y-4">
            {/* Problem Description with AI Trigger */}
            <div className="space-y-3 group">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] transition-colors group-hover:text-primary">
                        ARIZA TANIMI & TEŞHİS
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onAnalyze}
                        disabled={isDiagnosticPending || !problemDesc}
                        className={cn(
                            "h-8 rounded-full gap-2 px-4 transition-all duration-500",
                            problemDesc && !isDiagnosticPending
                                ? "text-primary hover:bg-primary/10 hover:scale-105 active:scale-95"
                                : "text-muted-foreground/30"
                        )}
                    >
                        {isDiagnosticPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Sparkles className={cn("h-3 w-3", problemDesc && "animate-pulse text-primary")} />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isDiagnosticPending ? "AI ÇALIŞIYOR..." : "BAŞAR AI ANALİZ"}
                        </span>
                    </Button>
                </div>

                <div className="relative">
                    <Textarea
                        {...register("problemDesc")}
                        placeholder="Cihazın sorununu detaylıca açıklayın..."
                        className={cn(
                            "min-h-[140px] rounded-3xl resize-none p-5 transition-all duration-300 leading-relaxed text-sm",
                            errors.problemDesc 
                                ? "border-destructive/40 bg-destructive/5" 
                                : "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                        )}
                    />
                    {errors.problemDesc && (
                        <div className="absolute right-4 bottom-4 flex items-center gap-1.5 text-destructive animate-in fade-in zoom-in">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase">Gereklidir</span>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Result Buttons */}
            {diagnosticResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-top-4 duration-700">
                    {/* Muhtemel Sorun Button */}
                    <button
                        type="button"
                        onClick={() => setActiveModal("problem")}
                        className="group/btn relative bg-emerald-50 dark:bg-emerald-500/[0.08] hover:bg-emerald-100/90 dark:hover:bg-emerald-500/[0.15] border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl space-y-2 text-left transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-[9px] font-black text-emerald-800 dark:text-emerald-400/90 uppercase tracking-widest">MUHTEMEL SORUN</span>
                        </div>
                        <p className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200/90 line-clamp-2 leading-relaxed">
                            {diagnosticResult.possibleCauses?.[0] || "Analiz tamamlandı"}
                        </p>
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-500/40 group-hover/btn:text-emerald-800 dark:group-hover/btn:text-emerald-400 transition-colors">
                            <span className="text-[8px] font-black uppercase tracking-widest">Detay Gör</span>
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </button>

                    {/* Gerekli Parça Button */}
                    <button
                        type="button"
                        onClick={() => setActiveModal("parts")}
                        className="group/btn relative bg-blue-50 dark:bg-blue-500/[0.08] hover:bg-blue-100/90 dark:hover:bg-blue-500/[0.15] border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl space-y-2 text-left transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-[9px] font-black text-blue-800 dark:text-blue-400/90 uppercase tracking-widest">GEREKLİ PARÇA</span>
                        </div>
                        <p className="text-[11px] font-bold text-blue-950 dark:text-blue-200/90 line-clamp-2 leading-relaxed">
                            {diagnosticResult.suggestedParts?.length
                                ? `${diagnosticResult.suggestedParts.length} parça önerisi`
                                : "Parça bilgisi yok"
                            }
                        </p>
                        <div className="flex items-center gap-1 text-blue-700 dark:text-blue-500/40 group-hover/btn:text-blue-800 dark:group-hover/btn:text-blue-400 transition-colors">
                            <span className="text-[8px] font-black uppercase tracking-widest">Detay Gör</span>
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </button>

                    {/* Öngörülen Süre Button */}
                    <button
                        type="button"
                        onClick={() => setActiveModal("time")}
                        className="group/btn relative bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 p-4 rounded-2xl space-y-2 text-left transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                <Clock className="h-3.5 w-3.5 text-slate-600 dark:text-muted-foreground/60" />
                            </div>
                            <span className="text-[9px] font-black text-slate-700 dark:text-slate-400/90 uppercase tracking-widest">ÖNGÖRÜLEN SÜRE</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200/90 line-clamp-2 leading-relaxed">
                            {diagnosticResult.repairTimeRange || "Süre bilgisi yok"}
                        </p>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-muted-foreground/30 group-hover/btn:text-slate-700 dark:group-hover/btn:text-muted-foreground/50 transition-colors">
                            <span className="text-[8px] font-black uppercase tracking-widest">Detay Gör</span>
                            <ArrowRight className="h-3 w-3" />
                        </div>
                    </button>
                </div>
            )}

            {/* ======= MODALS ======= */}

            {/* Muhtemel Sorun Modal */}
            <Dialog open={activeModal === "problem"} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121316] text-slate-900 dark:text-slate-100 shadow-2xl">
                    <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-gradient-to-br from-emerald-500/[0.04] to-transparent">
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                                    <Zap className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Muhtemel Sorunlar</DialogTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400/80 font-medium mt-1">AI tarafından tespit edilen olası arıza nedenleri</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                        {/* Risk Level */}
                        <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", riskStyle.bg, riskStyle.border)}>
                            <RiskIcon className={cn("h-5 w-5", riskStyle.color)} />
                            <div>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", riskStyle.color)}>Risk Seviyesi</span>
                                <p className={cn("text-sm font-black", riskStyle.color)}>{risk}</p>
                            </div>
                        </div>

                        {/* Possible Causes */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-slate-500 dark:text-muted-foreground/50 uppercase tracking-widest">Olası Nedenler</span>
                            <div className="space-y-2">
                                {diagnosticResult?.possibleCauses?.map((cause, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                                        <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">{idx + 1}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{cause}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Professional Note */}
                        {diagnosticResult?.professionalNote && (
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-800 dark:text-blue-400/70 uppercase tracking-widest">Teknik Tavsiye</span>
                                </div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200/80 leading-relaxed">{diagnosticResult.professionalNote}</p>
                            </div>
                        )}

                        {/* Summary Report */}
                        {(diagnosticResult as any)?.summaryReport && (
                            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-800 dark:text-purple-400/70 uppercase tracking-widest">Analiz Özeti</span>
                                </div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-200/80 leading-relaxed">{(diagnosticResult as any).summaryReport}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setActiveModal(null)}
                            className="w-full h-12 rounded-xl text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs uppercase tracking-widest"
                        >
                            Kapat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Gerekli Parça Modal */}
            <Dialog open={activeModal === "parts"} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121316] text-slate-900 dark:text-slate-100 shadow-2xl">
                    <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-gradient-to-br from-blue-500/[0.04] to-transparent">
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                                    <Package className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Gerekli Parçalar</DialogTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400/80 font-medium mt-1">Tamir için gereken parçalar ve stok durumları</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                        {diagnosticResult?.suggestedParts?.map((part, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all",
                                    part.inStock
                                        ? "bg-emerald-50/50 dark:bg-emerald-500/[0.03] border-emerald-200 dark:border-emerald-500/15"
                                        : "bg-rose-50/50 dark:bg-rose-500/[0.03] border-rose-200 dark:border-rose-500/15"
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            {part.inStock ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                            )}
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{part.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 pl-6">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black border px-2 py-0.5",
                                                part.inStock
                                                    ? "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-100/50 dark:bg-emerald-500/10"
                                                    : "text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 bg-rose-100/50 dark:bg-rose-500/10"
                                            )}>
                                                {part.inStock ? "STOKTA VAR" : "STOKTA YOK"}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-600 dark:text-muted-foreground">
                                                ~₺{part.estimatedPrice?.toLocaleString("tr-TR")}
                                            </span>
                                        </div>
                                        {part.alternative && !part.inStock && (
                                            <div className="pl-6 mt-1">
                                                <span className="text-[10px] text-amber-700 dark:text-amber-400/90 font-medium">
                                                    💡 Alternatif: <span className="font-bold text-amber-600 dark:text-amber-300">{part.alternative}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add to Stock Button for out-of-stock parts */}
                                    {!part.inStock && onAddPartToStock && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onAddPartToStock(part.name, part.estimatedPrice)}
                                            className="h-9 px-3 rounded-xl text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 gap-1.5 shrink-0"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span className="text-[9px] font-black uppercase">Stok Ekle</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(!diagnosticResult?.suggestedParts || diagnosticResult.suggestedParts.length === 0) && (
                            <div className="py-12 text-center space-y-3">
                                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto">
                                    <Package className="h-6 w-6 text-slate-400 dark:text-muted-foreground/30" />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-muted-foreground/50 font-medium">Parça önerisi bulunamadı</p>
                            </div>
                        )}

                        {/* Summary: Total Parts Cost */}
                        {diagnosticResult?.suggestedParts && diagnosticResult.suggestedParts.length > 0 && (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 mt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 dark:text-muted-foreground/50 uppercase tracking-widest">Toplam Parça Maliyeti</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                        ₺{diagnosticResult.suggestedParts.reduce((sum, p) => sum + (p.estimatedPrice || 0), 0).toLocaleString("tr-TR")}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setActiveModal(null)}
                            className="w-full h-12 rounded-xl text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs uppercase tracking-widest"
                        >
                            Kapat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Öngörülen Süre Modal */}
            <Dialog open={activeModal === "time"} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121316] text-slate-900 dark:text-slate-100 shadow-2xl">
                    <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-gradient-to-br from-slate-500/[0.04] to-transparent">
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center ring-1 ring-slate-200 dark:ring-white/10">
                                    <Clock className="h-7 w-7 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Öngörülen Süre & Maliyet</DialogTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400/80 font-medium mt-1">Tahmini tamir süresi ve işçilik detayları</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Repair Time */}
                        <div className="text-center p-8 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-3">
                            <Clock className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto" />
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{diagnosticResult?.repairTimeRange || "-"}</p>
                            <span className="text-[10px] font-black text-slate-500 dark:text-muted-foreground/40 uppercase tracking-widest">Tahmini Tamir Süresi</span>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                                <span className="text-xs font-bold text-slate-600 dark:text-muted-foreground">İşçilik Ücreti</span>
                                <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">₺{(diagnosticResult?.estimatedLaborPrice || 0).toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                                <span className="text-xs font-bold text-slate-600 dark:text-muted-foreground">Parça Maliyeti</span>
                                <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                                    ₺{(diagnosticResult?.suggestedParts?.reduce((sum, p) => sum + (p.estimatedPrice || 0), 0) || 0).toLocaleString("tr-TR")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15">
                                <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">Toplam Tahmini</span>
                                <span className="text-2xl font-black text-blue-700 dark:text-blue-400 tabular-nums">₺{(diagnosticResult?.estimatedTotalPrice || 0).toLocaleString("tr-TR")}</span>
                            </div>
                        </div>

                        {/* Risk Level Indicator */}
                        <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", riskStyle.bg, riskStyle.border)}>
                            <RiskIcon className={cn("h-5 w-5", riskStyle.color)} />
                            <div>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", riskStyle.color)}>Risk Seviyesi</span>
                                <p className={cn("text-sm font-black", riskStyle.color)}>{risk}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setActiveModal(null)}
                            className="w-full h-12 rounded-xl text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs uppercase tracking-widest"
                        >
                            Kapat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
