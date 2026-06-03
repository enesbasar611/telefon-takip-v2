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
import {
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCcw,
  ScrollText,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { getTechnicalServiceAnalysis } from "@/lib/actions/gemini-actions";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

export function TechnicalServiceAnalysisModal({ trigger }: { trigger?: React.ReactNode }) {
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
    } catch {
      setError("Analiz sırasında bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value && !analysis) fetchAnalysis();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="group relative h-11 gap-2 overflow-hidden rounded-xl border-white/5 bg-slate-900/40 px-6 backdrop-blur-xl transition-all hover:bg-slate-900/60"
          >
            <BorderBeam duration={6} size={100} className="opacity-40" />
            <Sparkles className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase">BAŞAR AI ANALİZ</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl overflow-hidden border-none bg-transparent p-0 shadow-none outline-none ring-0 focus:ring-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-h-[85vh] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0B0C10] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
        >
          {/* Header Section */}
          <div className="relative border-b border-white/[0.06] bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent p-8">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
            </div>

            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse bg-blue-500 opacity-20 blur-xl" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
                    <BrainCircuit className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-black tracking-tight text-white md:text-3xl">
                    Servis Yönetim Analizi
                  </DialogTitle>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                    Başar AI Stratejik Rapor Modülü
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content Area */}
          <div className="max-h-[55vh] overflow-y-auto bg-black/20 p-6 md:p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-64 flex-col items-center justify-center gap-6 text-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 animate-spin bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-2xl rounded-full" />
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 border border-white/10 shadow-2xl">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-white/90 uppercase tracking-widest">Veriler İşleniyor</h4>
                    <p className="max-w-[280px] text-[11px] leading-relaxed text-slate-400 font-medium">
                      Son 30 günlük servis verileri analiz ediliyor ve stratejik aksiyon planı oluşturuluyor...
                    </p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-64 flex-col items-center justify-center gap-4 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <ScrollText className="h-8 w-8 text-rose-500" />
                  </div>
                  <p className="text-sm font-bold text-rose-400">{error}</p>
                  <Button
                    variant="outline"
                    onClick={fetchAnalysis}
                    className="h-10 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-xs"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Yeniden Dene
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-3 gap-3">
                    <SummaryPill icon={TrendingUp} label="OPERASYON" color="text-blue-400" />
                    <SummaryPill icon={Wrench} label="TEKNİK" color="text-purple-400" />
                    <SummaryPill icon={Lightbulb} label="STRATEJİ" color="text-emerald-400" />
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="rounded-3xl border border-white/[0.05] bg-white/[0.02] p-6 shadow-inner ring-1 ring-white/[0.05]">
                      <ReactMarkdown components={markdownComponents}>
                        {analysis || ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.06] bg-slate-950/50 p-6 px-10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">SİSTEM ÇEVRİMİÇİ</span>
            </div>
            <Button
              onClick={() => setOpen(false)}
              className="h-12 min-w-[140px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-xs font-black tracking-widest text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              ANLADIM
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryPill({ icon: Icon, label, color }: { icon: LucideIcon; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.02] py-4 transition-all hover:bg-white/[0.05] hover:border-white/10 group">
      <div className={cn("p-2 rounded-xl bg-slate-900 group-hover:scale-110 transition-all shadow-lg border border-white/5", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
        {label}
      </span>
    </div>
  );
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h3 className="mb-4 text-lg font-black tracking-tight text-white/90 underline decoration-blue-500/30 underline-offset-8 decoration-2">{children}</h3>
  ),
  h2: ({ children }: any) => (
    <h3 className="mb-4 text-lg font-black tracking-tight text-white/90 underline decoration-blue-500/30 underline-offset-8 decoration-2">{children}</h3>
  ),
  h3: ({ children }: any) => (
    <h4 className="mb-3 mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400">
      <span className="h-px flex-1 bg-blue-500/20" />
      {children}
      <span className="h-px flex-1 bg-blue-500/20" />
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="mb-4 text-[13px] leading-relaxed text-slate-400 font-medium">{children}</p>
  ),
  strong: ({ children }: any) => <strong className="font-black text-white">{children}</strong>,
  ul: ({ children }: any) => <ul className="mb-6 space-y-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-6 space-y-2">{children}</ol>,
  li: ({ children }: any) => (
    <li className="relative flex items-start gap-3 rounded-2xl border border-white/[0.03] bg-white/[0.01] px-4 py-3 text-[13px] leading-relaxed text-slate-300 transition-all hover:bg-white/[0.03]">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      <div className="[&>p]:m-0">{children}</div>
    </li>
  ),
  hr: () => <div className="my-6 h-px bg-white/[0.06]" />,
  code: ({ children }: any) => (
    <code className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-black text-blue-400 border border-blue-500/20">
      {children}
    </code>
  ),
};
