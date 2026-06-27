"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DebtStatementModernProps {
    customer: any;
    debts: any[];
    shopName: string;
    shopPhone?: string;
    shopAddress?: string;
    shopWebsite?: string;
    shopLogo?: string;
    rates: any;
    showPaid: boolean;
    defaultCurrency?: string;
}

export const DebtStatementModern = ({
    customer,
    debts,
    shopName,
    shopPhone,
    shopAddress,
    shopWebsite,
    shopLogo,
    rates,
    showPaid,
    defaultCurrency = 'TRY'
}: DebtStatementModernProps) => {
    // Sistemden gelen canlı kur bilgisini alıyoruz
    const currentUsdRate = Number(rates?.usd || rates?.rates?.USD || rates?.USD) || 32.50;

    // Filtreleme ve sıralama
    const filteredDebts = debts
        .filter(d => {
            if (showPaid) return true; // Tümü seçiliyse her şeyi göster
            if (d.type === 'PAYMENT') return true; // Tahsilatları her zaman göster (bakiyeyi etkiler)
            return Number(d.remainingAmount) > 0; // Borç ise sadece kalan tutarı olanları göster
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Borç ve Tahsilat Hesaplamaları
    const totalTRY = filteredDebts
        .filter(d => d.currency !== 'USD' && d.type !== 'PAYMENT')
        .reduce((acc, d) => acc + d.amount, 0);

    const totalUSD = filteredDebts
        .filter(d => d.currency === 'USD' && d.type !== 'PAYMENT')
        .reduce((acc, d) => acc + d.amount, 0);

    const totalTahsilat = filteredDebts
        .filter(d => d.type === 'PAYMENT')
        .reduce((acc, d) => acc + (d.amountInTry || d.amount), 0);

    const portfolioTotalTRY = (totalTRY + (totalUSD * currentUsdRate)) - totalTahsilat;
    const portfolioTotalUSD = portfolioTotalTRY / currentUsdRate;

    // Tarih gruplama
    const groups = filteredDebts.reduce((groups: any, item: any) => {
        const date = format(new Date(item.createdAt), "yyyy-MM-dd");
        if (!groups[date]) groups[date] = [];
        groups[date].push({
            ...item,
            amountInTry: item.currency === 'USD' ? (item.amount * (item.rate || currentUsdRate)) : item.amount
        });
        return groups;
    }, {});

    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let runningBalance = 0;

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
                        <span className="text-[10px] font-black text-slate-500 uppercase mr-2 tracking-widest text-center">GÜNCEL USD KURU:</span>
                        <span className="text-sm font-black text-blue-600">₺{currentUsdRate.toFixed(2)}</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 uppercase leading-none mt-1">{customer?.name}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{customer?.phone}</div>
                </div>
            </div>

            {/* Totals Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* TL Borcu - Yeşil */}
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="text-[9px] font-black text-emerald-600 uppercase mb-1 tracking-widest">TOPLAM TL BORCU</div>
                    <div className="text-base font-black text-emerald-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalTRY)}
                    </div>
                </div>

                {/* USD Borcu - Mavi */}
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-[9px] font-black text-blue-600 uppercase mb-1 tracking-widest">TOPLAM USD BORCU</div>
                    <div className="text-base font-black text-blue-700">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD)}
                    </div>
                </div>

                {/* Tahsilat - Gri/Füme */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">TOPLAM TAHSİLAT</div>
                    <div className="text-base font-black text-slate-700 italic">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalTahsilat)}
                    </div>
                </div>

                {/* Genel Bakiye - Siyah/Koyu Lacivert */}
                <div className="bg-slate-900 p-3 rounded-xl text-center shadow-xl flex flex-col justify-center">
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest border-b border-slate-700 pb-1">GENEL BAKİYE</div>
                    <div className="flex flex-col gap-0.5">
                        <div className="text-lg font-black text-white leading-none">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(portfolioTotalTRY)}
                        </div>
                        <div className="text-[10px] font-black text-blue-400 tabular-nums">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(portfolioTotalUSD)}
                        </div>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="w-24 py-3 px-4 text-[10px] font-black uppercase tracking-wider rounded-tl-lg">TARİH</th>
                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider">AÇIKLAMA / ÜRÜN DETAYI</th>
                            <th className="w-32 py-3 px-4 text-[10px] font-black uppercase tracking-wider text-right">İŞLEM TUTARI</th>
                            <th className="w-32 py-3 px-4 text-[10px] font-black uppercase tracking-wider text-right rounded-tr-lg">BAKİYE (TL)</th>
                        </tr>
                    </thead>
                    <tbody className="border-x border-slate-200">
                        {sortedDates.map((date) => {
                            const dailyItems = groups[date];
                            return dailyItems.map((item: any, idx: number) => {
                                const amountInTry = item.currency === 'USD' ? (item.amount * (item.rate || currentUsdRate)) : item.amount;
                                const isPayment = item.type === 'PAYMENT';
                                runningBalance += (isPayment ? -amountInTry : amountInTry);

                                return (
                                    <tr key={`${item.id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-2.5 px-4 text-[11px] font-bold text-slate-400 tabular-nums align-top">
                                            {idx === 0 ? format(new Date(date), 'dd.MM.yyyy') : ""}
                                        </td>
                                        <td className="py-2.5 px-4 align-top">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={cn(
                                                    "text-[12px] font-bold uppercase leading-normal tracking-tight",
                                                    isPayment ? "text-emerald-600 font-black" : "text-slate-900"
                                                )}>
                                                    {isPayment && "✓ "}
                                                    {item.notes || item.description || (isPayment ? 'TAHSİLAT' : 'ÜRÜN / HİZMET')}
                                                </span>
                                                {item.currency === 'USD' && (
                                                    <span className="text-[9px] font-bold text-blue-500 bg-blue-50 self-start px-1.5 rounded">
                                                        ${item.amount.toLocaleString('tr-TR')} (₺{(item.amount * (item.rate || currentUsdRate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                                            <span className={cn(
                                                "text-xs font-black tabular-nums",
                                                isPayment ? "text-emerald-600" : "text-slate-900"
                                            )}>
                                                {isPayment ? "-" : "+"}
                                                {new Intl.NumberFormat(item.currency === 'USD' ? 'en-US' : 'tr-TR', {
                                                    style: 'currency',
                                                    currency: item.currency || 'TRY'
                                                }).format(item.amount)}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                                            <span className="text-xs font-black text-slate-800 tabular-nums">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(runningBalance)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-200 flex justify-between items-end">
                <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Önemli Bilgilendirme</div>
                    <p className="text-[10px] leading-relaxed text-slate-400 max-w-lg italic">
                        * Bu ekstre bilgilendirme amaçlıdır. Hata olduğunu düşünüyorsanız bildiriniz.<br />
                        * Dövizli işlemler işlem tarihindeki TCMB Döviz Satış kuru üzerinden bakiye toplamına dahil edilmiştir.
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
