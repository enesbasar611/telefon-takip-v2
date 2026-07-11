"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Receipt, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { ReceiptModalWrapper } from "@/components/common/receipt-modal-wrapper";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { generateProfessionalPDF, generateProfessionalPDFBlob } from "@/lib/receipt-print-styles";
import {
    buildOpenDebtStatementEntries,
    buildDebtStatementEntries,
    getCurrentDebtTotals
} from "@/lib/debt-statement-calculator";

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
    autoPDF?: boolean;
    onAutoPDFComplete?: () => void;
}

const formatTRY = (amount: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
const formatUSD = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
    const currentUsdRate = Number(rates?.usd || rates?.rates?.USD || rates?.USD) || 1;
    const currentTotals = getCurrentDebtTotals(debts);
    const totalTRY = currentTotals.try;
    const totalUSD = currentTotals.usd;
    const portfolioTotalTRY = Math.ceil(totalTRY + (totalUSD * currentUsdRate));
    const portfolioTotalUSD = (totalTRY / currentUsdRate) + totalUSD;

    const unpaid = debts.filter((d: any) => (
        (d.type === 'DEBT' || !d.type)
        && !d.isPaid
        && Number(d.remainingAmount ?? d.amount ?? 0) > 0
    ));
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
        return (d.type === 'DEBT' || !d.type) && !d.isPaid && Number(d.remainingAmount ?? d.amount ?? 0) > 0;
    });

    const statementEntries = showPaid
        ? buildDebtStatementEntries(displayDebts, currentUsdRate)
        : buildOpenDebtStatementEntries(debts, currentUsdRate);

    const groups = statementEntries
        .reduce((groups: any, item: any) => {
            const date = (() => {
                const d = new Date(item.date);
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
                        .filter((entry: any) => entry.type !== 'PAYMENT' && entry.currency !== 'USD')
                        .reduce((acc: number, entry: any) => acc + Number(entry.amount), 0);
                    const dailyUSD = groups[date]
                        .filter((entry: any) => entry.type !== 'PAYMENT' && entry.currency === 'USD')
                        .reduce((acc: number, entry: any) => acc + Number(entry.amount), 0);
                    const dailyPayment = groups[date]
                        .filter((entry: any) => entry.type === 'PAYMENT')
                        .reduce((acc: number, entry: any) => acc + Number(entry.amount), 0);

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
                                {groups[date].map((entry: any, idx: number) => {
                                    const item = entry.item;
                                    const isPayment = entry.type === 'PAYMENT';
                                    const paidAmount = Number(entry.paidAmount || 0);
                                    const remainingAmount = Number(entry.remainingAmount || 0);
                                    const formatEntryCurrency = (amount: number) => entry.currency === 'USD' ? formatUSD(amount) : formatTRY(amount);
                                    return (
                                        <div key={idx} className="flex justify-between items-start py-1.5 border-b border-black/5 last:border-0">
                                            <div className="flex flex-col flex-1 pr-4">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase leading-tight block w-full break-words",
                                                    isPayment ? "text-slate-700" : "text-black"
                                                )}>
                                                    {isPayment && "[TAHSİLAT] "}
                                                    {item.notes || item.description || (isPayment ? 'TAHSİLAT' : 'BORÇ KAYDI')}
                                                    <span className="block text-[8px] font-bold text-black/60 mt-0.5">
                                                        {!showPaid && !isPayment
                                                            ? `Kalan: ${formatEntryCurrency(remainingAmount)}${paidAmount > 0 ? ` / Odenen: ${formatEntryCurrency(paidAmount)}` : ""}`
                                                            : `Kalan: TL ${entry.runningTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${entry.runningUSD > 0 ? ` + $${entry.runningUSD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}`}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <div className="text-[10px] font-black text-black">
                                                    {isPayment ? '-' : ''}{new Intl.NumberFormat(entry.currency === 'USD' ? 'en-US' : 'tr-TR', {
                                                        style: 'currency',
                                                        currency: entry.currency || 'TRY'
                                                    }).format(entry.amount)}
                                                    {isPayment && entry.currency === 'TRY' && (
                                                        <span className="block text-[8px] font-bold text-black/55">
                                                            ({formatUSD(entry.amountUSD)})
                                                        </span>
                                                    )}
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
                    <span className="text-[12px] font-black text-black">{formatTRY(totalTRY)}</span>
                </div>
                {totalUSD > 0 && (
                    <div className="flex justify-between items-center py-1">
                        <span className="text-[10px] font-black text-black uppercase">USD BORCU:</span>
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-black text-black">{formatUSD(totalUSD)}</span>
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
                            ? formatUSD(portfolioTotalUSD)
                            : formatTRY(portfolioTotalTRY)
                        }
                    </span>
                </div>

                {unpaid.length === 0 && (
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
    defaultCurrency = 'TRY',
    autoPDF = false,
    onAutoPDFComplete
}: DebtReceiptModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const [showPaid, setShowPaid] = useState(initialShowPaid);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappMessage, setWhatsappMessage] = useState("");
    const [whatsappPdf, setWhatsappPdf] = useState<{ filename: string; url: string } | null>(null);

    const { data: liveRates } = useQuery({
        queryKey: ["rates"],
        queryFn: () => getCurrentExchangeRates(),
        refetchInterval: 60000 // 1 dakikada bir yenile
    });

    const activeRates = liveRates || rates;
    const customerSlug = (customer?.name || "musteri").replace(/\s+/g, "-");
    const pdfFilename = `ekstre-${customerSlug}.pdf`;

    useEffect(() => {
        if (open) {
            getReceiptSettings("debt").then(setSettings);
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (whatsappPdf?.url) URL.revokeObjectURL(whatsappPdf.url);
        };
    }, [whatsappPdf?.url]);

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

            await generateProfessionalPDF(element, pdfFilename);
            toast.success("PDF başarıyla oluşturuldu");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("PDF oluşturulurken hata oluştu");
        } finally {
            setPdfLoading(false);
        }
    };

    const handleWhatsAppPDF = async () => {
        try {
            setPdfLoading(true);
            const id = `debt-statement-modern-${customer.id}`;
            const element = document.getElementById(id);

            if (!element) {
                toast.error("WhatsApp PDF hazirlanamadi: PDF gorunumu olusmadi");
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            const blob = await generateProfessionalPDFBlob(element);

            if (!blob) {
                toast.error("WhatsApp PDF hazirlanamadi");
                return;
            }

            if (whatsappPdf?.url) URL.revokeObjectURL(whatsappPdf.url);
            const url = URL.createObjectURL(blob);
            setWhatsappPdf({ filename: pdfFilename, url });
            setWhatsappMessage(
                `Merhaba ${customer?.name || ""},\n\nGuncel borc ekstresini PDF olarak iletiyorum.\n\nIyi gunler dileriz.`
            );
            setWhatsappModalOpen(true);
            toast.success("PDF hazirlandi, WhatsApp mesaji aciliyor");
        } catch (error) {
            console.error("WhatsApp PDF Error:", error);
            toast.error("WhatsApp PDF hazirlanirken hata olustu");
        } finally {
            setPdfLoading(false);
        }
    };

    const downloadWhatsAppPdf = () => {
        if (!whatsappPdf) return;
        const a = document.createElement("a");
        a.href = whatsappPdf.url;
        a.download = whatsappPdf.filename;
        a.click();
    };

    const autoPDFKeyRef = useRef<string>("");
    useEffect(() => {
        if (!open || !autoPDF || !settings || !customer?.id) return;

        const key = `${customer.id}-${debts.length}-${showPaid}`;
        if (autoPDFKeyRef.current === key) return;
        autoPDFKeyRef.current = key;

        const timer = window.setTimeout(() => {
            handlePDF().finally(() => onAutoPDFComplete?.());
        }, 350);

        return () => window.clearTimeout(timer);
    }, [open, autoPDF, settings, customer?.id, debts.length, showPaid, onAutoPDFComplete]);

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
                onWhatsApp={handleWhatsAppPDF}
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

            <WhatsAppConfirmModal
                isOpen={whatsappModalOpen}
                onClose={() => setWhatsappModalOpen(false)}
                phone={customer?.phone || ""}
                customerName={customer?.name}
                initialMessage={whatsappMessage}
                attachment={whatsappPdf ? {
                    filename: whatsappPdf.filename,
                    url: whatsappPdf.url,
                    description: "PDF hazir. Gonder tusuna basinca dosya indirilecek; WhatsApp sohbetinde belge olarak ekleyin."
                } : undefined}
                onBeforeSend={downloadWhatsAppPdf}
            />
        </>
    );
}
