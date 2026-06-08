"use client";

import { useRef, useState, useCallback, ReactNode, RefObject } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { printReceipt, downloadReceiptImage, generateReceiptImage, getReceiptWidthClass } from "@/lib/receipt-print-styles";

interface ReceiptModalWrapperProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    printTitle: string;
    paperSize?: string;
    downloadFilename: string;
    /** WhatsApp phone number (raw digits) */
    whatsappPhone?: string;
    /** Custom action to replace default WhatsApp behavior */
    onWhatsApp?: () => void;
    /** Additional header actions (e.g. toggle buttons) */
    headerActions?: ReactNode;
    /** The receipt content to render inside the preview area */
    children: (receiptRef: RefObject<HTMLDivElement>, widthClass: string) => ReactNode;
    /** Icon to show in the header */
    icon?: ReactNode;
}

export function ReceiptModalWrapper({
    open,
    onClose,
    title,
    subtitle,
    printTitle,
    paperSize = "72mm",
    downloadFilename,
    whatsappPhone,
    onWhatsApp,
    headerActions,
    children,
    icon,
}: ReceiptModalWrapperProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const widthClass = getReceiptWidthClass(paperSize);

    const handlePrint = useCallback(() => {
        printReceipt(receiptRef, paperSize, printTitle);
    }, [paperSize, printTitle]);

    const handleDownload = useCallback(async () => {
        setIsGenerating(true);
        try {
            await downloadReceiptImage(receiptRef, downloadFilename);
        } finally {
            setIsGenerating(false);
        }
    }, [downloadFilename]);

    const handleWhatsApp = useCallback(async () => {
        if (onWhatsApp) {
            onWhatsApp();
            return;
        }

        const phoneClean = whatsappPhone?.replace(/[^0-9]/g, "") || "";
        const waUrl = phoneClean
            ? `https://wa.me/90${phoneClean.replace(/^0/, "")}`
            : "https://web.whatsapp.com";

        const waWindow = window.open(waUrl, "_blank");

        setIsGenerating(true);
        try {
            const blob = await generateReceiptImage(receiptRef);
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = downloadFilename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        } finally {
            setIsGenerating(false);
        }

        if (waWindow) waWindow.focus();
    }, [whatsappPhone, downloadFilename, onWhatsApp]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[500px] p-0 gap-0 bg-[#0F172A] border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-muted/30 pr-14 text-foreground">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="p-1.5 rounded-lg bg-muted border border-border/50">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h2>
                            {subtitle && (
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {headerActions}
                </div>

                {/* Preview Area - Thermal paper simulation */}
                <div className="bg-slate-200 dark:bg-[#0F172A] p-6 border-y-4 border-slate-300 dark:border-zinc-800">
                    <div className="max-h-[55vh] overflow-y-auto rounded-2xl bg-white shadow-2xl custom-scrollbar flex justify-center py-6">
                        {children(receiptRef, widthClass)}
                    </div>
                </div>

                {/* Bottom Actions - Monochrome neutral buttons */}
                <div className="p-5 flex flex-wrap items-center gap-3 bg-muted/20 border-t border-border/30">
                    <Button
                        variant="destructive"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all font-black text-[9px] uppercase tracking-widest active:scale-95 shadow-lg shadow-red-500/10 min-w-[100px]"
                    >
                        Kapat
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="h-12 rounded-xl gap-2 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all border-border/50 text-foreground hover:bg-muted px-4"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleWhatsApp}
                        disabled={isGenerating}
                        className="flex-1 h-12 rounded-xl gap-2 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all border-border/50 text-foreground hover:bg-muted"
                    >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Button>
                    <Button
                        onClick={handlePrint}
                        disabled={isGenerating}
                        className="flex-1 h-12 rounded-xl gap-2 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all bg-foreground text-background hover:bg-foreground/90 shadow-lg"
                    >
                        <Printer className="h-4 w-4" /> Yazdır
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
