"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyImeiAutoComplete,
  isValidImeiLuhn,
  normalizeImeiDigits,
  type ImeiLookupResult,
} from "@/lib/imei-utils";
import { CameraImeiScanner } from "./CameraImeiScanner";
import { BtkDiagnosticCard } from "./ImeiResultModal";
import { toast } from "sonner";

interface SmartImeiInputProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  variant?: "service" | "buyback" | "default";
  value?: string;
  onChange: (nextImei: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  compact?: boolean;
  showLookupButton?: boolean;
  onLookupComplete?: (result: ImeiLookupResult) => void;
  showInlineCard?: boolean;
}

export function SmartImeiInput({
  id,
  label,
  required = false,
  error,
  variant = "default",
  value = "",
  onChange,
  onBlur,
  placeholder = "15 haneli IMEI (14 hane girince tamamlanır)",
  className,
  inputClassName,
  compact = false,
  showLookupButton = true,
  onLookupComplete,
  showInlineCard = true,
}: SmartImeiInputProps) {
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<ImeiLookupResult | null>(null);

  const digits = normalizeImeiDigits(value);
  const luhnOk = digits.length === 15 && isValidImeiLuhn(digits);
  const luhnBad = digits.length === 15 && !luhnOk;

  const runLookup = async (
    targetImei: string,
    extra?: { challengeId?: string; captchaCode?: string; skipCache?: boolean }
  ) => {
    const clean = normalizeImeiDigits(targetImei);
    if (clean.length < 14) {
      toast.error("BTK sorgusu için en az 14 haneli IMEI girin.");
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await fetch("/api/imei/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei: clean,
          ...extra,
        }),
      });
      const data: ImeiLookupResult = await res.json();
      if (!res.ok) {
        toast.error((data as any)?.error || "IMEI sorgulanamadı.");
        return;
      }

      if (data.imei && data.imei !== digits) {
        onChange(data.imei);
        setAutoCompleted(Boolean(data.autoCompleted15thDigit));
      }

      setLookupResult(data);
      onLookupComplete?.(data);
    } catch {
      toast.error("IMEI sorgulama servisine ulaşılamadı.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const res = applyImeiAutoComplete(digits, e.target.value);
    setAutoCompleted(res.autoCompleted);
    onChange(res.value);
    if (lookupResult && lookupResult.imei !== res.value) {
      setLookupResult(null);
    }
  };

  const handleScanDetected = (scannedImei: string) => {
    const clean = normalizeImeiDigits(scannedImei);
    setAutoCompleted(false);
    onChange(clean);
    if (showLookupButton && clean.length >= 14) {
      void runLookup(clean);
    }
  };

  const isBuyback = variant === "buyback";
  const resolvedInputCls =
    inputClassName ||
    (isBuyback
      ? "bg-background border-border rounded-xl h-11 text-[13px] font-medium text-foreground placeholder:text-muted-foreground/50"
      : variant === "service"
        ? "h-12 md:h-14 bg-card border-border/50 rounded-xl md:rounded-2xl text-sm"
        : "");

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block uppercase tracking-widest pl-0.5 text-muted-foreground",
            isBuyback ? "text-[9px] text-muted-foreground/80" : "text-[10px] font-medium"
          )}
        >
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <Input
            id={id}
            value={digits}
            onChange={handleInputChange}
            onBlur={onBlur}
            maxLength={15}
            inputMode="numeric"
            placeholder={placeholder}
            className={cn(
              "font-mono tabular-nums tracking-wider pr-20",
              luhnOk && "border-emerald-500/40",
              luhnBad && "border-rose-500/40",
              resolvedInputCls
            )}
          />

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {autoCompleted && luhnOk && (
              <Badge
                variant="outline"
                className="h-6 px-1.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hidden sm:inline-flex"
                title={`15. kontrol hanesi (${digits[14]}) otomatik tamamlandı`}
              >
                14+1 ✓
              </Badge>
            )}
            {!autoCompleted && luhnOk && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            {luhnBad && (
              <span title="Geçersiz 15. Luhn kontrol hanesi">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setScannerOpen(true)}
              title="Kamera ile IMEI Tara"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showLookupButton && (
          <Button
            type="button"
            variant="outline"
            disabled={isLookingUp || digits.length < 14}
            onClick={() => runLookup(digits)}
            className={cn(
              "shrink-0 rounded-xl font-bold text-xs gap-1.5 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400",
              compact ? "h-9 px-3" : isBuyback ? "h-11 px-3" : "h-12 md:h-14 px-3.5"
            )}
          >
            {isLookingUp ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">BTK Sorgula</span>
            <span className="sm:hidden">Sorgula</span>
          </Button>
        )}
      </div>

      {error && <p className="text-[10px] text-rose-500 pl-1">{error}</p>}

      {autoCompleted && luhnOk && (
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pl-1">
          14 hane girildi → 15. Luhn kontrol hanesi (<strong>{digits[14]}</strong>) otomatik eklendi.
        </p>
      )}

      {showInlineCard && lookupResult && (
        <BtkDiagnosticCard
          result={lookupResult}
          compact
          isSubmittingCaptcha={isLookingUp}
          onSubmitCaptcha={(code) =>
            runLookup(lookupResult.imei, {
              challengeId: lookupResult.challengeId,
              captchaCode: code,
            })
          }
          onRefreshCaptcha={() => runLookup(lookupResult.imei, { skipCache: true })}
        />
      )}

      <CameraImeiScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleScanDetected}
      />
    </div>
  );
}
