"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Receipt,
    Eye,
    EyeOff
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { ReceiptModalWrapper } from "@/components/common/receipt-modal-wrapper";
import { cn } from "@/lib/utils";
import { generateProfessionalPDF } from "@/lib/receipt-print-styles";
import { Dialog } from "@/components/ui/dialog";

interface DebtReceiptModalProps {
    open: boolean;
    onClose: () => void;
    customer: {
        id: string;
        name: string;
        phone?: string;
    };
    debts: any[];
    shopName?: string;
    shopPhone?: string;
    rates?: {
        usd: number;
    };
    initialShowPaid?: boolean;
    logoUrl?: string;
}

const ReceiptContent = ({ customer, debts, shopName, shopPhone, rates, showPaid, logoUrl, settings }: any) => {
    const unpaidDebts = debts.filter((d: any) => (d.type === 'DEBT' || !d.type) && !d.isPaid);

    const totalTRY = unpaidDebts
        .filter((d: any) => d.currency !== 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount || d.amount), 0);

    const totalUSD = unpaidDebts
        .filter((d: any) => d.currency === 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount || d.amount), 0);

    const currentUsdRate = Number(rates?.usd) || 34.5;
    const portfolioTotal = Math.ceil(totalTRY + (totalUSD * currentUsdRate));

    const unpaid = debts.filter((d: any) => (d.type === 'DEBT' || !d.type) && !d.isPaid);
    const earliestDate = (() => {
        if (unpaid.length === 0) return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sorted = [...unpaid].sort((a: any, b: any) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return da - db;
        });
        const first = new Date(sorted[0].createdAt);
        return !isNaN(first.getTime()) ? first : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    })();

    const displayDebts = debts.filter((d: any) => {
        if (showPaid) return true;
        if (d.type === 'PAYMENT') {
            const date = new Date(d.createdAt);
            if (isNaN(date.getTime())) return false;
            return date >= earliestDate;
        }
        return !d.isPaid;
    });

    const groups = displayDebts
        .sort((a: any, b: any) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return da - db;
        })
        .reduce((groups: any, item: any) => {
            const date = (() => {
                const d = new Date(item.createdAt);
                return !isNaN(d.getTime()) ? format(d, "dd MMM yyyy", { locale: tr }) : "-";
            })();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(item);
            return groups;
        }, {});

    const sortedDates = Object.keys(groups);

    return (
        <ReceiptTemplate
            settings={settings}
            subtitle={settings?.subtitle || "HESAP EKSTRESİ"}
        >
            {/* Customer Info */}
            <div className="mb-2 border-b-[1.5px] border-black pb-2">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-black">MÜŞTERİ</span>
                    <span className="text-[13px] font-black uppercase text-black">{customer?.name}</span>
                    {customer?.phone && (
                        <span className="text-[11px] font-bold text-black">{customer.phone}</span>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="space-y-2 mb-4 min-h-[50px]">
                {sortedDates.map((date) => {
                    const dailyTRY = groups[date]
                        .filter((item: any) => item.type !== 'PAYMENT' && item.currency !== 'USD')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);
                    const dailyUSD = groups[date]
                        .filter((item: any) => item.type !== 'PAYMENT' && item.currency === 'USD')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);
                    const dailyPayment = groups[date]
                        .filter((item: any) => item.type === 'PAYMENT')
                        .reduce((acc: number, item: any) => acc + Number(item.amount), 0);

                    return (
                        <div key={date}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-black uppercase tracking-[0.1em]">{date}</span>
                                    <div className="h-[1px] w-6 bg-black" />
                                </div>
                                <div className="text-[9px] font-black text-black flex items-center gap-1.5">
                                    {dailyTRY > 0 && <span>₺{dailyTRY.toLocaleString('tr-TR')}</span>}
                                    {dailyUSD > 0 && <span>${dailyUSD.toLocaleString('tr-TR')}</span>}
                                    {dailyPayment > 0 && <span className="border border-black px-1">(-₺{dailyPayment.toLocaleString('tr-TR')})</span>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                {groups[date].map((item: any, idx: number) => {
                                    const isPayment = item.type === 'PAYMENT';
                                    return (
                                        <div key={idx} className="flex justify-between items-start py-1.5 border-b border-black/5 last:border-0">
                                            <div className="flex flex-col flex-1 pr-4">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase leading-tight block w-full break-words",
                                                    isPayment ? "text-slate-700" : "text-black"
                                                )}>
                                                    {isPayment && "[TAHSİLAT] "}
                                                    {item.notes || item.description || (isPayment ? 'TAHSİLAT' : 'BORÇ KAYDI')}
                                                </span>
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <div className="text-[10px] font-black text-black">
                                                    {isPayment ? '-' : ''}{new Intl.NumberFormat(item.currency === 'USD' ? 'en-US' : 'tr-TR', {
                                                        style: 'currency',
                                                        currency: item.currency || 'TRY'
                                                    }).format(item.amount)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Final Totals */}
            <div className="border-t-[1.5px] border-black pt-2 space-y-1">
                <div className="flex justify-between items-center py-1">
                    <span className="text-[10px] font-black text-black uppercase">TL BORCU:</span>
                    <span className="text-[12px] font-black text-black">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalTRY)}</span>
                </div>
                {totalUSD > 0 && (
                    <div className="flex justify-between items-center py-1">
                        <span className="text-[10px] font-black text-black uppercase">USD BORCU:</span>
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-black text-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD)}</span>
                            <span className="text-[8px] font-bold text-black">(~₺{(totalUSD * currentUsdRate).toLocaleString('tr-TR')})</span>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center border-[1.5px] border-black p-2 mt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-black uppercase tracking-wider">GENEL TOPLAM</span>
                        <span className="text-[7px] font-bold text-black/60">KUR: $1 = ₺{currentUsdRate}</span>
                    </div>
                    <span className="text-lg font-black text-black">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(portfolioTotal)}</span>
                </div>

                {portfolioTotal <= 0 && (
                    <div className="mt-4 py-3 border-2 border-black border-dashed text-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">HESAP KAPALIDIR</span>
                    </div>
                )}
            </div>
        </ReceiptTemplate>
    );
};

export function DebtReceiptModal({ open, onClose, customer, debts, shopName, shopPhone, rates, initialShowPaid = false, logoUrl }: DebtReceiptModalProps) {
    const [showPaid, setShowPaid] = useState(initialShowPaid);
    const [settings, setSettings] = useState<any>(null);
    const pdfRef = useRef<HTMLDivElement>(null);

    const unpaidDebts = debts.filter((d: any) => (d.type === 'DEBT' || !d.type) && !d.isPaid);
    const totalTRY = unpaidDebts
        .filter((d: any) => d.currency !== 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount || d.amount), 0);
    const totalUSD = unpaidDebts
        .filter((d: any) => d.currency === 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount || d.amount), 0);
    const currentUsdRate = Number(rates?.usd) || 34.5;
    const portfolioTotal = Math.ceil(totalTRY + (totalUSD * currentUsdRate));

    useEffect(() => {
        if (open) {
            getReceiptSettings("debt").then(setSettings);
        }
    }, [open]);

    const handlePDF = async () => {
        if (!pdfRef.current) return;
        await generateProfessionalPDF(
            pdfRef.current,
            `ekstre-${customer.name.replace(/\s+/g, "-")}.pdf`
        );
    };

    const currentPaperSize = settings?.paperSize || "72mm";

    const displayDebts = debts.filter(d => showPaid || !d.isPaid)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* Hidden PDF Template for Capture */}
            <div className="fixed -left-[4000px] top-0 pointer-events-none pr-4">
                <div ref={pdfRef} className="w-[800px] p-12 bg-white text-black font-sans box-border" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black uppercase tracking-widest mb-2">{settings?.title || shopName || "DÜKKAN"}</h1>
                        <p className="text-base font-bold text-slate-600">{settings?.phone || shopPhone}</p>
                    </div>

                    <div className="h-[2px] bg-black mb-10" />

                    {/* Customer & Info */}
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">MÜŞTERİ BİLGİLERİ</h2>
                            <p className="text-2xl font-black text-black leading-tight">{customer.name}</p>
                            {customer.phone && <p className="text-lg font-bold text-slate-700 mt-1">{customer.phone}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Döküm Tarihi</p>
                            <p className="text-lg font-black">{format(new Date(), "dd.MM.yyyy")}</p>
                        </div>
                    </div>

                    {/* Table / List */}
                    <div className="space-y-8 mb-10">
                        {Object.entries(
                            displayDebts.reduce((acc: any, debt: any) => {
                                const date = format(new Date(debt.createdAt), "dd.MM.yyyy");
                                if (!acc[date]) acc[date] = [];
                                acc[date].push(debt);
                                return acc;
                            }, {})
                        ).map(([date, items]: [string, any], groupIdx) => (
                            <div key={groupIdx} className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="bg-slate-900 px-6 py-3 flex justify-between items-center">
                                    <span className="text-white text-[11px] font-black uppercase tracking-widest">{date}</span>
                                    <span className="text-slate-400 text-[10px] font-bold">GÜNLÜK İŞLEMLER</span>
                                </div>
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {items.map((item: any, idx: number) => {
                                            const isPayment = item.type === 'PAYMENT';
                                            return (
                                                <tr key={idx} className={cn(
                                                    "border-b border-slate-100 last:border-0",
                                                    isPayment ? "bg-emerald-50/30" : "bg-white"
                                                )}>
                                                    <td className="py-5 px-6">
                                                        <span className={cn(
                                                            "text-sm font-black uppercase tracking-tight",
                                                            isPayment ? "text-emerald-700" : "text-black"
                                                        )}>
                                                            {isPayment && "[TAHSİLAT] "}
                                                            {item.notes || item.description || (isPayment ? 'TAHSİLAT' : 'BORÇ KAYDI')}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-6 text-right w-[180px]">
                                                        <span className={cn(
                                                            "text-base font-black tabular-nums",
                                                            isPayment ? "text-emerald-700" : "text-black"
                                                        )}>
                                                            {isPayment ? '-' : ''}{new Intl.NumberFormat(item.currency === 'USD' ? 'en-US' : 'tr-TR', {
                                                                style: 'currency',
                                                                currency: item.currency || 'TRY'
                                                            }).format(item.amount)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end pr-2">
                        <div className="w-[320px] space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TOPLAM TL BORCU:</span>
                                <span className="text-lg font-black text-black">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalTRY)}
                                </span>
                            </div>

                            {totalUSD > 0 && (
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TOPLAM USD BORCU:</span>
                                    <span className="text-lg font-black text-black">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD)}
                                    </span>
                                </div>
                            )}

                            <div className="h-[2px] bg-black my-4" />

                            <div className="flex justify-between items-center p-6 bg-slate-900 rounded-2xl shadow-xl">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">GENEL TOPLAM:</span>
                                <span className="text-3xl font-black text-white">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(portfolioTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-24 text-center border-t border-slate-100 pt-8">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] italic leading-relaxed">
                            Bu belge sistem tarafından otomatik oluşturulmuştur.<br />
                            {settings?.shopName || shopName} - {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </div>

            <ReceiptModalWrapper
                open={open}
                onClose={onClose}
                title={customer.name}
                subtitle="Hesap Ekstresi"
                printTitle={`Borç Ekstresi - ${customer.name}`}
                paperSize={currentPaperSize}
                downloadFilename={`ekstre-${customer.name.replace(/\s+/g, "-")}.png`}
                whatsappPhone={customer.phone}
                onPDF={handlePDF}
                icon={<Receipt className="h-4 w-4 text-foreground" />}
                headerActions={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPaid(!showPaid)}
                        className={cn(
                            "rounded-xl gap-2 text-[9px] font-black uppercase tracking-widest h-9 px-3 border",
                            showPaid
                                ? "bg-muted text-foreground hover:bg-muted/80 border-border/50"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted border-border/30"
                        )}
                    >
                        {showPaid ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {showPaid ? "Gizle" : "Tümü"}
                    </Button>
                }
            >
                {(receiptRef) => (
                    <div ref={receiptRef}>
                        <ReceiptContent
                            customer={customer}
                            debts={debts}
                            shopName={settings?.title || shopName}
                            shopPhone={settings?.phone || shopPhone}
                            rates={rates}
                            showPaid={showPaid}
                            logoUrl={settings?.logoUrl || logoUrl}
                            settings={settings}
                        />
                    </div>
                )}
            </ReceiptModalWrapper>
        </Dialog>
    );
}
