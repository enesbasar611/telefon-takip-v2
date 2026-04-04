"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useUI } from "@/lib/context/ui-context";

interface RevealFinancialProps {
  amount: string | number;
  className?: string;
  prefix?: string;
}

export function RevealFinancial({ amount, className, prefix = "₺" }: RevealFinancialProps) {
  const { isFinancialVisible } = useUI();

  const formattedAmount = typeof amount === "number"
    ? formatCurrency(amount)
    : amount.replace('₺', '').trim();

  return (
    <div
      className={cn("relative group cursor-pointer inline-flex items-center gap-2", className)}
    >
      <span className={cn(
        "transition-all duration-300 font-bold",
        !isFinancialVisible && "blur-md select-none opacity-40"
      )}>
        {prefix}{formattedAmount}
      </span>
      {!isFinancialVisible && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <EyeOff className="h-4 w-4 text-gray-600/50" />
        </div>
      )}
    </div>
  );
}
