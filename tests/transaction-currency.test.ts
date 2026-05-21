import {
  convertTransactionAmount,
  getCurrencySymbol,
  resolveInitialTransactionCurrency,
} from "../src/lib/finance/transaction-currency";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(resolveInitialTransactionCurrency("USD", "TRY") === "USD", "Saved currency should win.");
assert(resolveInitialTransactionCurrency(null, "EUR") === "EUR", "Default currency should be used when saved is missing.");
assert(resolveInitialTransactionCurrency("GBP", "USD") === "USD", "Invalid saved currency should fall back to default.");
assert(resolveInitialTransactionCurrency(null, "GBP") === "TRY", "Invalid defaults should fall back to TRY.");

const rates = { usd: 40, eur: 50 };
assert(convertTransactionAmount(100, "TRY", rates).TRY === 100, "TRY should stay TRY.");
assert(convertTransactionAmount(100, "TRY", rates).USD === 2.5, "TRY should convert to USD.");
assert(convertTransactionAmount(10, "USD", rates).TRY === 400, "USD should convert to TRY.");
assert(convertTransactionAmount(10, "EUR", rates).TRY === 500, "EUR should convert to TRY.");
assert(convertTransactionAmount(10, "EUR", rates).USD === 12.5, "EUR should convert to USD via TRY.");

assert(getCurrencySymbol("TRY") === "₺", "TRY symbol should be Turkish lira.");
assert(getCurrencySymbol("USD") === "$", "USD symbol should be dollar.");
assert(getCurrencySymbol("EUR") === "€", "EUR symbol should be euro.");

console.log("transaction-currency tests passed");
