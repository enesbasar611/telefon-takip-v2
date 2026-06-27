"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Receipt, Eye, EyeOff, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { ReceiptModalWrapper } from "@/components/common/receipt-modal-wrapper";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateProfessionalPDF } from "@/lib/receipt-print-styles";

import { DebtStatementModern } from "./debt-statement-modern";
import { useQuery } from "@tanstack/react-query";
import { getCurrentExchangeRates } from "@/lib/actions/currency-actions";

interface DebtReceiptModalProps {
    open: boolean;
    onClose: () => void;
    customer: any;
    debts: any[];
    shopName?: string;
    shopPhone?: string;
    shopAddress?: string;
    shopWebsite?: string;
    shopLogo?: string;
    rates?: any;
    initialShowPaid?: boolean;
    defaultCurrency?: string;
}

const ReceiptContent = ({
    customer,
    debts = [],
    shopName,
    shopPhone,
    shopAddress,
    shopWebsite,
    shopLogo,
    rates,
    showPaid = false,
    settings,
    defaultCurrency = 'TRY'
}: any) => {
    const unpaidDebts = debts.filter((d: any) => (d.type === 'DEBT' || !d.type) && !d.isPaid);

    const totalTRY = unpaidDebts
        .filter((d: any) => d.currency !== 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount || d.amount), 0);

    const totalUSD = unpaidDebts
        .filter((d: any) => d.currency === 'USD')
        .reduce((acc: number, d: any) => acc + Number(d.remainingAmount || d.amount), 0);

    const currentUsdRate = Number(rates?.usd || rates?.rates?.USD || rates?.USD) || 32.50;
    const portfolioTotalTRY = Math.ceil(totalTRY + (totalUSD * currentUsdRate));
    const portfolioTotalUSD = (totalTRY / currentUsdRate) + totalUSD;

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
            shopName={shopName}
            shopPhone={shopPhone}
            shopAddress={shopAddress}
            shopWebsite={shopWebsite}
            shopLogo={shopLogo}
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
                        <span className="text-[7px] font-bold text-black/60 font-sans">KUR: $1 = ₺{currentUsdRate.toFixed(2)}</span>
                    </div>
                    <span className="text-lg font-black text-black">
                        {defaultCurrency === 'USD'
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(portfolioTotalUSD)
                            : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(portfolioTotalTRY)
                        }
                    </span>
                </div>

                {unpaidDebts.length === 0 && (
                    <div className="mt-4 py-3 border-2 border-black border-dashed text-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">HESAP KAPALIDIR</span>
                    </div>
                )}
            </div>
        </ReceiptTemplate>
    );
};

export function DebtReceiptModal({
    open,
    onClose,
    customer,
    debts = [],
    shopName,
    shopPhone,
    shopAddress,
    shopWebsite,
    shopLogo,
    rates,
    initialShowPaid = false,
    defaultCurrency = 'TRY'
}: DebtReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const [showPaid, setShowPaid] = useState(initialShowPaid);

    const { data: liveRates } = useQuery({
        queryKey: ["rates"],
        queryFn: () => getCurrentExchangeRates(),
        refetchInterval: 60000 // 1 dakikada bir yenile
    });

    const activeRates = liveRates || rates;

    useEffect(() => {
        if (open) {
            getReceiptSettings("debt").then(setSettings);
        }
    }, [open]);

    const [pdfLoading, setPdfLoading] = useState(false);

    const handlePDF = async () => {
        try {
            setPdfLoading(true);
            const id = `debt-statement-modern-${customer.id}`;
            const element = document.getElementById(id);

            if (!element) {
                toast.error("PDF hazırlanamadı: Görünüm oluşturulamadı");
                return;
            }

            // Gerekli fontlar ve resimlerin render olması için kısa bir bekleme
            await new Promise(resolve => setTimeout(resolve, 200));

            await generateProfessionalPDF(element, `ekstre-${customer.name.replace(/\s+/g, "-")}`);
            toast.success("PDF başarıyla oluşturuldu");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("PDF oluşturulurken hata oluştu");
        } finally {
            setPdfLoading(false);
        }
    };

    const currentPaperSize = settings?.paperSize || "72mm";

    return (
        <>
            <ReceiptModalWrapper
                open={open}
                onClose={onClose}
                title="Borç Ekstresi"
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
                    <div ref={receiptRef} id={`debt-receipt-${customer.id}`}>
                        <ReceiptContent
                            customer={customer}
                            debts={debts}
                            shopName={shopName}
                            shopPhone={shopPhone}
                            shopAddress={shopAddress}
                            shopWebsite={shopWebsite}
                            shopLogo={shopLogo}
                            rates={activeRates}
                            showPaid={showPaid}
                            settings={settings}
                            defaultCurrency={defaultCurrency}
                        />
                    </div>
                )}
            </ReceiptModalWrapper>

            {/* Hidden modern statement for PDF export - Moved outside to prevent clipping */}
            <div
                id={`debt-statement-modern-${customer.id}`}
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: '0',
                    width: '210mm',
                    height: 'auto',
                    opacity: 1,
                    visibility: 'visible',
                    zIndex: -9999,
                    pointerEvents: 'none',
                    background: 'white'
                }}
            >
                {open && (
                    <DebtStatementModern
                        customer={customer}
                        debts={debts}
                        shopName={shopName!}
                        shopPhone={shopPhone}
                        shopAddress={shopAddress}
                        shopWebsite={shopWebsite}
                        shopLogo={shopLogo}
                        rates={activeRates}
                        showPaid={showPaid}
                        defaultCurrency={defaultCurrency}
                    />
                )}
            </div>
        </>
    );
}
