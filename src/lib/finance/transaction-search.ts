import type { Prisma } from "@prisma/client";

const SEARCH_MODE = "insensitive" as const;

function containsSearch(term: string) {
  return {
    contains: term,
    mode: SEARCH_MODE,
  };
}

export function buildTransactionSearchWhere(search?: string): Prisma.TransactionWhereInput {
  const term = search?.trim();
  if (!term) return {};

  return {
    OR: [
      { description: containsSearch(term) },
      { category: containsSearch(term) },
      { customer: { name: containsSearch(term) } },
      { supplier: { name: containsSearch(term) } },
      { user: { name: containsSearch(term) } },
      { financeAccount: { name: containsSearch(term) } },
    ],
  };
}
