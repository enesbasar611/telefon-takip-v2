"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ReceiptTemplateProps {
    settings: any;
    subtitle?: string;
    children: React.ReactNode;
    showDate?: boolean;
    date?: Date;
    showBarcode?: boolean;
    barcodeValue?: string;
    paperSize?: string;
}

export const ReceiptTemplate = ({
    settings,
    subtitle,
    children,
    showDate = true,
    date = new Date(),
    paperSize,
}: ReceiptTemplateProps) => {
    const paperSizeVal = paperSize || settings?.paperSize || "72mm";

    return (
        <div
            className={cn(
                "bg-white text-black p-6 font-sans relative border-0",
                paperSizeVal === "58mm" ? "w-[58mm] text-[10px]" :
                    paperSizeVal === "80mm" ? "w-[80mm] text-[13px]" :
                        "w-[72mm] text-[11px]"
            )}
            style={{ boxSizing: "border-box" }}
        >
            {/* Top Right Date */}
            {showDate && (
                <div className="absolute top-2 right-2 text-[7px] font-bold text-black border border-black/20 px-1 py-0.5 rounded">
                    {format(date, "dd.MM.yyyy HH:mm")}
                </div>
            )}

            {/* Header */}
            <div className="text-center border-b-[1.5px] border-black pb-2 mb-3">
                {settings?.logoUrl && (
                    <div className="mb-2 flex justify-center">
                        <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto grayscale contrast-[2]" />
                    </div>
                )}
                <h3 className="font-black text-base uppercase text-black leading-none tracking-tight">
                    {settings?.title || "FİRMA ÜNVANI"}
                </h3>
                {subtitle && (
                    <p className="text-[8px] font-black uppercase text-black leading-none border border-black inline-block px-1.5 py-0.5 mt-1.5">
                        {subtitle}
                    </p>
                )}

                <div className="mt-1.5 text-[8px] font-black text-black leading-tight">
                    <p>TEL: {settings?.phone || "05xx xxx xx xx"}</p>
                    {settings?.website && <p>{settings.website}</p>}
                    {settings?.address && <p className="px-1">{settings.address}</p>}
                </div>
            </div>

            {/* Content Slot */}
            <div className="flex-1 select-none">
                {children}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t-[1.5px] border-black border-dashed mt-4">
                {settings?.terms && (
                    <div className="text-[7px] border-b border-black border-dotted mb-2 pb-1.5 whitespace-pre-wrap leading-tight font-bold text-left italic">
                        {settings.terms}
                    </div>
                )}

                <p className="font-black text-[9px] uppercase mb-1 text-black leading-tight">
                    {settings?.footer || "Bizi Tercih Ettiğiniz İçin Teşekkürler"}
                </p>

                {settings?.footer2 && (
                    <p className="font-bold text-[7px] uppercase text-black">
                        {settings.footer2}
                    </p>
                )}
            </div>
        </div>
    );
};
