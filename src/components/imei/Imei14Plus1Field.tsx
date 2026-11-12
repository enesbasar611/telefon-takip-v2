"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyImeiAutoComplete,
  calculateLuhnCheckDigit,
  isValidImeiLuhn,
  normalizeImeiDigits,
} from "@/lib/imei-utils";

interface Imei14Plus1FieldProps {
  id?: string;
  value?: string;
  onChange: (nextImei: string, meta?: { autoCompleted: boolean }) => void;
  onBlur?: () => void;
  onEnter?: () => void;
  onOpenScanner?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  plusBoxClassName?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * Splits a 15-digit IMEI into a 14-digit main input and a separate "+1" Luhn check-digit box.
 * Preserves seamless 14->15 auto-completion, 15-digit paste, and direct +1 digit editing.
 */
export function Imei14Plus1Field({
  id,
  value = "",
  onChange,
  onBlur,
  onEnter,
  onOpenScanner,
  placeholder = "14 haneli IMEI yazın...",
  className,
  inputClassName,
  plusBoxClassName,
  autoFocus = false,
  disabled = false,
}: Imei14Plus1FieldProps) {
  const mainInputRef = useRef<HTMLInputElement>(null);
  const plusInputRef = useRef<HTMLInputElement>(null);

  const digits = normalizeImeiDigits(value);
  const base14 = digits.slice(0, 14);
  const digit15 = digits.length >= 15 ? digits[14] : "";

  const luhnOk = digits.length === 15 && isValidImeiLuhn(digits);
  const luhnBad = digits.length === 15 && !luhnOk;
  const expected15 = base14.length === 14 ? calculateLuhnCheckDigit(base14) : "";

  const handleMainChange = (raw: string) => {
    const cleanRaw = normalizeImeiDigits(raw);

    // Pasting a full 15-digit IMEI keeps all 15 digits as pasted.
    if (cleanRaw.length === 15) {
      onChange(cleanRaw, { autoCompleted: false });
      return;
    }

    // Backspace from 15 down to 13 when editing the 14th digit
    if (digits.length === 15 && cleanRaw.length === 13) {
      onChange(cleanRaw, { autoCompleted: false });
      return;
    }

    const res = applyImeiAutoComplete(base14, cleanRaw);
    onChange(res.value, { autoCompleted: res.autoCompleted });
  };

  const handlePlusDigitChange = (raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      onChange(base14, { autoCompleted: false });
      return;
    }
    const nextCheckDigit = clean.slice(-1);
    if (base14.length < 14) {
      mainInputRef.current?.focus();
      return;
    }
    onChange(`${base14}${nextCheckDigit}`, { autoCompleted: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0", className)}>
      {/* 14-digit main input + optional camera trigger */}
      <div className="relative flex-1 min-w-0">
        <Input
          ref={mainInputRef}
          id={id}
          value={base14}
          onChange={(e) => handleMainChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          maxLength={15}
          inputMode="numeric"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="IMEI ilk 14 hane"
          className={cn(
            "font-mono tabular-nums tracking-wider pr-10",
            luhnOk && "border-emerald-500/40",
            luhnBad && "border-rose-500/40",
            inputClassName
          )}
        />
        {onOpenScanner && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={onOpenScanner}
            title="Kamera ile IMEI Tara"
            aria-label="Kamera ile IMEI Tara"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Separate +1 Luhn check-digit box */}
      <div
        className="relative shrink-0"
        title={
          luhnOk
            ? `15. Luhn kontrol hanesi geçerli (${digit15})`
            : luhnBad
              ? `15. kontrol hanesi uyuşmuyor (Beklenen: ${expected15})`
              : "14 hane yazıldığında otomatik dolan +1 Luhn kontrol hanesi"
        }
      >
        <span
          className={cn(
            "pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-1 rounded text-[9px] font-black leading-tight bg-background border",
            luhnOk
              ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
              : luhnBad
                ? "text-rose-600 dark:text-rose-400 border-rose-500/40"
                : "text-muted-foreground border-border/60"
          )}
        >
          +1
        </span>
        <Input
          ref={plusInputRef}
          value={digit15}
          onChange={(e) => handlePlusDigitChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit15) {
              mainInputRef.current?.focus();
              return;
            }
            handleKeyDown(e);
          }}
          maxLength={2}
          inputMode="numeric"
          disabled={disabled}
          placeholder={expected15 || "?"}
          aria-label="15. Luhn kontrol hanesi (+1)"
          className={cn(
            "w-11 sm:w-12 px-0 text-center font-mono font-black tabular-nums text-sm sm:text-base transition-colors",
            luhnOk &&
              "border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 focus-visible:ring-emerald-500/30",
            luhnBad &&
              "border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400 focus-visible:ring-rose-500/30",
            !luhnOk && !luhnBad && "bg-muted/30 text-muted-foreground",
            plusBoxClassName
          )}
        />
      </div>
    </div>
  );
}

