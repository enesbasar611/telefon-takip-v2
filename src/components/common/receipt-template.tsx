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
                "bg-white text-black p-6 font-mono relative border-0",
                paperSizeVal === "58mm" ? "w-[58mm] text-[10px]" :
                    paperSizeVal === "80mm" ? "w-[80mm] text-[13px]" :
                        "w-[72mm] text-[11px]"
            )}
            style={{ boxSizing: "border-box" }}
        >
            {/* Header */}
            <div className="text-center border-b-[1.5px] border-black pb-4 mb-4">
                {settings?.logoUrl && (
                    <div className="mb-3 flex justify-center">
                        <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto grayscale contrast-[2]" />
                    </div>
                )}
                <h3 className="font-black text-lg uppercase text-black leading-tight tracking-tight">
                    {settings?.title || "FİRMA ÜNVANI"}
                </h3>
                {subtitle && (
                    <p className="text-[9px] font-black mt-1 uppercase text-black leading-tight border border-black inline-block px-2 py-0.5 mt-2">
                        {subtitle}
                    </p>
                )}

                <div className="mt-3 space-y-0.5 text-[9px] font-black text-black">
                    <p>TEL: {settings?.phone || "05xx xxx xx xx"}</p>
                    {settings?.website && <p>{settings.website}</p>}
                    {settings?.address && <p className="px-2 leading-tight">{settings.address}</p>}
                </div>
            </div>

            {/* Content Slot */}
            <div className="flex-1 select-none">
                {children}
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t-[1.5px] border-black border-dashed mt-6">
                {settings?.terms && (
                    <div className="text-[7px] border-b border-black border-dotted mb-3 pb-2 whitespace-pre-wrap leading-tight font-bold text-left italic">
                        {settings.terms}
                    </div>
                )}

                <p className="font-black text-[10px] uppercase mb-1 text-black leading-tight">
                    {settings?.footer || "Bizi Tercih Ettiğiniz İçin Teşekkürler"}
                </p>

                {settings?.footer2 && (
                    <p className="font-bold text-[8px] uppercase mb-1 text-black">
                        {settings.footer2}
                    </p>
                )}

                {showDate && (
                    <p className="text-[8px] font-bold mt-2 text-black border-t border-black pt-2">
                        {format(date, "dd.MM.yyyy HH:mm")}
                    </p>
                )}
            </div>
        </div>
    );
};
