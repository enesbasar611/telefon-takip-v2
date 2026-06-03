"use client";

import { useFormContext } from "react-hook-form";
import {
    Sparkles,
    Zap,
    AlertCircle,
    Loader2,
    Clock,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AIDiagnosticResult {
    identifiedProblem: string;
    requiredParts: string;
    estimatedTime: string;
}

interface AIDiagnosticPanelProps {
    isDiagnosticPending: boolean;
    diagnosticResult: AIDiagnosticResult | null;
    onAnalyze: () => void;
}

export function AIDiagnosticPanel({
    isDiagnosticPending,
    diagnosticResult,
    onAnalyze
}: AIDiagnosticPanelProps) {
    const { register, watch, formState: { errors } } = useFormContext();
    const problemDesc = watch("problemDesc");

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
                            errors.problemDesc ? "border-destructive/40 bg-destructive/5" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
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

            {/* AI Diagnostic Result Display */}
            {diagnosticResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-700">
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/10 p-4 rounded-3xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">MUHTEMEL SORUN</span>
                        </div>
                        <p className="text-xs font-black text-emerald-100">{diagnosticResult.identifiedProblem}</p>
                    </div>
                    <div className="bg-primary/[0.03] border border-primary/10 p-4 rounded-3xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-primary" />
                            <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">GEREKLİ PARÇA</span>
                        </div>
                        <p className="text-xs font-black text-primary-100">{diagnosticResult.requiredParts}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">ÖNGÖRÜLEN SÜRE</span>
                        </div>
                        <p className="text-xs font-black text-white/80">{diagnosticResult.estimatedTime}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
