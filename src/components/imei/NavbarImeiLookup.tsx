"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Loader2, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyImeiAutoComplete,
  isValidImeiLuhn,
  normalizeImeiDigits,
  type ImeiLookupResult,
} from "@/lib/imei-utils";
import { CameraImeiScanner } from "./CameraImeiScanner";
import { ImeiResultModal } from "./ImeiResultModal";
import { toast } from "sonner";

export function NavbarImeiLookup() {
  const [imeiValue, setImeiValue] = useState("");
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [mobileInputOpen, setMobileInputOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<ImeiLookupResult | null>(null);

  const digits = normalizeImeiDigits(imeiValue);
  const luhnOk = digits.length === 15 && isValidImeiLuhn(digits);

  const handleInputChange = (raw: string) => {
    const res = applyImeiAutoComplete(digits, raw);
    setAutoCompleted(res.autoCompleted);
    setImeiValue(res.value);
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
    setMobileInputOpen(false);
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
      {/* Desktop Compact Navbar IMEI Bar */}
      <div className="hidden md:flex items-center gap-1.5 w-full max-w-[360px] lg:max-w-[400px]">
        <div className="relative flex-1 min-w-0">
          <Input
            value={digits}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void executeLookup(digits);
              }
            }}
            maxLength={15}
            inputMode="numeric"
            placeholder="IMEI Sorgula (14 hane yazın)..."
            aria-label="IMEI Sorgula"
            className={cn(
              "h-10 bg-muted/40 border-border/60 rounded-xl pl-3 pr-16 text-xs font-mono tabular-nums tracking-wider focus-visible:bg-background",
              luhnOk && "border-emerald-500/40"
            )}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {autoCompleted && luhnOk && (
              <Badge
                variant="outline"
                className="h-5 px-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                14+1
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setScannerOpen(true)}
              title="Kamera ile IMEI Tara"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
            >
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={isLoading || digits.length < 14}
          onClick={() => executeLookup(digits)}
          className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          <span>Sorgula</span>
        </Button>
      </div>

      {/* Mobile Compact Trigger */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setMobileInputOpen(true)}
        className="md:hidden h-9 px-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs font-bold gap-1.5 text-foreground hover:text-blue-500 shrink-0"
        title="IMEI & BTK Sorgula"
      >
        <ShieldCheck className="h-4 w-4 text-blue-500" />
        <span>IMEI</span>
      </Button>

      {/* Mobile Quick IMEI Lookup Modal */}
      <Dialog open={mobileInputOpen} onOpenChange={setMobileInputOpen}>
        <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-2xl p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Hızlı IMEI & BTK Sorgula
            </DialogTitle>
            <DialogDescription className="text-xs">
              14 hane yazdığınızda 15. Luhn hanesi otomatik tamamlanır veya kamerayla tarayabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={digits}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void executeLookup(digits);
                    }
                  }}
                  maxLength={15}
                  inputMode="numeric"
                  placeholder="IMEI Sorgula (14 hane yazın)..."
                  className="h-11 font-mono tabular-nums tracking-wider pr-12"
                />
                {autoCompleted && luhnOk && (
                  <Badge
                    variant="outline"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  >
                    14+1
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setMobileInputOpen(false);
                  setScannerOpen(true);
                }}
                className="h-11 w-11 rounded-xl shrink-0"
                title="Kamera ile Tara"
              >
                <Camera className="h-4 w-4 text-blue-500" />
              </Button>
            </div>

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

