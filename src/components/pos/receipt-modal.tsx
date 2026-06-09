"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { ReceiptModalWrapper } from "@/components/common/receipt-modal-wrapper";
import { cn } from "@/lib/utils";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

const POSReceiptContent = ({ sale, settings, currencySymbol, defaultCurrency }: any) => {
  if (!sale) return null;

  return (
    <ReceiptTemplate
      settings={settings}
      subtitle={settings?.subtitle || "SATIŞ FİŞİ"}
      date={sale.createdAt ? new Date(sale.createdAt) : undefined}
    >
      {/* Customer Info */}
      <div className="mb-4 border-b-[1.5px] border-black pb-3">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-black">MÜŞTERİ</span>
          <span className="text-[13px] font-black uppercase text-black">
            {sale.customer?.name || "HIZLI SATIŞ"}
          </span>
          {sale.customer?.phone && (
            <span className="text-[11px] font-bold text-black">{sale.customer.phone}</span>
          )}
        </div>
      </div>

      {/* Sale Info */}
      <div className="mb-4 border-b-[1.5px] border-black pb-3">
        <div className="flex justify-between items-baseline">
          <span className="font-black text-[9px] text-black uppercase">FİŞ NO:</span>
          <span className="font-black text-sm text-black">{sale.saleNumber}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6 min-h-[50px]">
        {sale.items?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between items-start py-1 border-b border-black/5 last:border-0">
            <div className="flex flex-col flex-1 pr-4">
              <span className="text-[9px] font-black uppercase leading-none truncate max-w-[160px] block text-black">
                {item.product?.name}
              </span>
              <span className="text-[9px] font-bold text-black/60">
                {item.quantity} ADET x {currencySymbol}{Number(item.unitPrice / (defaultCurrency === 'USD' ? 34.5 : 1)).toFixed(2)}
              </span>
            </div>
            <div className="text-right whitespace-nowrap">
              <div className="text-[11px] font-black text-black">
                {currencySymbol}{Number(item.totalPrice / (defaultCurrency === 'USD' ? 34.5 : 1)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t-[1.5px] border-black pt-4 space-y-2">
        <div className="flex justify-between items-center py-1">
          <span className="text-[10px] font-black text-black uppercase">ÖDEME YÖNTEMİ:</span>
          <span className="text-[11px] font-black text-black uppercase">{sale.paymentMethod}</span>
        </div>

        <div className="flex justify-between items-center border-[1.5px] border-black p-2 mt-2 font-sans">
          <span className="text-[10px] font-black text-black uppercase tracking-wider">GENEL TOPLAM</span>
          <span className="text-lg font-black text-black">
            {currencySymbol}{Number(sale.finalAmount / (defaultCurrency === 'USD' ? 34.5 : 1)).toFixed(2)}
          </span>
        </div>
      </div>
    </ReceiptTemplate>
  );
};

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  const [settings, setSettings] = useState<any>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<string>("TRY");

  useEffect(() => {
    if (isOpen) {
      getReceiptSettings("pos").then(setSettings);
      import("@/lib/actions/setting-actions").then(m => {
        m.getSettings().then(s => {
          const curr = s.find((a: any) => a.key === "defaultCurrency")?.value || "TRY";
          setDefaultCurrency(curr);
        });
      });
    }
  }, [isOpen]);

  const currencySymbol = defaultCurrency === "USD" ? "$" : (defaultCurrency === "EUR" ? "€" : "₺");
  const currentPaperSize = settings?.paperSize || "72mm";

  if (!sale) return null;

  return (
    <ReceiptModalWrapper
      open={isOpen}
      onClose={onClose}
      title={sale.saleNumber}
      subtitle="Satış Fişi"
      printTitle={`Satış Fişi - ${sale.saleNumber}`}
      paperSize={currentPaperSize}
      downloadFilename={`fis-${sale.saleNumber || "satis"}.png`}
      whatsappPhone={sale.customer?.phone}
      icon={<Receipt className="h-4 w-4 text-foreground" />}
      headerActions={
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Başarılı</span>
        </div>
      }
    >
      {(receiptRef, widthClass) => (
        <div ref={receiptRef} className={widthClass}>
          <POSReceiptContent
            sale={sale}
            settings={settings}
            currencySymbol={currencySymbol}
            defaultCurrency={defaultCurrency}
          />
        </div>
      )}
    </ReceiptModalWrapper>
  );
}

