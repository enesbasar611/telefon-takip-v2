"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    buildDebtStatementEntries,
    extractCleanPaymentNote,
    getCurrentDebtTotalsWithEquiv,
    parseUsdRate,
} from "@/lib/debt-statement-calculator";

interface DebtStatementModernProps {
    customer: any;
    debts: any[];
    allDebts?: any[];
    shopName: string;
    shopPhone?: string;
    shopAddress?: string;
    shopWebsite?: string;
    shopLogo?: string;
    rates: any;
    showPaid: boolean;
    defaultCurrency?: string;
}

const getPaymentMethodLabel = (method?: string | null) => {
    if (!method) return null;
    if (method === "CASH") return "Nakit";
    if (method === "CREDIT_CARD" || method === "CARD") return "Kredi Kartı";
    if (method === "BANK" || method === "TRANSFER") return "Havale/EFT";
    return method;
};

export const DebtStatementModern = ({
    customer,
    debts,
    allDebts,
    shopName,
    rates,
    showPaid,
    defaultCurrency = "TRY",
}: DebtStatementModernProps) => {
    const currentUsdRate = parseUsdRate(rates);
    const formatTRY = (amount: number) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
    const formatUSD = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    const money = (amount: unknown) => {
        const value = Number(amount);
        if (!Number.isFinite(value)) return 0;
        return Math.round(value * 100) / 100;
    };

    // En eski ödenmemiş borç tarihini bul (açık görünümde bu tarihten itibaren yapılan tahsilatları göster)
    const unpaidDebts = debts.filter(
        (d: any) =>
            (d.type === "DEBT" || !d.type) &&
            !d.isPaid &&
            Number(d.remainingAmount ?? d.amount ?? 0) > 0.01
    );

    const earliestDate = (() => {
        if (unpaidDebts.length === 0) return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sorted = [...unpaidDebts].sort((a: any, b: any) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return da - db;
        });
        const first = new Date(sorted[0].createdAt);
        return !isNaN(first.getTime()) ? first : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    })();

    const filteredDebts = debts
        .filter((d: any) => {
            if (d.type === "PAYMENT") {
                if (d.paymentMethod === "DEBT" || d.originalType === "EXPENSE") return false;
                if (showPaid) return true;
                const date = new Date(d.createdAt);
                if (isNaN(date.getTime())) return false;
                return date >= earliestDate;
            }
            if (showPaid) return true;
            return !d.isPaid && Number(d.remainingAmount ?? d.amount ?? 0) > 0.01;
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const statementEntries = buildDebtStatementEntries(filteredDebts, currentUsdRate);
    const debtSummaryEntries = statementEntries.filter((entry) => entry.type === "DEBT");
    const paymentSummaryEntries = statementEntries.filter((entry) => entry.type === "PAYMENT");

    const statementGrossTRY = money(
        debtSummaryEntries
            .filter((entry) => entry.currency !== "USD")
            .reduce((sum, entry) => sum + money(entry.amount), 0)
    );
    const statementGrossUSD = money(
        debtSummaryEntries
            .filter((entry) => entry.currency === "USD")
            .reduce((sum, entry) => sum + money(entry.amount), 0)
    );

    const totalTahsilatTRY = money(
        paymentSummaryEntries
            .filter((entry) => entry.currency !== "USD")
            .reduce((sum, entry) => sum + money(entry.amount), 0)
    );
    const totalTahsilatUSD = money(
        paymentSummaryEntries
            .filter((entry) => entry.currency === "USD")
            .reduce((sum, entry) => sum + money(entry.amount), 0)
    );

    // GÜNCEL KALAN BORÇ: Her zaman gerçek açık borç kalemlerinden (getCurrentDebtTotalsWithEquiv)
    // hesaplanır; böylece WhatsApp ekstresi ve Veresiye ekranıyla kuruşu kuruşuna eşleşir.
    const authoritativeSource = (allDebts && allDebts.length > 0 ? allDebts : debts).filter(
        (d: any) => d.type !== "PAYMENT"
    );
    const authoritativeTotals = getCurrentDebtTotalsWithEquiv(authoritativeSource, currentUsdRate);

    const remainingTRY = authoritativeTotals.try;
    const remainingUSD = authoritativeTotals.usd;
    const remainingTotalTRY = authoritativeTotals.totalTRY;
    const remainingTotalUSD = authoritativeTotals.totalUSD;

    const summaryCardTRY = showPaid ? statementGrossTRY : remainingTRY;
    const summaryCardUSD = showPaid ? statementGrossUSD : remainingUSD;
    const isUsdDefault = defaultCurrency === "USD";

    // Açık görünümde satır satır kalan bakiye birikimini tutarlı hesapla
    let openRunningTRY = 0;
    let openRunningUSD = 0;
    const enrichedEntries = statementEntries.map((entry) => {
        if (entry.type === "DEBT") {
            const rem = money(entry.remainingAmount ?? 0);
            if (entry.currency === "USD") {
                openRunningUSD = money(openRunningUSD + rem);
            } else {
                openRunningTRY = money(openRunningTRY + rem);
            }
        }
        return {
            ...entry,
            openRunningTRY,
            openRunningUSD,
        };
    });

    const renderSummaryGrid = () => (
        <div className="grid grid-cols-5 gap-3">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-[8px] font-black text-emerald-600 uppercase mb-1 tracking-widest">
                    {showPaid ? "TOPLAM TL BORCU" : "KALAN TL BORCU"}
                </div>
                <div className="text-sm font-black text-emerald-700">{formatTRY(summaryCardTRY)}</div>
                <div className="text-[9px] font-bold text-emerald-700/70">
                    ({formatUSD(summaryCardTRY / currentUsdRate)})
                </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                <div className="text-[8px] font-black text-blue-600 uppercase mb-1 tracking-widest">
                    {showPaid ? "TOPLAM USD BORCU" : "KALAN USD BORCU"}
                </div>
                <div className="text-sm font-black text-blue-700">{formatUSD(summaryCardUSD)}</div>
                <div className="text-[9px] font-bold text-blue-700/70">
                    ({formatTRY(summaryCardUSD * currentUsdRate)})
                </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest">TL TAHSİLAT</div>
                <div className="text-sm font-black text-slate-700 italic">{formatTRY(totalTahsilatTRY)}</div>
                <div className="text-[9px] font-bold text-slate-500">
                    ({formatUSD(totalTahsilatTRY / currentUsdRate)})
                </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm">
                <div className="text-[8px] font-black text-amber-600 uppercase mb-1 tracking-widest">USD TAHSİLAT</div>
                <div className="text-sm font-black text-amber-700 italic">{formatUSD(totalTahsilatUSD)}</div>
                <div className="text-[9px] font-bold text-amber-700/70">
                    ({formatTRY(totalTahsilatUSD * currentUsdRate)})
                </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl text-center shadow-xl flex flex-col justify-center">
                <div className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest border-b border-slate-700 pb-1">
                    KALAN BAKİYE
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="text-base font-black text-white leading-none">
                        {isUsdDefault ? formatUSD(remainingTotalUSD) : formatTRY(remainingTotalTRY)}
                    </div>
                    <div className="text-[10px] font-black text-blue-400 tabular-nums">
                        {isUsdDefault ? formatTRY(remainingTotalTRY) : formatUSD(remainingTotalUSD)}
                    </div>
                    {remainingTRY > 0.01 && remainingUSD > 0.01 && (
                        <div className="text-[8px] font-bold text-slate-300 mt-0.5 tabular-nums">
                            {formatTRY(remainingTRY)} + {formatUSD(remainingUSD)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Tarih gruplama
    const groups = enrichedEntries.reduce((acc: Record<string, typeof enrichedEntries>, item) => {
        const dateKey = format(new Date(item.date), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white p-10 font-sans text-slate-900 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-4 mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">BORÇ EKSTRESİ</h1>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>{format(new Date(), "dd MMMM yyyy", { locale: tr })}</span>
                        <span>•</span>
                        <span>{shopName}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg mb-2 inline-block">
                        <span className="text-[10px] font-black text-slate-500 uppercase mr-2 tracking-widest text-center">
                            GÜNCEL USD KURU:
                        </span>
                        <span className="text-sm font-black text-blue-600">₺{currentUsdRate.toFixed(2)}</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 uppercase leading-none mt-1">{customer?.name}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{customer?.phone}</div>
                </div>
            </div>

            {/* Totals Grid */}
            <div className="mb-8">{renderSummaryGrid()}</div>

            {/* List Table */}
            <div className="flex-1 overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="w-32 py-3 px-4 text-[10px] font-black uppercase tracking-wider rounded-tl-lg">
                                TARİH
                            </th>
                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider">
                                AÇIKLAMA / ÜRÜN DETAYI
                            </th>
                            <th className="w-32 py-3 px-4 text-[10px] font-black uppercase tracking-wider text-right">
                                İŞLEM TUTARI
                            </th>
                            <th className="w-28 py-3 px-4 text-[10px] font-black uppercase tracking-wider text-right">
                                KALAN TL
                            </th>
                            <th className="w-28 py-3 px-4 text-[10px] font-black uppercase tracking-wider text-right rounded-tr-lg">
                                KALAN USD
                            </th>
                        </tr>
                    </thead>
                    <tbody className="border-x border-slate-200">
                        {sortedDates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-xs font-bold text-slate-400 border-b border-slate-200">
                                    Bu dönem veya filtre için gösterilecek kayıt bulunmuyor.
                                </td>
                            </tr>
                        ) : (
                            sortedDates.map((date) => {
                                const dailyItems = groups[date];
                                const hasPaymentOnThisDate = dailyItems.some((e) => e.type === "PAYMENT");

                                return dailyItems.map((entry, idx) => {
                                    const item = entry.item;
                                    const isPayment = entry.type === "PAYMENT";
                                    const paidAmount = Number(entry.paidAmount || 0);
                                    const remainingAmount = Number(entry.remainingAmount || 0);
                                    const formatEntryCurrency = (amount: number) =>
                                        entry.currency === "USD" ? formatUSD(amount) : formatTRY(amount);
                                    const cleanPaymentNote = isPayment
                                        ? extractCleanPaymentNote(item, customer?.name)
                                        : null;
                                    const methodLabel = isPayment ? getPaymentMethodLabel(item.paymentMethod) : null;

                                    return (
                                        <tr
                                            key={`${item.id || entry.date.getTime()}-${idx}`}
                                            className={cn(
                                                "border-b transition-colors group",
                                                isPayment
                                                    ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/50"
                                                    : "border-slate-100 hover:bg-slate-50/50"
                                            )}
                                        >
                                            <td className="py-2.5 px-4 text-[11px] font-bold align-top">
                                                {idx === 0 ? (
                                                    hasPaymentOnThisDate ? (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs whitespace-nowrap">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                {format(new Date(date), "dd.MM.yyyy")}
                                                            </div>
                                                            <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                                                ✓ ÖDEME GÜNÜ
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-500 tabular-nums">
                                                            {format(new Date(date), "dd.MM.yyyy")}
                                                        </span>
                                                    )
                                                ) : (
                                                    isPayment && (
                                                        <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                                                            TAHSİLAT
                                                        </span>
                                                    )
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 align-top">
                                                <div className="flex flex-col gap-0.5">
                                                    {isPayment ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[12px] font-black uppercase leading-normal tracking-tight text-emerald-700">
                                                                    ✓ TAHSİLAT ALINDI
                                                                </span>
                                                                {methodLabel && (
                                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                                                                        {methodLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {cleanPaymentNote && (
                                                                <span className="text-[11px] font-bold text-slate-800 whitespace-pre-line">
                                                                    {cleanPaymentNote}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-[12px] font-bold uppercase leading-normal tracking-tight text-slate-900">
                                                                {item.notes || item.description || "ÜRÜN / HİZMET"}
                                                            </span>
                                                            {entry.currency === "USD" && (
                                                                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 self-start px-1.5 rounded">
                                                                    ${Number(item.amount || 0).toLocaleString("tr-TR")} (
                                                                    {formatTRY(Number(item.amount || 0) * (Number(item.rate) || currentUsdRate))}
                                                                    )
                                                                </span>
                                                            )}
                                                            {!showPaid && (
                                                                <span className="text-[10px] font-black text-slate-500 self-start">
                                                                    Kalan: {formatEntryCurrency(remainingAmount)}
                                                                    {paidAmount > 0 ? ` / Ödenen: ${formatEntryCurrency(paidAmount)}` : ""}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                                                {isPayment ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="inline-block text-xs font-black tabular-nums text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                                                            -{" "}
                                                            {new Intl.NumberFormat(entry.currency === "USD" ? "en-US" : "tr-TR", {
                                                                style: "currency",
                                                                currency: entry.currency || "TRY",
                                                            }).format(entry.amount)}
                                                        </span>
                                                        {entry.currency === "TRY" && (
                                                            <span className="block text-[10px] font-bold text-emerald-600/90 mt-0.5">
                                                                ({formatUSD(entry.amountUSD)})
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-black tabular-nums text-slate-900">
                                                        +{" "}
                                                        {new Intl.NumberFormat(entry.currency === "USD" ? "en-US" : "tr-TR", {
                                                            style: "currency",
                                                            currency: entry.currency || "TRY",
                                                        }).format(entry.amount)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                                                {!showPaid && isPayment ? (
                                                    <span className="text-xs font-bold text-slate-400">—</span>
                                                ) : (
                                                    <span className="text-xs font-black text-slate-800 tabular-nums">
                                                        {formatTRY(showPaid ? entry.runningTRY : entry.openRunningTRY)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                                                {!showPaid && isPayment ? (
                                                    <span className="text-xs font-bold text-slate-400">—</span>
                                                ) : (
                                                    <span className="text-xs font-black text-blue-600 tabular-nums">
                                                        {formatUSD(showPaid ? entry.runningUSD : entry.openRunningUSD)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                });
                            })
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-900 text-white border-t-2 border-slate-900">
                            <td colSpan={3} className="py-2.5 px-4 text-[11px] font-black uppercase tracking-wider rounded-bl-lg">
                                GÜNCEL KALAN BORÇ (NET)
                            </td>
                            <td className="py-2.5 px-4 text-right text-xs font-black tabular-nums">
                                {formatTRY(remainingTRY)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-xs font-black text-blue-300 tabular-nums rounded-br-lg">
                                {formatUSD(remainingUSD)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">EKSTRE ÖZETİ</div>
                {renderSummaryGrid()}
            </div>

            {/* Bottom Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200 flex justify-between items-end">
                <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Önemli Bilgilendirme</div>
                    <p className="text-[10px] leading-relaxed text-slate-400 max-w-lg italic">
                        * Bu ekstre bilgilendirme amaçlıdır. Hata olduğunu düşünüyorsanız bildiriniz.
                        <br />
                        * Yeşil renk ile vurgulanmış satırlar ve tarihler tahsilat (ödeme) yapılan günleri belirtmektedir.
                        <br />
                        * Dövizli işlemler güncel kur ($1 = ₺{currentUsdRate.toFixed(2)}) üzerinden bakiye toplamına dahil edilmiştir.
                    </p>
                </div>
                <div className="flex flex-col items-center pr-8">
                    <div className="text-[10px] font-black text-slate-900 underline underline-offset-4 mb-3">MÜŞTERİ ONAYI</div>
                    <div className="w-48 h-16 border-2 border-slate-100 bg-slate-50/30 rounded-xl relative">
                        <span className="absolute bottom-2 right-2 text-[8px] font-bold text-slate-300">İMZA / KAŞE</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] opacity-50">
                {shopName} • PROFESYONEL SERVİS VE SATIŞ SİSTEMİ
            </div>
        </div>
    );
};
