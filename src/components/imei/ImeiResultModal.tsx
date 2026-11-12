"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  ShoppingBag,
  Wrench,
  Calendar,
  Hash,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImeiLookupResult } from "@/lib/imei-utils";

interface BtkDiagnosticCardProps {
  result: ImeiLookupResult;
  compact?: boolean;
  isSubmittingCaptcha?: boolean;
  onSubmitCaptcha?: (captchaCode: string) => void;
  onRefreshCaptcha?: () => void;
}

export function BtkDiagnosticCard({
  result,
  compact = false,
  isSubmittingCaptcha = false,
  onSubmitCaptcha,
  onRefreshCaptcha,
}: BtkDiagnosticCardProps) {
  const [captchaInput, setCaptchaInput] = useState("");
  const classification = result.btk?.classification;

  const statusBannerConfig = (() => {
    if (classification === "KAYITLI") {
      return {
        label: "✓ BTK KAYITLI CİHAZ",
        wrapper:
          "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
        badge: "bg-emerald-600 text-white",
        icon: ShieldCheck,
      };
    }
    if (classification === "KLONLU") {
      return {
        label: "🚨 KLONLANMIŞ / KARA LİSTE UYARISI",
        wrapper: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300",
        badge: "bg-amber-500 text-black",
        icon: AlertTriangle,
      };
    }
    if (classification === "KAYITSIZ") {
      return {
        label: "⚠️ BTK KAYITSIZ (YURTDIŞI / KAYIT DIŞI)",
        wrapper: "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300",
        badge: "bg-rose-600 text-white",
        icon: ShieldAlert,
      };
    }
    return null;
  })();

  const handleCaptchaSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!captchaInput.trim() || !onSubmitCaptcha) return;
    onSubmitCaptcha(captchaInput.trim());
  };

  return (
    <div className="space-y-3">
      {/* Hero Status Banner */}
      {statusBannerConfig && (
        <div
          className={cn(
            "rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2",
            statusBannerConfig.wrapper
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <statusBannerConfig.icon className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black tracking-tight">
                {statusBannerConfig.label}
              </p>
              {result.btk?.durum && (
                <p className="text-[11px] opacity-90 font-medium mt-0.5 leading-snug">
                  {result.btk.durum}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {result.cached && (
              <Badge variant="outline" className="text-[10px] font-bold bg-background/60">
                Önbellek (0ms)
              </Badge>
            )}
            <Badge className={cn("text-[10px] font-black", statusBannerConfig.badge)}>
              {classification}
            </Badge>
          </div>
        </div>
      )}

      {/* Human-in-the-loop e-Devlet CAPTCHA Verification */}
      {result.btkPendingCaptcha && result.captchaImageDataUrl && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                e-Devlet Güvenlik Kodu Doğrulaması
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-200/80">
                Resmi BTK sonucunu getirmek için görseldeki güvenlik kodunu yazın.
              </p>
            </div>
            <a
              href="https://www.turkiye.gov.tr/imei-sorgulama"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              e-Devlet&apos;te Aç <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="bg-white rounded-xl p-1.5 border border-border flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.captchaImageDataUrl}
                alt="e-Devlet Güvenlik Kodu"
                className="h-10 w-auto object-contain rounded"
              />
            </div>

            <div className="flex items-center gap-2 flex-1">
              <Input
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCaptchaSubmit();
                  }
                }}
                placeholder="Güvenlik kodunu girin..."
                className="h-10 bg-background font-mono tracking-widest text-sm uppercase"
                autoComplete="off"
              />
              <Button
                type="button"
                size="sm"
                disabled={isSubmittingCaptcha || !captchaInput.trim()}
                onClick={() => handleCaptchaSubmit()}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0"
              >
                {isSubmittingCaptcha ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Doğrula"
                )}
              </Button>
              {onRefreshCaptcha && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={isSubmittingCaptcha}
                  onClick={() => {
                    setCaptchaInput("");
                    onRefreshCaptcha();
                  }}
                  title="Kodu Yenile"
                  className="h-10 w-10 rounded-xl shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BTK Error / Fallback Info */}
      {result.btkError && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3.5 py-2.5 flex items-center justify-between gap-2 flex-wrap text-xs text-amber-700 dark:text-amber-300">
          <span>{result.btkError}</span>
          <a
            href="https://www.turkiye.gov.tr/imei-sorgulama"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            e-Devlet&apos;te Aç <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* BTK Official Details Card */}
      {result.btk && (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              BTK Resmi Kayıt Bilgileri
            </span>
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
              {result.btk.imei}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl bg-muted/40 p-2.5">
              <span className="text-[10px] text-muted-foreground block">Durum</span>
              <span className="font-semibold text-foreground">{result.btk.durum}</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-2.5">
              <span className="text-[10px] text-muted-foreground block">Kaynak</span>
              <span className="font-semibold text-foreground">{result.btk.kaynak}</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-2.5">
              <span className="text-[10px] text-muted-foreground block">Sorgu Tarihi</span>
              <span className="font-semibold text-foreground">{result.btk.sorguTarihi}</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-2.5">
              <span className="text-[10px] text-muted-foreground block">Marka / Model</span>
              <span className="font-semibold text-foreground">
                {result.btk.markaModel || `${result.brand || "-"} ${result.model || ""}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Apple / Device Extended Card (iFreeiCloud Style) */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-blue-500/5 p-3.5 sm:p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <Smartphone className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                {result.appleSpecs?.modelName ||
                  ([result.brand, result.model].filter(Boolean).join(" ") ||
                    "Bilinmeyen TAC / Cihaz")}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Hash className="h-3 w-3" /> TAC: {result.tac}
                </span>
                {result.appleSpecs?.modelCode && (
                  <span className="font-semibold text-blue-500">
                    Kod: {result.appleSpecs.modelCode}
                  </span>
                )}
                {result.tacMatch?.releaseYear && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {result.tacMatch.releaseYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold gap-1",
                result.luhnValid
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-500"
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              {result.luhnValid ? "Luhn Geçerli" : "Luhn Geçersiz"}
            </Badge>
            {result.autoCompleted15thDigit && (
              <span className="text-[9px] text-blue-500 font-semibold">
                15. hane otomatik tamamlandı
              </span>
            )}
          </div>
        </div>

        {result.appleSpecs && !compact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
            {result.appleSpecs.chipset && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>İşlemci: <strong className="text-foreground">{result.appleSpecs.chipset}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Kapasite: <strong className="text-foreground">{result.appleSpecs.storageOptions.join(" / ")}</strong></span>
            </div>
            <div className="sm:col-span-2 text-muted-foreground">
              <span>Renk Seçenekleri: <strong className="text-foreground">{result.appleSpecs.colorOptions.join(", ")}</strong></span>
            </div>
            <div className="sm:col-span-2 text-muted-foreground">
              <span>Donanım Bölgesi: <strong className="text-foreground">{result.appleSpecs.hardwareRegionNote}</strong></span>
            </div>
          </div>
        )}

        {result.appleSpecs && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <p className="text-blue-700 dark:text-blue-300 leading-snug">
              <strong>iCloud / FMI Uyarısı:</strong> {result.appleSpecs.fmiReminder}
            </p>
            <a
              href={result.appleSpecs.warrantyCheckUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              Apple Garanti <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

interface ImeiResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImeiLookupResult | null;
  isLoading?: boolean;
  onSubmitCaptcha?: (captchaCode: string) => void;
  onRefreshCaptcha?: () => void;
  hideQuickActions?: boolean;
}

export function ImeiResultModal({
  open,
  onOpenChange,
  result,
  isLoading = false,
  onSubmitCaptcha,
  onRefreshCaptcha,
  hideQuickActions = false,
}: ImeiResultModalProps) {
  const router = useRouter();

  const buildQueryString = () => {
    if (!result) return "";
    const params = new URLSearchParams();
    params.set("imei", result.imei);
    if (result.brand) params.set("brand", result.brand);
    if (result.model) params.set("model", result.model);
    if (result.btk?.classification) params.set("btkStatus", result.btk.classification);
    return params.toString();
  };

  const handleOpenService = () => {
    const qs = buildQueryString();
    onOpenChange(false);
    router.push(`/servis/yeni?${qs}`);
  };

  const handleOpenBuyback = () => {
    const qs = buildQueryString();
    onOpenChange(false);
    router.push(`/cihaz-listesi?newDevice=1&${qs}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background border-border rounded-none sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            IMEI & BTK Cihaz Analizi
          </DialogTitle>
          <DialogDescription className="text-xs">
            GSMA Luhn doğrulaması, TAC cihaz kimliği ve e-Devlet BTK kayıt durumu
          </DialogDescription>
        </DialogHeader>

        {isLoading && !result ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-xs text-muted-foreground">IMEI ve BTK verileri sorgulanıyor...</p>
          </div>
        ) : result ? (
          <div className="space-y-4 mt-1">
            <BtkDiagnosticCard
              result={result}
              isSubmittingCaptcha={isLoading}
              onSubmitCaptcha={onSubmitCaptcha}
              onRefreshCaptcha={onRefreshCaptcha}
            />

            {!hideQuickActions && (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  onClick={handleOpenService}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2"
                >
                  <Wrench className="h-4 w-4" />
                  Bu Cihazla Servis Kaydı Aç
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenBuyback}
                  className="flex-1 h-11 rounded-xl font-bold text-xs gap-2"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-500" />
                  Cihaz Alımına Aktar
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

