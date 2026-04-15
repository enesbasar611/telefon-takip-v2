"use client";

import { useState, useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Activity, Loader2, CheckCircle2, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { getShopHealthAnalysis } from "@/lib/actions/gemini-actions";
import { useUI } from "@/lib/context/ui-context";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIReport {
    reportTitle: string;
    consultantName: string;
    reportContent: { paragraph: string }[];
}

export function AIAnalyzeModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<AIReport | string | null>(null);
    const { setAiLoading } = useUI();

    useEffect(() => {
        setAiLoading(isPending);
    }, [isPending, setAiLoading]);

    const handleAnalyze = () => {
        startTransition(async () => {
            const result = await getShopHealthAnalysis();
            if (result.success) {
                try {
                    // Try to parse if it's a JSON string
                    const parsed = JSON.parse(result.analysis);
                    setAnalysis(parsed);
                } catch {
                    setAnalysis(result.analysis);
                }
                toast.success("Analiz tamamlandı.");
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleClose = (v: boolean) => {
        onOpenChange(v);
        if (!v) {
            setTimeout(() => setAnalysis(null), 300);
        }
    };

    const renderContent = () => {
        if (!analysis) return null;

        if (typeof analysis === 'string') {
            return (
                <div className="bg-muted/30 border border-border/50 rounded-3xl p-8 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                    {analysis}
                </div>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600/20 via-blue-600/10 to-transparent border border-violet-500/20 p-10 shadow-2xl shadow-violet-500/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
                        <Sparkles className="h-48 w-48 text-violet-500" />
                    </div>

                    <div className="relative z-10 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 px-4 py-1.5 rounded-full w-fit uppercase tracking-[0.3em]">
                            YAPAY ZEKA STRATEJİ RAPORU
                        </span>
                        <h2 className="text-3xl font-black tracking-tighter text-foreground leading-none mt-2">
                            {analysis.reportTitle}
                        </h2>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold opacity-80">
                                Baş Danışman: <span className="text-foreground underline decoration-violet-500/30 underline-offset-4">{analysis.consultantName}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    {analysis.reportContent.map((item, idx) => {
                        const isCritical = item.paragraph.toLowerCase().includes("kritik") || item.paragraph.toLowerCase().includes("acil") || item.paragraph.toLowerCase().includes("risk");
                        const isTip = item.paragraph.toLowerCase().includes("tavsiye") || item.paragraph.toLowerCase().includes("öneri") || item.paragraph.toLowerCase().includes("fırsat");

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "p-6 rounded-[2rem] border transition-all hover:scale-[1.01] active:scale-[0.99] cursor-default group",
                                    isCritical
                                        ? "bg-rose-500/5 border-rose-500/20 shadow-rose-500/5 hover:shadow-rose-500/10"
                                        : isTip
                                            ? "bg-amber-500/5 border-amber-500/20 shadow-amber-500/5 hover:shadow-amber-500/10"
                                            : "bg-card border-border/50 hover:border-violet-500/30 shadow-sm"
                                )}
                            >
                                <div className="flex gap-5">
                                    <div className={cn(
                                        "mt-1 shrink-0 h-12 w-12 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:rotate-12 shadow-sm",
                                        isCritical ? "bg-rose-500/10 text-rose-500" : isTip ? "bg-amber-500/10 text-amber-500" : "bg-violet-500/10 text-violet-500"
                                    )}>
                                        {isCritical ? <AlertTriangle className="h-6 w-6" /> : isTip ? <Lightbulb className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" strokeWidth={2.5} />}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className={cn(
                                            "text-[10px] font-black uppercase tracking-widest opacity-60",
                                            isCritical ? "text-rose-600" : isTip ? "text-amber-600" : "text-violet-600"
                                        )}>
                                            {isCritical ? "Kritik Uyarı" : isTip ? "Stratejik Öneri" : "Verimlilik Analizi"}
                                        </h4>
                                        <p className="text-sm font-medium leading-relaxed text-foreground/80 md:text-base">
                                            {item.paragraph}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[750px] bg-background border border-border text-foreground p-0 shadow-2xl overflow-hidden leading-relaxed rounded-[2rem]">
                <DialogHeader className="p-8 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Activity className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <DialogTitle className="font-bold text-2xl tracking-tight">Dükkan Verimlilik Analizi</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-xs text-muted-foreground font-medium">
                                    BAŞAR AI: Canlı Envanter & Finans Danışmanı
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {!analysis ? (
                        <div className="bg-muted/20 border border-dashed border-border/60 rounded-[2rem] p-12 text-center space-y-4">
                            <div className="relative mx-auto w-20 h-20">
                                <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
                                <Sparkles className="relative h-20 w-20 text-violet-500 mx-auto" strokeWidth={1} />
                            </div>
                            <h3 className="font-bold text-xl text-foreground">Analize Hazırız</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                Gemini 2.5 Flash motoru tüm envanterinizi, satış hızınızı ve finansal sağlığınızı saniyeler içinde tarayıp size özel rapor hazırlayacak.
                            </p>
                            <Button
                                onClick={handleAnalyze}
                                disabled={isPending}
                                className="mt-4 w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-violet-500/20 active:scale-[0.98] transition-all gap-3"
                            >
                                {isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Veriler İşleniyor...</> : <><Sparkles className="h-5 w-5" /> Analizi Başlat</>}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {renderContent()}

                            <div className="p-5 bg-muted/30 border border-border/50 rounded-2xl flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center mt-0.5">
                                    <CheckCircle2 className="h-3 w-3 text-violet-500" />
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                    Bu analiz son 30 günlük verileriniz baz alınarak üretilmiştir. Sektörel değişimler ve anlık piyasa koşulları analiz dışı kalabilir. Hiçbir analiz yatırım tavsiyesi niteliği taşımaz.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setAnalysis(null)}
                                className="w-full h-12 rounded-xl border-border/50 hover:bg-muted font-semibold"
                            >
                                Yeni Analiz Yap
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
