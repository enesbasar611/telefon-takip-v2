"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, RefreshCcw, ScrollText } from "lucide-react";
import { getTechnicalServiceAnalysis } from "@/lib/actions/gemini-actions";
import ReactMarkdown from "react-markdown";

export function TechnicalServiceAnalysisModal() {
    const [open, setOpen] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTechnicalServiceAnalysis();
            if (result.success) {
                setAnalysis(result.analysis || null);
            } else {
                setError(result.error || "Bilinmeyen bir hata oluştu.");
            }
        } catch (err) {
            setError("Analiz sırasında bir bağlantı hatası oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if (v && !analysis) fetchAnalysis();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-blue-200 bg-blue-50/30 text-blue-700 hover:bg-blue-50 transition-all rounded-xl shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">BAŞAR AI Analiz</span>
                    <span className="sm:hidden text-xs">AI Rapor</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-blue-100 shadow-2xl">
                <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-b border-blue-100/50">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-bold text-blue-950 tracking-tight">Teknik Servis Analiz Raporu</DialogTitle>
                                <DialogDescription className="text-xs text-blue-700/60 font-medium uppercase tracking-[0.15em] mt-0.5">
                                    Yapay Zeka Destekli Operasyonel Özet
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse" />
                                <Loader2 className="h-10 w-10 animate-spin text-blue-600 relative z-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-blue-900">Veriler İşleniyor...</p>
                                <p className="text-[11px] text-muted-foreground max-w-[200px]">Son 30 günlük servis kayıtlarınız analiz ediliyor.</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
                            <ScrollText className="h-10 w-10 text-rose-500 opacity-20" />
                            <p className="text-sm font-semibold text-rose-600">{error}</p>
                            <Button variant="link" onClick={fetchAnalysis} className="text-blue-600 font-bold gap-2">
                                <RefreshCcw className="h-4 w-4" /> Tekrar Dene
                            </Button>
                        </div>
                    ) : (
                        <div className="prose prose-blue max-w-none prose-p:text-sm prose-p:leading-relaxed prose-headings:text-blue-900 prose-headings:font-black prose-li:text-sm prose-strong:text-blue-700">
                            <ReactMarkdown>{analysis || ""}</ReactMarkdown>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-end">
                    <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-blue-200">
                        Anladım
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
