import { buildTransactionSearchWhere } from "../src/lib/finance/transaction-search";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const emptyFilter = buildTransactionSearchWhere("   ");
assert(Object.keys(emptyFilter).length === 0, "Empty search should not add a transaction filter.");

const filter = buildTransactionSearchWhere("Enes BAŞAR");
const orConditions = (filter as any).OR;

assert(Array.isArray(orConditions), "Search should create OR conditions.");
assert(orConditions.length >= 6, "Search should cover transaction text and related names.");
assert(
  orConditions.some((condition: any) => condition.customer?.name?.contains === "Enes BAŞAR"),
  "Search should include customer name."
);
assert(
  orConditions.some((condition: any) => condition.supplier?.name?.contains === "Enes BAŞAR"),
  "Search should include supplier name."
);
assert(
  orConditions.some((condition: any) => condition.user?.name?.contains === "Enes BAŞAR"),
  "Search should include user name."
);
assert(
  orConditions.some((condition: any) => condition.financeAccount?.name?.contains === "Enes BAŞAR"),
  "Search should include finance account name."
);

console.log("transaction-search-filter tests passed");
