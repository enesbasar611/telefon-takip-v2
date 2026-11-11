export interface SplitBalanceResult {
  isDeficit: boolean;
  displayAmount: number;
  deficitAmount: number;
  rawBalance: number;
}

/**
 * Splits a cash/bank/POS account balance so negative balances show 0 as the
 * primary kasa balance and surface the deficit separately as (-amount).
 * Credit cards represent debt against card limit and are left unchanged.
 */
export function splitKasaBalance(
  balance: number | string | null | undefined,
  accountType?: string | null
): SplitBalanceResult {
  const num = Number(balance || 0);
  if (isNaN(num) || accountType === "CREDIT_CARD") {
    const safe = isNaN(num) ? 0 : num;
    return { isDeficit: false, displayAmount: safe, deficitAmount: 0, rawBalance: safe };
  }

  if (num < -0.004) {
    return {
      isDeficit: true,
      displayAmount: 0,
      deficitAmount: Math.abs(num),
      rawBalance: num,
    };
  }

  return {
    isDeficit: false,
    displayAmount: Math.abs(num) < 0.005 ? 0 : num,
    deficitAmount: 0,
    rawBalance: num,
  };
}

export function formatKasaBalanceParts(
  balance: number | string | null | undefined,
  options?: {
    currency?: string;
    accountType?: string | null;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  }
): { mainText: string; deficitText: string | null; isDeficit: boolean } {
  const currency = options?.currency === "USD" || options?.currency === "EUR" ? options.currency : "TRY";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
  const minDec = options?.minimumFractionDigits ?? 2;
  const maxDec = options?.maximumFractionDigits ?? 2;
  const locale = options?.locale ?? "tr-TR";

  const { isDeficit, displayAmount, deficitAmount } = splitKasaBalance(balance, options?.accountType);

  const formatNum = (val: number) =>
    `${symbol}${val.toLocaleString(locale, {
      minimumFractionDigits: minDec,
      maximumFractionDigits: maxDec,
    })}`;

  if (isDeficit) {
    return {
      mainText: formatNum(0),
      deficitText: `(-${formatNum(deficitAmount)})`,
      isDeficit: true,
    };
  }

  return {
    mainText: formatNum(displayAmount),
    deficitText: null,
    isDeficit: false,
  };
}

