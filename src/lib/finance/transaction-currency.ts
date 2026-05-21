export type TransactionCurrency = "TRY" | "USD" | "EUR";

export type TransactionRates = {
  usd?: number | null;
  eur?: number | null;
};

const CURRENCIES: TransactionCurrency[] = ["TRY", "USD", "EUR"];

export function isTransactionCurrency(value: unknown): value is TransactionCurrency {
  return typeof value === "string" && CURRENCIES.includes(value as TransactionCurrency);
}

export function resolveInitialTransactionCurrency(
  savedCurrency: unknown,
  defaultCurrency: unknown
): TransactionCurrency {
  if (isTransactionCurrency(savedCurrency)) return savedCurrency;
  if (isTransactionCurrency(defaultCurrency)) return defaultCurrency;
  return "TRY";
}

export function getCurrencySymbol(currency: TransactionCurrency) {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "₺";
}

export function convertTransactionAmount(
  amount: number,
  currency: TransactionCurrency,
  rates: TransactionRates
) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const usdRate = Number(rates.usd) > 0 ? Number(rates.usd) : 34;
  const eurRate = Number(rates.eur) > 0 ? Number(rates.eur) : 37;

  const tryAmount =
    currency === "USD" ? safeAmount * usdRate :
      currency === "EUR" ? safeAmount * eurRate :
        safeAmount;

  return {
    TRY: tryAmount,
    USD: tryAmount / usdRate,
    EUR: tryAmount / eurRate,
  };
}
