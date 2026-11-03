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

export function formatDebtMoney(amount: number, currency: string = "TRY"): string {
  const isUSD = currency === "USD";
  const num = money(amount);
  return isUSD
    ? `$${num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₺${num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface UnifiedWhatsAppStatementOptions {
  customerName: string;
  debts: any[];
  transactions?: any[];
  usdRate: number;
  defaultCurrency?: string;
  balanceTRY?: number;
  balanceUSD?: number;
  includePaid?: boolean;
  includePayments?: boolean;
  shopName?: string;
}

export function buildUnifiedWhatsAppStatement(options: UnifiedWhatsAppStatementOptions): string {
  const {
    customerName,
    debts = [],
    transactions = [],
    usdRate = 1,
    defaultCurrency = "TRY",
    balanceTRY = 0,
    balanceUSD = 0,
    includePaid = false,
    includePayments = true,
    shopName = "Başar Teknik",
  } = options;

  let safeRate = 1;
  if (typeof usdRate === "string") {
    const parsed = parseFloat((usdRate as string).replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) safeRate = parsed;
  } else if (typeof usdRate === "number" && Number.isFinite(usdRate) && usdRate > 0) {
    safeRate = usdRate;
  }

  const isUsdDefault = defaultCurrency === "USD";

  // Calculate current real remaining totals
  let totalRemainingTRY = 0;
  let totalRemainingUSD = 0;
  debts.forEach((d: any) => {
    if (!d.isPaid) {
      const remaining = Number(d.remainingAmount ?? d.amount ?? 0);
      if (remaining > 0.01) {
        if (d.currency === "USD") totalRemainingUSD += remaining;
        else totalRemainingTRY += remaining;
      }
    }
  });

  totalRemainingTRY = money(totalRemainingTRY);
  totalRemainingUSD = money(totalRemainingUSD);

  // Relevant payments:
  const validPayments = (transactions || [])
    .filter((t: any) => t.paymentMethod !== "DEBT" && Number(t.amount || 0) > 0)
    .sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

  let totalCollectedTRY = 0;
  let totalCollectedUSD = 0;
  validPayments.forEach((p: any) => {
    const amt = Number(p.amount || 0);
    if (p.currency === "USD") totalCollectedUSD += amt;
    else totalCollectedTRY += amt;
  });
  totalCollectedTRY = money(totalCollectedTRY);
  totalCollectedUSD = money(totalCollectedUSD);

  const lastPayment = validPayments[0];

  // Header
  let message = `*${shopName}* - Hesap Ekstresi\n`;
  message += `👤 *Müşteri:* ${customerName.trim().toUpperCase()}\n\n`;

  // --- 1. GÜNCEL BORÇ DURUMU (KULLANICI TALEBİ: EN BAŞTA) ---
  if (totalRemainingTRY <= 0 && totalRemainingUSD <= 0) {
    message += `*🟢 GÜNCEL BORÇ DURUMU:*\n`;
    message += `✅ *Açık borcunuz bulunmamaktadır.* Bizi tercih ettiğiniz için teşekkür ederiz.\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_İyi çalışmalar dileriz._\n\n`;
  } else {
    message += `*🔴 GÜNCEL BORÇ DURUMU:*\n`;
    if (totalRemainingTRY > 0) {
      message += `• Toplam TL: ₺${totalRemainingTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }
    if (totalRemainingUSD > 0) {
      message += `• Toplam USD: $${totalRemainingUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }

    const netEquivTRY = money(totalRemainingTRY + totalRemainingUSD * safeRate);
    const netEquivUSD = money(totalRemainingUSD + totalRemainingTRY / safeRate);

    if (isUsdDefault) {
      message += `\n👉 *NET GENEL TOPLAM: $${netEquivUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`;
      message += `   (Yaklaşık ₺${netEquivTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`;
    } else {
      message += `\n👉 *NET GENEL TOPLAM: ₺${netEquivTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`;
      if (totalRemainingUSD > 0) {
        message += `   (Yaklaşık $${netEquivUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`;
      }
    }

    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_İyi çalışmalar dileriz._\n\n`;
  }

  // --- 2. MEVCUT EMANET / AVANS (VARSA) ---
  const emanetTRY = money(balanceTRY);
  const emanetUSD = money(balanceUSD);
  if (emanetTRY > 0 || emanetUSD > 0) {
    message += `*🎁 MEVCUT EMANET / AVANSINIZ:*\n`;
    if (emanetTRY > 0) message += `• TL Emanet: ₺${emanetTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    if (emanetUSD > 0) message += `• USD Emanet: $${emanetUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    message += `\n`;
  }

  // --- 3. TAHSİLAT & ÖDEME BİLGİSİ (SON TAHSİLAT TARİHİ VE TOPLAM TAHSİLAT) ---
  if (lastPayment) {
    const lDate = new Date(lastPayment.createdAt || lastPayment.date);
    const lDateStr = !Number.isNaN(lDate.getTime())
      ? `${lDate.getDate().toString().padStart(2, "0")}.${(lDate.getMonth() + 1).toString().padStart(2, "0")}.${lDate.getFullYear()}`
      : "";
    const lAmountStr = formatDebtMoney(Number(lastPayment.amount || 0), lastPayment.currency || "TRY");

    message += `*🟢 TAHSİLAT & ÖDEME BİLGİSİ:*\n`;
    message += `• Son Yapılan Tahsilat: ${lDateStr ? `[${lDateStr}] ` : ""}${lAmountStr}\n`;

    const collParts: string[] = [];
    if (totalCollectedUSD > 0) collParts.push(`$${totalCollectedUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    if (totalCollectedTRY > 0) collParts.push(`₺${totalCollectedTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    if (collParts.length > 0) {
      message += `• Toplam Yapılan Tahsilat: ${collParts.join(" + ")}\n`;
    }
    message += `\n`;
  }

  // --- 4. AÇIK BORÇ KALEMLERİ (SADECE ÖDENMEMİŞ OLANLAR) ---
  const openDebts = debts.filter((d: any) => {
    const remaining = Number(d.remainingAmount ?? d.amount ?? 0);
    return !d.isPaid && remaining > 0.01;
  });

  if (openDebts.length > 0) {
    message += `*📋 AÇIK BORÇ KALEMLERİ:*\n`;
    openDebts.forEach((debt: any) => {
      const remainingAmount = money(debt.remainingAmount ?? debt.amount ?? 0);
      const totalAmount = money(debt.amount ?? remainingAmount);
      const title = debt.notes || debt.description || (debt.sale?.items?.map((i: any) => i.product?.name || "Ürün").join(", ")) || "Hizmet / Ürün";
      const dDate = new Date(debt.createdAt || debt.date);
      const dateStr = !Number.isNaN(dDate.getTime())
        ? `${dDate.getDate().toString().padStart(2, "0")}.${(dDate.getMonth() + 1).toString().padStart(2, "0")}.${dDate.getFullYear()}`
        : "";

      let line = `• ${dateStr ? `[${dateStr}] ` : ""}${title}: ${formatDebtMoney(remainingAmount, debt.currency)}`;
      if (remainingAmount < totalAmount - 0.01) {
        line += ` _(Kalan / Toplam: ${formatDebtMoney(totalAmount, debt.currency)})_`;
      }
      message += `${line}\n`;
    });
    message += `\n`;
  }

  // --- 5. ÖDENEN ÜRÜNLER (KULLANICI 'ÖDENENLERİ GÖSTER' SEÇTİYSE) ---
  if (includePaid) {
    const paidDebts = debts.filter((d: any) => {
      const remaining = Number(d.remainingAmount ?? d.amount ?? 0);
      return d.isPaid || remaining <= 0.01;
    });

    if (paidDebts.length > 0) {
      message += `*✅ ÖDENMİŞ GEÇMİŞ KALEMLER:*\n`;
      paidDebts.forEach((debt: any) => {
        const totalAmount = money(debt.amount || 0);
        const title = debt.notes || debt.description || (debt.sale?.items?.map((i: any) => i.product?.name || "Ürün").join(", ")) || "Hizmet / Ürün";
        const dDate = new Date(debt.createdAt || debt.date);
        const dateStr = !Number.isNaN(dDate.getTime())
          ? `${dDate.getDate().toString().padStart(2, "0")}.${(dDate.getMonth() + 1).toString().padStart(2, "0")}.${dDate.getFullYear()}`
          : "";

        message += `• ${dateStr ? `[${dateStr}] ` : ""}${title}: ${formatDebtMoney(totalAmount, debt.currency)} ✅ (Ödendi)\n`;
      });
      message += `\n`;
    }
  }

  return message.trimEnd();
}
