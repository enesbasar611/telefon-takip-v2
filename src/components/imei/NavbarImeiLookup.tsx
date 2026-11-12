"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import {
  isValidImeiLuhn,
  normalizeImeiDigits,
  type ImeiLookupResult,
} from "@/lib/imei-utils";
import { Imei14Plus1Field } from "./Imei14Plus1Field";
import { CameraImeiScanner } from "./CameraImeiScanner";
import { ImeiResultModal } from "./ImeiResultModal";
import { toast } from "sonner";

export function NavbarImeiLookup() {
  const [imeiValue, setImeiValue] = useState("");
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<ImeiLookupResult | null>(null);

  const digits = normalizeImeiDigits(imeiValue);
  const luhnOk = digits.length === 15 && isValidImeiLuhn(digits);

  const handleFieldChange = (nextImei: string, meta?: { autoCompleted: boolean }) => {
    setAutoCompleted(Boolean(meta?.autoCompleted));
    setImeiValue(nextImei);
  };

  const executeLookup = async (
    targetImei: string,
    extra?: { challengeId?: string; captchaCode?: string; skipCache?: boolean }
  ) => {
    const clean = normalizeImeiDigits(targetImei);
    if (clean.length < 14) {
      toast.error("IMEI sorgulamak için en az 14 hane girin.");
      return;
    }

    setIsLoading(true);
    setLookupModalOpen(false);
    setResultModalOpen(true);

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
        toast.error((data as any)?.error || "IMEI sorgulaması başarısız.");
        return;
      }

      if (data.imei) {
        setImeiValue(data.imei);
        setAutoCompleted(Boolean(data.autoCompleted15thDigit));
      }
      setLookupResult(data);
    } catch {
      toast.error("IMEI sorgu servisine bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanDetected = (scanned: string) => {
    const clean = normalizeImeiDigits(scanned);
    setImeiValue(clean);
    setAutoCompleted(false);
    void executeLookup(clean);
  };

  return (
    <>
      {/* Desktop: Single compact "BTK IMEI Sorgu" button opening lookup modal */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setLookupModalOpen(true)}
        className="hidden md:inline-flex h-10 px-3.5 rounded-xl bg-muted/40 border border-border/60 hover:border-blue-500/40 hover:bg-blue-500/10 text-foreground font-semibold text-xs gap-2 shrink-0 whitespace-nowrap transition-all"
        title="BTK & Cihaz IMEI Sorgula"
      >
        <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
        <span>BTK IMEI Sorgu</span>
      </Button>

      {/* Mobile Compact Trigger */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setLookupModalOpen(true)}
        className="md:hidden h-9 px-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs font-bold gap-1.5 text-foreground hover:text-blue-500 shrink-0"
        title="BTK IMEI Sorgu"
      >
        <ShieldCheck className="h-4 w-4 text-blue-500" />
        <span>IMEI</span>
      </Button>

      {/* Unified Quick IMEI Lookup Modal (Desktop + Mobile) */}
      <Dialog open={lookupModalOpen} onOpenChange={setLookupModalOpen}>
        <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-2xl p-5 sm:p-6 gap-4">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
              BTK IMEI Sorgu
            </DialogTitle>
            <DialogDescription className="text-xs">
              14 haneyi yazın; 15. Luhn kontrol hanesi (+1 kutusu) otomatik tamamlansın veya kamerayla tarayın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <Imei14Plus1Field
              value={digits}
              onChange={handleFieldChange}
              onEnter={() => void executeLookup(digits)}
              onOpenScanner={() => {
                setLookupModalOpen(false);
                setScannerOpen(true);
              }}
              autoFocus
              placeholder="14 haneli IMEI yazın..."
              inputClassName="h-11 text-sm"
              plusBoxClassName="h-11 text-base"
            />

            {autoCompleted && luhnOk && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pl-0.5">
                14 hane girildi → 15. Luhn kontrol hanesi (<strong>{digits[14]}</strong>) otomatik hesaplandı.
              </p>
            )}

            <Button
              type="button"
              disabled={isLoading || digits.length < 14}
              onClick={() => executeLookup(digits)}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              BTK & Cihaz Sorgula
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CameraImeiScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleScanDetected}
      />

      <ImeiResultModal
        open={resultModalOpen}
        onOpenChange={setResultModalOpen}
        result={lookupResult}
        isLoading={isLoading}
        onSubmitCaptcha={(code) => {
          if (!lookupResult) return;
          void executeLookup(lookupResult.imei, {
            challengeId: lookupResult.challengeId,
            captchaCode: code,
          });
        }}
        onRefreshCaptcha={() => {
          if (!lookupResult) return;
          void executeLookup(lookupResult.imei, { skipCache: true });
        }}
      />
    </>
  );
}
