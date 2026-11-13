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

export const parseUsdRate = (rawRate: unknown): number => {
  const candidate =
    typeof rawRate === "object" && rawRate !== null
      ? (rawRate as any).usd ?? (rawRate as any).rates?.USD ?? (rawRate as any).USD
      : rawRate;

  if (typeof candidate === "string") {
    const parsed = parseFloat(candidate.replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? num : 1;
};

export const RETURNED_STATUSES = ["APPROVED", "RESTOCKED", "REFUNDED", "EXCHANGED", "SENT_TO_SUPPLIER"];

export const getCompletedReturns = (returns: any[] = []) =>
  (returns || []).filter((r: any) => RETURNED_STATUSES.includes(r.returnStatus));

export const getReturnedDebtAmount = (debt: any, returns: any[] = []) => {
  const debtId = debt?.id;
  const saleId = debt?.saleId || debt?.sale?.id;
  if (!debtId && !saleId) return 0;

  return getCompletedReturns(returns)
    .filter((r: any) =>
      (debtId && r.debtId === debtId) ||
      (saleId && r.saleId === saleId)
    )
    .reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0);
};

export const getReturnedSaleItemAmount = (debt: any, saleItem: any, returns: any[] = []) =>
  getCompletedReturns(returns)
    .filter((r: any) =>
      (!debt?.id || r.debtId === debt.id) &&
      (!debt?.saleId || r.saleId === debt.saleId || r.saleId === debt.sale?.id) &&
      (!saleItem?.productId || r.productId === saleItem.productId)
    )
    .reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0);

export const adjustDebtForReturns = (debt: any, returns: any[] = []) => {
  if (!debt) return null;
  if (debt._isReturnAdjusted) return debt;

  const originalAmount = Number(debt.amount || 0);
  const returnedAmount = Math.min(originalAmount, getReturnedDebtAmount(debt, returns));
  if (returnedAmount <= 0) return debt;

  const adjustedAmount = Math.max(0, originalAmount - returnedAmount);
  if (adjustedAmount <= 0.01) {
    return {
      ...debt,
      amount: 0,
      remainingAmount: 0,
      isPaid: true,
      returnedAmount,
      _isReturnAdjusted: true,
    };
  }

  const rawRemaining = Number(debt.remainingAmount ?? originalAmount);
  const adjustedRemaining = Math.max(0, Math.min(rawRemaining, adjustedAmount));

  return {
    ...debt,
    amount: adjustedAmount,
    remainingAmount: adjustedRemaining,
    isPaid: adjustedRemaining <= 0.01,
    returnedAmount,
    _isReturnAdjusted: true,
  };
};

export const getPrintableDebts = (debts: any[] = [], returns: any[] = []) =>
  (debts || [])
    .map((debt) => adjustDebtForReturns(debt, returns))
    .filter((d: any) => d && (!d._isReturnAdjusted || d.amount > 0.01 || !d.isPaid));

export const extractCleanPaymentNote = (
  item: DebtStatementItem,
  customerName?: string | null
): string | null => {
  const raw = String(item?.notes ?? item?.description ?? "").trim();
  if (!raw) return null;

  // Turkish-locale safe index search so uppercase "TAHSİLAT DETAYI:" / "Tahsilat Detayi:" is always stripped
  const trLowerRaw = raw.toLocaleLowerCase("tr-TR");
  let cutIdx = -1;
  for (const marker of [
    "tahsilat detayı:",
    "tahsilat detayi:",
    "tahsılat detayı:",
    "tahsılat detayi:",
    "tahsilat detayı",
    "tahsilat detayi",
    "tahsılat detayı",
    "tahsılat detayi",
  ]) {
    const idx = trLowerRaw.indexOf(marker);
    if (idx !== -1 && (cutIdx === -1 || idx < cutIdx)) {
      cutIdx = idx;
    }
  }
  const stripped = (cutIdx !== -1 ? raw.slice(0, cutIdx) : raw).trim();

  if (!stripped) return null;

  const lower = stripped.replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
  const genericExact = new Set([
    "tahsilat",
    "tahsilat / ödeme",
    "tahsilat / odeme",
    "müşteri tahsilatı",
    "musteri tahsilati",
    "borç tahsilatı",
    "borc tahsilati",
    "tahsilat alındı",
    "tahsilat alindi",
  ]);
  if (genericExact.has(lower)) return null;

  if (lower.startsWith("borç tahsilatı:") || lower.startsWith("borc tahsilati:")) {
    const afterColon = stripped.split(":").slice(1).join(":").replace(/\s+/g, " ").trim();
    if (!afterColon) return null;
    if (
      customerName &&
      afterColon.toLocaleLowerCase("tr-TR") ===
        customerName.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR")
    ) {
      return null;
    }
  }

  if (customerName) {
    const normalizedCustomer = customerName.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");
    const expectedAutoTitle = `${normalizedCustomer} tahsilatı`;
    const expectedAutoTitleAscii = `${normalizedCustomer} tahsilati`;
    if (lower === expectedAutoTitle || lower === expectedAutoTitleAscii) {
      return null;
    }
  }

  return stripped;
};

export const getStatementItemTitle = (item: DebtStatementItem, customerName?: string | null) => {
  if (getType(item) === "PAYMENT") {
    return extractCleanPaymentNote(item, customerName) || "Tahsilat";
  }
  return item.notes || item.description || "Borç kaydı";
};

export function buildDebtStatementEntries(items: DebtStatementItem[], usdRate: number) {
  const safeRate = parseUsdRate(usdRate);
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
      const amountTRY = currency === "USD" ? money(amount * rate) : amount;
      const amountUSD = currency === "USD" ? amount : money(amount / rate);
      let appliedTRY = 0;
      let appliedUSD = 0;
      const isValidIncomePayment =
        type === "PAYMENT" &&
        item.paymentMethod !== "DEBT" &&
        item.originalType !== "EXPENSE";

      if (type === "DEBT") {
        if (currency === "USD") runningUSD = money(runningUSD + amount);
        else runningTRY = money(runningTRY + amount);
      } else if (isValidIncomePayment && currency === "TRY") {
        let remainingPaymentTRY = amount;
        appliedTRY = Math.min(runningTRY, remainingPaymentTRY);
        runningTRY = money(runningTRY - appliedTRY);
        remainingPaymentTRY = money(remainingPaymentTRY - appliedTRY);

        if (remainingPaymentTRY > 0) {
          appliedUSD = Math.min(runningUSD, money(remainingPaymentTRY / rate));
          runningUSD = money(runningUSD - appliedUSD);
        }
      } else if (isValidIncomePayment) {
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
  const safeRate = parseUsdRate(usdRate);
  let runningTRY = 0;
  let runningUSD = 0;

  return [...items]
    .filter((item) => getType(item) === "DEBT" && !item.isPaid && getRemainingAmount(item) > 0.01)
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
  const raw = items.reduce(
    (totals, item) => {
      if (getType(item) === "PAYMENT" || item.isPaid) return totals;
      const remaining = getRemainingAmount(item);
      if (remaining <= 0.01) return totals;
      if (getCurrency(item.currency) === "USD") totals.usd += remaining;
      else totals.try += remaining;
      return totals;
    },
    { try: 0, usd: 0 }
  );
  return { try: money(raw.try), usd: money(raw.usd) };
}

export function getCurrentDebtTotalsWithEquiv(items: DebtStatementItem[], usdRate: unknown) {
  const safeRate = parseUsdRate(usdRate);
  const base = getCurrentDebtTotals(items);
  return {
    usdRate: safeRate,
    try: base.try,
    usd: base.usd,
    totalTRY: money(base.try + base.usd * safeRate),
    totalUSD: money(base.usd + base.try / safeRate),
  };
}

/**
 * Merges debt records with valid customer collection transactions into the unified
 * statement array expected by DebtReceiptModal and DebtStatementModern.
 */
export function mergeStatementDebtsAndPayments(debts: any[] = [], transactions: any[] = []) {
  const mappedPayments = (transactions || [])
    .filter((t: any) => t.paymentMethod !== "DEBT" && t.type !== "EXPENSE" && Number(t.amount || 0) > 0)
    .map((t: any) => ({
      ...t,
      type: "PAYMENT",
      originalType: t.type,
      notes: t.description || t.notes || "",
      amount: t.amount,
      currency: t.currency || "TRY",
      createdAt: t.createdAt || t.date,
    }));

  return [...(debts || []), ...mappedPayments];
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

  const safeRate = parseUsdRate(usdRate);
  const isUsdDefault = defaultCurrency === "USD";

  // Calculate current real remaining totals using the single authoritative calculator
  const currentTotals = getCurrentDebtTotals(debts);
  const totalRemainingTRY = currentTotals.try;
  const totalRemainingUSD = currentTotals.usd;

  // Relevant payments:
  const validPayments = (transactions || [])
    .filter((t: any) => t.paymentMethod !== "DEBT" && t.type !== "EXPENSE" && Number(t.amount || 0) > 0)
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

export interface NewDebtWhatsAppReceiptOptions {
  date?: Date | string;
  items: {
    title: string;
    amount: number;
    currency: "TRY" | "USD" | string;
    quantity?: number;
  }[];
  totalRemainingTRY: number;
  totalRemainingUSD: number;
  usdRate: number;
  defaultCurrency?: string;
}

/**
 * Alacak eklendikten sonra müşteriye gönderilen kompakt WhatsApp fiş mesajı.
 * Sadece tarih, son alınan ürünler/fiyatlar ve güncel kalan borcu içerir; bayi/dükkan adı içermez.
 */
export function buildNewDebtWhatsAppReceipt(options: NewDebtWhatsAppReceiptOptions): string {
  const {
    date = new Date(),
    items = [],
    totalRemainingTRY = 0,
    totalRemainingUSD = 0,
    usdRate = 1,
    defaultCurrency = "TRY",
  } = options;

  const safeRate = parseUsdRate(usdRate);

  const isUsdDefault = defaultCurrency === "USD";
  const remTRY = money(totalRemainingTRY);
  const remUSD = money(totalRemainingUSD);

  const d = typeof date === "string" ? new Date(date) : date;
  const dateStr = !Number.isNaN(d.getTime())
    ? `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    : "";

  let message = "";
  if (dateStr) {
    message += `📅 *${dateStr}*\n\n`;
  }

  // 1. En son alınan ürünler ve fiyatları
  message += `📦 *ALINAN ÜRÜNLER:*\n`;
  if (items.length > 0) {
    items.forEach((item) => {
      const isUSD = item.currency === "USD";
      const symbol = isUSD ? "$" : "₺";
      const amtStr = `${symbol}${Number(item.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const qtyStr = item.quantity && Number(item.quantity) > 1 ? ` (${item.quantity} Adet)` : "";
      message += `• ${item.title}${qtyStr}: ${amtStr}\n`;
    });
  } else {
    message += `• Yeni Ürün / Hizmet Alımı\n`;
  }
  message += `\n`;

  // 2. Güncel Kalan Borç
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*🔴 GÜNCEL KALAN BORÇ:*\n`;

  if (remTRY <= 0 && remUSD <= 0) {
    message += `✅ Kalan borcunuz bulunmamaktadır.\n`;
  } else if (remTRY > 0 && remUSD > 0) {
    message += `• Toplam TL: ₺${remTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    message += `• Toplam USD: $${remUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;

    const netEquivTRY = money(remTRY + remUSD * safeRate);
    const netEquivUSD = money(remUSD + remTRY / safeRate);

    if (isUsdDefault) {
      message += `\n👉 *NET GENEL TOPLAM: $${netEquivUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`;
      message += `   (Yaklaşık ₺${netEquivTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`;
    } else {
      message += `\n👉 *NET GENEL TOPLAM: ₺${netEquivTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`;
      message += `   (Yaklaşık $${netEquivUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`;
    }
  } else if (remUSD > 0) {
    message += `• Toplam USD: $${remUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    const netEquivTRY = money(remUSD * safeRate);
    message += `   (Yaklaşık ₺${netEquivTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})\n`;
  } else {
    message += `• Toplam TL: ₺${remTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_İyi çalışmalar dileriz._`;

  return message;
}
