"use client";

import { cn } from "@/lib/utils";
import { formatKasaBalanceParts } from "@/lib/finance/balance-display";

interface KasaBalanceTextProps {
  balance: number | string | null | undefined;
  currency?: string;
  accountType?: string | null;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
  className?: string;
  mainClassName?: string;
  deficitClassName?: string;
}

/**
 * Renders kasa/account balance as `₺0,00 (-₺1.000,00)` (with red deficit) when negative,
 * or standard formatted currency when zero/positive (or for CREDIT_CARD accounts).
 */
export function KasaBalanceText({
  balance,
  currency = "TRY",
  accountType,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = "tr-TR",
  className,
  mainClassName,
  deficitClassName,
}: KasaBalanceTextProps) {
  const { mainText, deficitText, isDeficit } = formatKasaBalanceParts(balance, {
    currency,
    accountType,
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
  });

  if (!isDeficit || !deficitText) {
    return <span className={cn(className, mainClassName)}>{mainText}</span>;
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1 flex-wrap tabular-nums", className)}>
      <span className={mainClassName}>{mainText}</span>
      <span className={cn("text-rose-500 font-bold", deficitClassName)}>
        {deficitText}
      </span>
    </span>
  );
}

