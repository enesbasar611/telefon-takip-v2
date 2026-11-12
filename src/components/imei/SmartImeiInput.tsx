"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isValidImeiLuhn,
  normalizeImeiDigits,
  type ImeiLookupResult,
} from "@/lib/imei-utils";
import type { IfreeicloudCheckResult } from "@/lib/ifreeicloud-service";
import { Imei14Plus1Field } from "./Imei14Plus1Field";
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
  onIfreeicloudComplete?: (result: IfreeicloudCheckResult) => void;
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
  onIfreeicloudComplete,
  showInlineCard = true,
}: SmartImeiInputProps) {
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<ImeiLookupResult | null>(null);

  const digits = normalizeImeiDigits(value);
  const luhnOk = digits.length === 15 && isValidImeiLuhn(digits);

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

  const handleFieldChange = (nextImei: string, meta?: { autoCompleted: boolean }) => {
    setAutoCompleted(Boolean(meta?.autoCompleted));
    onChange(nextImei);
    if (lookupResult && lookupResult.imei !== nextImei) {
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
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Imei14Plus1Field
          id={id}
          value={digits}
          onChange={handleFieldChange}
          onBlur={onBlur}
          onOpenScanner={() => setScannerOpen(true)}
          placeholder={placeholder}
          inputClassName={resolvedInputCls}
          plusBoxClassName={resolvedInputCls}
        />

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
          onIfreeicloudResult={onIfreeicloudComplete}
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
