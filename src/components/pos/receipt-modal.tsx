"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle2, Globe, Monitor, MessageCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { ReceiptModalWrapper } from "@/components/common/receipt-modal-wrapper";
import { cn } from "@/lib/utils";
import { formatWhatsAppLink, sanitizeWhatsAppPhone } from "@/lib/utils/notifications";
import { toast } from "sonner";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  rates?: { usd: number; eur: number };
  initialDefaultCurrency?: string;
}

const POSReceiptContent = ({ sale, settings, selectedCurrency, shopName, shopPhone, shopAddress, shopLogo, shopWebsite, rates, customPhone }: any) => {
  if (!sale) return null;

  const usdRate = Number(rates?.usd || rates?.USD || 34.5);

  const getPriceTRY = (price: number) => {
    const saleCurrency = sale?.transaction?.currency || sale?.currency || "TRY";
    if (saleCurrency === "USD") {
      return (Number(price) * usdRate).toFixed(2);
    }
    return Number(price).toFixed(2);
  };

  const getPriceUSD = (price: number) => {
    const saleCurrency = sale?.transaction?.currency || sale?.currency || "TRY";
    if (saleCurrency === "USD") {
      return Number(price).toFixed(2);
    }
    return (Number(price) / usdRate).toFixed(2);
  };

  const isUSD = selectedCurrency === "USD";
  const paymentMethodMap: Record<string, string> = {
    CASH: "NAKİT",
    CREDIT_CARD: "KREDİ KARTI",
    CARD: "KREDİ KARTI",
    BANK_TRANSFER: "HAVALE",
    TRANSFER: "HAVALE / EFT",
    DEBT: "VERESİYE",
    MIXED: "PARÇALI"
  };

  return (
    <ReceiptTemplate
      settings={settings}
      subtitle={settings?.subtitle || "SATIŞ FİŞİ"}
      date={sale.createdAt ? new Date(sale.createdAt) : undefined}
      shopName={shopName}
      shopPhone={shopPhone}
      shopAddress={shopAddress}
      shopLogo={shopLogo}
      shopWebsite={shopWebsite}
    >
      {/* Müşteri & Fiş No Kompakt Başlık */}
      <div className="mb-2 border-b-[1.5px] border-black pb-1.5 flex justify-between items-start gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[7.5px] font-black text-black/60 uppercase leading-none">MÜŞTERİ</span>
          <span className="text-[11px] font-black uppercase text-black leading-tight truncate">
            {sale.customer?.name || "HIZLI SATIŞ"}
          </span>
          {(customPhone || sale.customer?.phone) && (
            <span className="text-[9.5px] font-bold text-black leading-none mt-0.5">
              {customPhone || sale.customer.phone}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-[7.5px] font-black text-black/60 uppercase block leading-none">FİŞ NO</span>
          <span className="font-black text-xs text-black leading-tight block mt-0.5">{sale.saleNumber}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1 mb-2">
        {sale.items?.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between items-start py-0.5 border-b border-black/5 last:border-0">
            <div className="flex flex-col flex-1 pr-2 min-w-0">
              <span className="text-[9.5px] font-black uppercase leading-tight block text-black truncate">
                {item.product?.name}
              </span>
              <span className="text-[8.5px] font-bold text-black/70 leading-tight">
                {item.quantity} ADET x {isUSD ? `$${getPriceUSD(item.unitPrice)} (₺${getPriceTRY(item.unitPrice)})` : `₺${getPriceTRY(item.unitPrice)}`}
              </span>
            </div>
            <div className="text-right whitespace-nowrap shrink-0">
              <div className="text-[10.5px] font-black text-black leading-tight">
                {isUSD ? `$${getPriceUSD(item.totalPrice)}` : `₺${getPriceTRY(item.totalPrice)}`}
              </div>
              {isUSD && (
                <div className="text-[8px] font-bold text-black/70 leading-tight">
                  (₺{getPriceTRY(item.totalPrice)})
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t-[1.5px] border-black pt-1.5 space-y-1">
        <div className="flex justify-between items-center py-0.5">
          <span className="text-[9px] font-black text-black uppercase">ÖDEME YÖNTEMİ:</span>
          <span className="text-[10px] font-black text-black uppercase">
            {paymentMethodMap[sale.paymentMethod || "CASH"] || sale.paymentMethod}
          </span>
        </div>

        <div className="flex flex-col border-[1.5px] border-black mt-1 p-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-black text-black uppercase tracking-wider">GENEL TOPLAM</span>
            <span className="text-base font-black text-black">
              {isUSD ? `$${getPriceUSD(sale.finalAmount)}` : `₺${getPriceTRY(sale.finalAmount)}`}
            </span>
          </div>
          {isUSD && (
            <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-black/15 text-black">
              <span className="text-[8px] font-bold uppercase opacity-75">TL KARŞILIĞI:</span>
              <span className="text-[9.5px] font-black">
                (₺{getPriceTRY(sale.finalAmount)})
              </span>
            </div>
          )}
        </div>
      </div>
    </ReceiptTemplate>
  );
};

export function ReceiptModal({ isOpen, onClose, sale, rates, initialDefaultCurrency }: ReceiptModalProps) {
  const [settings, setSettings] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<"TRY" | "USD">(
    initialDefaultCurrency === "USD" ? "USD" : "TRY"
  );
  const [customPhone, setCustomPhone] = useState(sale?.customer?.phone || "");
  const [sendType, setSendType] = useState<"web" | "desktop">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("whatsapp_send_type") as "web" | "desktop") || "web";
    }
    return "web";
  });

  const [quickSend, setQuickSend] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("whatsapp_quick_send") === "true";
    }
    return false;
  });
  const [isWhatsAppPreviewOpen, setIsWhatsAppPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");

  const handleQuickSendToggle = (enabled: boolean) => {
    setQuickSend(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("whatsapp_quick_send", String(enabled));
    }
    toast.info(enabled ? "Hızlı Gönder açıldı (Önizlemesiz)" : "Önizleme modu açıldı");
  };

  const handleSendTypeChange = (type: "web" | "desktop") => {
    setSendType(type);
    if (typeof window !== "undefined") {
      localStorage.setItem("whatsapp_send_type", type);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getReceiptSettings("pos").then(setSettings);
      if (!initialDefaultCurrency) {
        import("@/lib/actions/setting-actions").then(m => {
          m.getSettings().then(s => {
            const curr = s.find((a: any) => a.key === "defaultCurrency")?.value || "TRY";
            if (curr === "USD") setSelectedCurrency("USD");
          });
        });
      } else if (initialDefaultCurrency === "USD") {
        setSelectedCurrency("USD");
      }
      import("@/lib/actions/setting-actions").then(m => {
        m.getShop().then(setShop);
      });
      setCustomPhone(sale?.customer?.phone || "");
    }
  }, [isOpen, initialDefaultCurrency, sale]);

  const usdRate = Number(rates?.usd || (rates as any)?.USD || 34.5);
  const getPriceTRY = (price: number) => {
    const saleCurrency = sale?.transaction?.currency || sale?.currency || "TRY";
    if (saleCurrency === "USD") return (Number(price) * usdRate).toFixed(2);
    return Number(price).toFixed(2);
  };
  const getPriceUSD = (price: number) => {
    const saleCurrency = sale?.transaction?.currency || sale?.currency || "TRY";
    if (saleCurrency === "USD") return Number(price).toFixed(2);
    return (Number(price) / usdRate).toFixed(2);
  };

  const cleanPhoneDigits = (customPhone || "").replace(/\D/g, "");
  const isPhoneValid = cleanPhoneDigits.length >= 10;
  const currentPaperSize = settings?.paperSize || "72mm";

  const buildReceiptMessage = () => {
    const isUSD = selectedCurrency === "USD";
    const itemLines = sale.items?.map((item: any) => {
      const qty = item.quantity > 1 ? ` (${item.quantity} Adet)` : "";
      if (isUSD) {
        return `• ${item.product?.name}${qty}: $${getPriceUSD(item.totalPrice)} (₺${getPriceTRY(item.totalPrice)})`;
      }
      return `• ${item.product?.name}${qty}: ₺${getPriceTRY(item.totalPrice)}`;
    }).join("\n") || "";

    const totalText = isUSD
      ? `*Toplam: $${getPriceUSD(sale.finalAmount)} (₺${getPriceTRY(sale.finalAmount)})*`
      : `*Toplam: ₺${getPriceTRY(sale.finalAmount)}*`;

    return `${itemLines}\n\n${totalText}`;
  };

  const sendWhatsAppDirect = (msgToSend?: string) => {
    const message = msgToSend || buildReceiptMessage();
    const cleanPhone = sanitizeWhatsAppPhone(customPhone);
    const link = formatWhatsAppLink(cleanPhone, message, sendType);

    if (sendType === "desktop") {
      window.location.assign(link);
    } else {
      window.open(link, "whatsapp_window");
    }
    toast.success(`Mesaj ${customPhone} numarasına gönderildi.`);
  };

  const handleWhatsApp = () => {
    if (!isPhoneValid) {
      toast.error("Lütfen geçerli bir telefon numarası girin (en az 10 hane).");
      return;
    }

    const msg = buildReceiptMessage();
    setPreviewMessage(msg);

    if (quickSend) {
      sendWhatsAppDirect(msg);
    } else {
      setIsWhatsAppPreviewOpen(true);
    }
  };

  if (!sale) return null;

  return (
    <>
      <ReceiptModalWrapper
        open={isOpen}
        onClose={onClose}
        title={sale.saleNumber}
        subtitle="Satış Fişi"
        printTitle={`Satış Fişi - ${sale.saleNumber}`}
        paperSize={currentPaperSize}
        downloadFilename={`fis-${sale.saleNumber || "satis"}.png`}
        whatsappPhone={customPhone}
        onWhatsApp={handleWhatsApp}
        icon={<Receipt className="h-4 w-4 text-foreground" />}
        headerActions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Send Toggle */}
            <button
              type="button"
              onClick={() => handleQuickSendToggle(!quickSend)}
              className={cn(
                "px-1.5 py-0.5 rounded-lg border text-[8.5px] font-bold transition-all flex items-center gap-1",
                quickSend
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
              )}
              title={quickSend ? "Hızlı Gönder Açık: Önizlemesiz direkt gönderir" : "Önizleme Açık: Mesajı göndermeden önce gösterir"}
            >
              <Zap className={cn("w-2.5 h-2.5", quickSend && "fill-amber-400 text-amber-400")} />
              <span className="hidden sm:inline">{quickSend ? "Hızlı" : "Önizle"}</span>
            </button>

            {/* Currency Toggle */}
            <div className="flex bg-white/10 p-0.5 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={() => setSelectedCurrency("TRY")}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black transition-all",
                  selectedCurrency === "TRY" ? "bg-white text-black shadow" : "text-muted-foreground hover:text-white"
                )}
              >
                ₺
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrency("USD")}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black transition-all",
                  selectedCurrency === "USD" ? "bg-emerald-500 text-white shadow" : "text-muted-foreground hover:text-white"
                )}
              >
                $
              </button>
            </div>
            {/* Send Type Toggle */}
            <div className="flex bg-white/10 p-0.5 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={() => handleSendTypeChange("web")}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all flex items-center gap-1",
                  sendType === "web" ? "bg-white text-black shadow" : "text-muted-foreground hover:text-white"
                )}
                title="WhatsApp Web (Mevcut sekmede açılır)"
              >
                <Globe className="w-2.5 h-2.5" /> Web
              </button>
              <button
                type="button"
                onClick={() => handleSendTypeChange("desktop")}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all flex items-center gap-1",
                  sendType === "desktop" ? "bg-white text-black shadow" : "text-muted-foreground hover:text-white"
                )}
                title="WhatsApp Masaüstü Uygulaması"
              >
                <Monitor className="w-2.5 h-2.5" /> App
              </button>
            </div>
          </div>
        }
      >
        {(receiptRef, widthClass) => (
          <div className="flex flex-col items-center">
            {/* Kayıtsız veya telefonu olmayan müşteri için telefon girişi */}
            {(!sale.customer?.phone || !isPhoneValid) && (
              <div className="w-full max-w-[320px] mb-3 px-3 py-2 bg-slate-900/90 rounded-xl border border-white/10 text-white space-y-1">
                <div className="flex justify-between items-center text-[8.5px] font-black uppercase text-muted-foreground">
                  <span>WhatsApp Numarası Girin</span>
                  {!isPhoneValid && customPhone.trim() && (
                    <span className="text-rose-400">10 hane olmalıdır</span>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="05xx xxx xx xx"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full h-7 px-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white placeholder:text-white/30 focus:border-emerald-500/50 outline-none"
                />
              </div>
            )}

            <div ref={receiptRef} className={widthClass}>
              <POSReceiptContent
                sale={sale}
                settings={settings}
                selectedCurrency={selectedCurrency}
                shopName={shop?.name}
                shopPhone={shop?.phone}
                shopAddress={shop?.address}
                shopLogo={shop?.logoUrl}
                shopWebsite={shop?.website}
                rates={rates}
                customPhone={customPhone}
              />
            </div>
          </div>
        )}
      </ReceiptModalWrapper>

      {/* WhatsApp Önizleme Modalı */}
      {isWhatsAppPreviewOpen && (
        <WhatsAppConfirmModal
          isOpen={isWhatsAppPreviewOpen}
          onClose={() => setIsWhatsAppPreviewOpen(false)}
          phone={customPhone}
          customerName={sale.customer?.name || "Hızlı Satış"}
          initialMessage={previewMessage}
          onBeforeSend={() => {
            toast.success(`Mesaj ${customPhone} numarasına gönderildi.`);
          }}
        />
      )}
    </>
  );
}
