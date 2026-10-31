"use client";

import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/context/ui-context";
import { CountingNumber } from "@/components/ui/counting-number";

interface RevealFinancialProps {
  amount: string | number;
  className?: string;
  prefix?: string;
  decimals?: number;
}

export function RevealFinancial({ amount, className, prefix = "₺", decimals = 2 }: RevealFinancialProps) {
  const { isFinancialVisible } = useUI();

  const hasSymbol = typeof amount === "string" && (amount.startsWith('₺') || amount.startsWith('$') || amount.startsWith('€'));
  const finalPrefix = hasSymbol ? "" : prefix;

  return (
    <div
      className={cn("relative group cursor-pointer inline-flex items-center gap-2", className)}
    >
      <span className={cn(
        "transition-all duration-300",
        !isFinancialVisible && "blur-md select-none opacity-40"
      )}>
        <CountingNumber
          value={amount}
          prefix={finalPrefix}
          trigger="view"
          grouping
          decimals={decimals}
        />
      </span>
      {!isFinancialVisible && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <EyeOff className="h-4 w-4 text-gray-600/50" />
        </div>
      )}
    </div>
  );
}
