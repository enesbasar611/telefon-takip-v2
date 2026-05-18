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
  type LucideIcon,
} from "lucide-react";
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
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-primary/20 bg-primary/5 text-primary shadow-sm transition-all hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">BAŞAR AI Analiz</span>
          <span className="sm:hidden text-xs">AI Rapor</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden rounded-[2rem] border border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/12 via-sky-500/8 to-background p-6 md:p-7">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary p-2 shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  Teknik Servis Analizi
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs font-medium uppercase tracking-[0.15em] text-primary/80">
                  Kısa operasyon özeti
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[58vh] overflow-y-auto bg-muted/20 p-4 md:p-6">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-primary opacity-20 blur-2xl" />
                <Loader2 className="relative z-10 h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Veriler işleniyor...</p>
                <p className="max-w-[220px] text-[11px] text-muted-foreground">
                  Son 30 günlük servis kayıtları kısa özete çevriliyor.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <ScrollText className="h-10 w-10 text-rose-500 opacity-30" />
              <p className="text-sm font-semibold text-rose-600">{error}</p>
              <Button variant="link" onClick={fetchAnalysis} className="gap-2 font-bold text-primary">
                <RefreshCcw className="h-4 w-4" /> Tekrar Dene
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryPill icon={TrendingUp} label="Operasyon" />
                <SummaryPill icon={CheckCircle2} label="Durum" />
                <SummaryPill icon={Lightbulb} label="Aksiyon" />
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm md:p-5">
                <ReactMarkdown components={markdownComponents}>
                  {trimAnalysis(analysis || "")}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border/60 bg-background/80 p-4">
          <Button
            onClick={() => setOpen(false)}
            className="h-11 rounded-xl bg-primary px-8 font-bold text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90"
          >
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function trimAnalysis(value: string) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^sayın|^başar ai|^teknik servis analiz raporu/i.test(line));

  return lines.slice(0, 18).join("\n");
}

function SummaryPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </div>
  );
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h3 className="mb-3 text-base font-black tracking-tight text-foreground">{children}</h3>
  ),
  h2: ({ children }: any) => (
    <h3 className="mb-3 text-base font-black tracking-tight text-foreground">{children}</h3>
  ),
  h3: ({ children }: any) => (
    <h4 className="mb-2 mt-4 text-sm font-black uppercase tracking-[0.12em] text-primary">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="mb-3 text-sm leading-6 text-muted-foreground">{children}</p>
  ),
  strong: ({ children }: any) => <strong className="font-black text-foreground">{children}</strong>,
  ul: ({ children }: any) => <ul className="mb-3 grid gap-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 grid gap-2">{children}</ol>,
  li: ({ children }: any) => (
    <li className="flex gap-2 rounded-2xl border border-border/50 bg-muted/35 px-3 py-2 text-sm leading-5 text-foreground">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="[&>p]:m-0">{children}</span>
    </li>
  ),
  hr: () => <div className="my-4 h-px bg-border/70" />,
  code: ({ children }: any) => (
    <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
      {children}
    </code>
  ),
};
