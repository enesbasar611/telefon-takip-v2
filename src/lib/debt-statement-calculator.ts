export type DebtStatementCurrency = "TRY" | "USD";
export type DebtStatementItemType = "DEBT" | "PAYMENT";

export interface DebtStatementItem {
  id?: string;
  type?: DebtStatementItemType | string;
  createdAt?: string | Date;
  amount?: number | string;
  remainingAmount?: number | string;
  currency?: string;
  notes?: string | null;
  description?: string | null;
  isPaid?: boolean;
  exchangeRate?: number | string | null;
  rate?: number | string | null;
  paymentMethod?: string | null;
  [key: string]: any;
}

export interface DebtStatementEntry {
  item: DebtStatementItem;
  type: DebtStatementItemType;
  date: Date;
  currency: DebtStatementCurrency;
  amount: number;
  remainingAmount?: number;
  paidAmount?: number;
  amountTRY: number;
  amountUSD: number;
  appliedTRY: number;
  appliedUSD: number;
  runningTRY: number;
  runningUSD: number;
  runningTotalTRY: number;
}

const money = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
};

const getDate = (value: unknown) => {
  const date = new Date(value as any);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const getCurrency = (value: unknown): DebtStatementCurrency => value === "USD" ? "USD" : "TRY";

const getRate = (item: DebtStatementItem, fallbackRate: number) => {
  const rate = Number(item.exchangeRate || item.rate || fallbackRate);
  return Number.isFinite(rate) && rate > 0 ? rate : fallbackRate;
};

const getType = (item: DebtStatementItem): DebtStatementItemType => item.type === "PAYMENT" ? "PAYMENT" : "DEBT";

const getRemainingAmount = (item: DebtStatementItem) => {
  const amount = money(item.amount);
  const remaining = money(item.remainingAmount ?? amount);
  return Math.min(Math.max(remaining, 0), amount);
};

export const getStatementItemTitle = (item: DebtStatementItem) =>
  item.notes || item.description || (getType(item) === "PAYMENT" ? "Tahsilat / Odeme" : "Borc kaydi");

export function buildDebtStatementEntries(items: DebtStatementItem[], usdRate: number) {
  const safeRate = Number.isFinite(Number(usdRate)) && Number(usdRate) > 0 ? Number(usdRate) : 1;
  let runningTRY = 0;
  let runningUSD = 0;

  return [...items]
    .sort((a, b) => {
      const dateDiff = getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      const typeA = getType(a) === "DEBT" ? 0 : 1;
      const typeB = getType(b) === "DEBT" ? 0 : 1;
      return typeA - typeB;
    })
    .map((item) => {
      const type = getType(item);
      const currency = getCurrency(item.currency);
      const amount = money(item.amount);
      const remainingAmount = type === "DEBT" ? getRemainingAmount(item) : 0;
      const paidAmount = type === "DEBT" ? money(amount - remainingAmount) : 0;
      const rate = getRate(item, safeRate);
      let amountTRY = currency === "USD" ? money(amount * rate) : amount;
      let amountUSD = currency === "USD" ? amount : money(amount / rate);
      let appliedTRY = 0;
      let appliedUSD = 0;

      if (type === "DEBT") {
        if (currency === "USD") runningUSD = money(runningUSD + amount);
        else runningTRY = money(runningTRY + amount);
      } else if (currency === "TRY") {
        let remainingPaymentTRY = amount;
        appliedTRY = Math.min(runningTRY, remainingPaymentTRY);
        runningTRY = money(runningTRY - appliedTRY);
        remainingPaymentTRY = money(remainingPaymentTRY - appliedTRY);

        if (remainingPaymentTRY > 0) {
          appliedUSD = Math.min(runningUSD, money(remainingPaymentTRY / rate));
          runningUSD = money(runningUSD - appliedUSD);
        }
      } else {
        let remainingPaymentUSD = amount;
        appliedUSD = Math.min(runningUSD, remainingPaymentUSD);
        runningUSD = money(runningUSD - appliedUSD);
        remainingPaymentUSD = money(remainingPaymentUSD - appliedUSD);

        if (remainingPaymentUSD > 0) {
          appliedTRY = Math.min(runningTRY, money(remainingPaymentUSD * rate));
          runningTRY = money(runningTRY - appliedTRY);
        }
      }

      return {
        item,
        type,
        date: getDate(item.createdAt),
        currency,
        amount,
        remainingAmount,
        paidAmount,
        amountTRY,
        amountUSD,
        appliedTRY: money(appliedTRY),
        appliedUSD: money(appliedUSD),
        runningTRY: money(runningTRY),
        runningUSD: money(runningUSD),
        runningTotalTRY: money(runningTRY + runningUSD * safeRate),
      };
    });
}

export function buildOpenDebtStatementEntries(items: DebtStatementItem[], usdRate: number) {
  const safeRate = Number.isFinite(Number(usdRate)) && Number(usdRate) > 0 ? Number(usdRate) : 1;
  let runningTRY = 0;
  let runningUSD = 0;

  return [...items]
    .filter((item) => getType(item) === "DEBT" && !item.isPaid && getRemainingAmount(item) > 0)
    .sort((a, b) => getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime())
    .map((item) => {
      const currency = getCurrency(item.currency);
      const amount = money(item.amount);
      const remainingAmount = getRemainingAmount(item);
      const paidAmount = money(amount - remainingAmount);
      const rate = getRate(item, safeRate);
      const amountTRY = currency === "USD" ? money(amount * rate) : amount;
      const amountUSD = currency === "USD" ? amount : money(amount / rate);

      if (currency === "USD") runningUSD = money(runningUSD + remainingAmount);
      else runningTRY = money(runningTRY + remainingAmount);

      return {
        item,
        type: "DEBT" as const,
        date: getDate(item.createdAt),
        currency,
        amount,
        remainingAmount,
        paidAmount,
        amountTRY,
        amountUSD,
        appliedTRY: currency === "TRY" ? paidAmount : 0,
        appliedUSD: currency === "USD" ? paidAmount : 0,
        runningTRY: money(runningTRY),
        runningUSD: money(runningUSD),
        runningTotalTRY: money(runningTRY + runningUSD * safeRate),
      };
    });
}

export function getCurrentDebtTotals(items: DebtStatementItem[]) {
  return items.reduce(
    (totals, item) => {
      if (getType(item) === "PAYMENT" || item.isPaid) return totals;
      const remaining = getRemainingAmount(item);
      if (getCurrency(item.currency) === "USD") totals.usd = money(totals.usd + remaining);
      else totals.try = money(totals.try + remaining);
      return totals;
    },
    { try: 0, usd: 0 }
  );
}
