"use client";

import { useState, useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Activity, Loader2, CheckCircle2 } from "lucide-react";
import { getShopHealthAnalysis } from "@/lib/actions/gemini-actions";
import { useUI } from "@/lib/context/ui-context";
import { useEffect } from "react";

export function AIAnalyzeModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const { setAiLoading } = useUI();

    useEffect(() => {
        setAiLoading(isPending);
    }, [isPending, setAiLoading]);

    const handleAnalyze = () => {
        startTransition(async () => {
            const result = await getShopHealthAnalysis();
            if (result.success) {
                setAnalysis(result.analysis);
                toast.success("Analiz tamamlandı.");
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleClose = (v: boolean) => {
        onOpenChange(v);
        if (!v) {
            // Reset after a delay when closing
            setTimeout(() => setAnalysis(null), 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] bg-[#111111] border border-[#333333] text-white p-0 shadow-2xl overflow-hidden leading-relaxed">
                <DialogHeader className="p-6 pb-4 border-b border-[#222]">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <DialogTitle className="text-lg font-bold tracking-tight">Finans & Stok Analizi</DialogTitle>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                BAŞAR AI: Sistemin genel sağlığını anında analiz edin.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                    {!analysis ? (
                        <div className="bg-[#18181A] border border-[#222222] rounded-xl p-8 text-center">
                            <Sparkles className="h-10 w-10 text-violet-500 mx-auto mb-4 opacity-50" />
                            <h3 className="text-sm font-bold text-slate-300 mb-2">Dükkan Analizine Hazır</h3>
                            <p className="text-[12px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Gemini AI tüm envanter hareketlerinizi ve kritik stok seviyelerini inceleyip size özel yönetici tavsiyeleri sunacak.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                                <CheckCircle2 className="h-3 w-3" />
                                BAŞAR AI Analiz Raporu
                            </div>
                            <div className="bg-[#18181A] border border-[#333] rounded-xl p-6 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed shadow-inner">
                                {analysis}
                            </div>
                            <div className="p-4 bg-violet-600/5 border border-violet-600/20 rounded-lg">
                                <p className="text-[11px] text-violet-400/80 italic">
                                    Not: Bu analiz dükkanınızdaki mevcut verilere göre üretilmiştir. Yatırım tavsiyesi değildir.
                                </p>
                            </div>
                        </div>
                    )}

                    {!analysis && (
                        <Button
                            onClick={handleAnalyze}
                            disabled={isPending}
                            className="w-full h-12 bg-violet-600 hover:bg-violet-700 font-bold text-white transition-all shadow-lg active:scale-[0.98]"
                        >
                            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Veriler Toplanıyor...</> : <><Sparkles className="h-4 w-4 mr-2" /> Analizi Hemen Başlat</>}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
