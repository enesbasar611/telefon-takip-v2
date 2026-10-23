"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Receipt,
    CheckCircle2,
    FileText,
    ShieldCheck,
    Printer,
    Download,
    MessageCircle,
    X,
    User,
    ChevronRight,
    Search,
    Globe,
    Monitor,
    DollarSign,
    Zap
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings, getShopInfo } from "@/lib/actions/receipt-settings";
import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { printReceipt, downloadReceiptImage, generateReceiptImage, getReceiptWidthClass } from "@/lib/receipt-print-styles";
import { formatWhatsAppLink, sanitizeWhatsAppPhone } from "@/lib/utils/notifications";
import { WhatsAppConfirmModal } from "@/components/common/whatsapp-confirm-modal";

interface UnifiedSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
    rates?: { usd: number; eur: number };
    initialDefaultCurrency?: string;
}

export function UnifiedSaleModal({ isOpen, onClose, sale, rates, initialDefaultCurrency }: UnifiedSaleModalProps) {
    const [settings, setSettings] = useState<any>(null);
    const [shop, setShop] = useState<any>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<"TRY" | "USD">(
        (initialDefaultCurrency === "USD" ? "USD" : "TRY")
    );
    const [activeTab, setActiveTab] = useState("receipt");
    const [printFormat, setPrintFormat] = useState<"a4" | "thermal">("thermal");

    // Phone for WhatsApp
    const [customPhone, setCustomPhone] = useState(sale?.customer?.phone || "");

    // WhatsApp send type: web or desktop
    const [sendType, setSendType] = useState<"web" | "desktop">(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("whatsapp_send_type") as "web" | "desktop") || "web";
        }
        return "web";
    });

    const handleSendTypeChange = (type: "web" | "desktop") => {
        setSendType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("whatsapp_send_type", type);
        }
    };

    // Hızlı Gönder (Önizlemesiz doğrudan gönderim)
    const [quickSend, setQuickSend] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("whatsapp_quick_send") !== "false";
        }
        return true;
    });

    const handleQuickSendToggle = (checked: boolean) => {
        setQuickSend(checked);
        if (typeof window !== "undefined") {
            localStorage.setItem("whatsapp_quick_send", checked ? "true" : "false");
        }
    };

    // WhatsApp Önizleme Modalı
    const [isWhatsAppPreviewOpen, setIsWhatsAppPreviewOpen] = useState(false);
    const [previewMessage, setPreviewMessage] = useState("");

    // Customer info for contract (fallback to sale customer)
    const [customer, setCustomer] = useState({
        name: "",
        tc: "",
        phone: ""
    });

    // Warranty duration (months)
    const [warrantyMonths, setWarrantyMonths] = useState(6);

    // Expertiz info for contract
    const [expert, setExpert] = useState({
        screen: "Orijinal",
        liquid: "Yok",
        repair: ""
    });

    const receiptRef = useRef<HTMLDivElement>(null);
    const contractRef = useRef<HTMLDivElement>(null);
    const warrantyRef = useRef<HTMLDivElement>(null);

    const devices = sale?.items?.filter((item: any) => item.product?.deviceInfo) || [];
    const hasDevice = devices.length > 0;
    const firstDevice = devices[0];

    useEffect(() => {
        if (isOpen && sale) {
            getReceiptSettings("pos").then(setSettings);
            getShop().then(setShop);

            if (!initialDefaultCurrency) {
                getSettings().then(s => {
                    const curr = s.find((a: any) => a.key === "defaultCurrency")?.value || "TRY";
                    if (curr === "USD") {
                        setSelectedCurrency("USD");
                    }
                });
            } else if (initialDefaultCurrency === "USD") {
                setSelectedCurrency("USD");
            }

            // Sync custom phone
            setCustomPhone(sale.customer?.phone || "");

            // Sync customer info
            setCustomer({
                name: sale.customer?.name || "",
                phone: sale.customer?.phone || "",
                tc: sale.customer?.tc || ""
            });
        }
    }, [isOpen, sale, initialDefaultCurrency]);

    if (!sale) return null;

    const usdRate = Number(rates?.usd || (rates as any)?.USD || 34.5);

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

    // Phone validation
    const cleanPhoneDigits = (customPhone || "").replace(/\D/g, "");
    const isPhoneValid = cleanPhoneDigits.length >= 10;

    const currentPaperSize = settings?.paperSize || "72mm";

    const paymentMethodMap: Record<string, string> = {
        CASH: "NAKİT",
        CARD: "KREDİ KARTI",
        TRANSFER: "HAVALE / EFT",
        DEBT: "VERESİYE",
        MIXED: "PARÇALI"
    };

    const handlePrint = () => {
        let ref = receiptRef;
        let title = "Satış Fişi";
        let size = currentPaperSize;

        if (activeTab === "contract") {
            ref = contractRef;
            title = "Satış Sözleşmesi";
            size = printFormat === "a4" ? "A4" : currentPaperSize;
        } else if (activeTab === "warranty") {
            ref = warrantyRef;
            title = "Garanti Belgesi";
            size = currentPaperSize;
        }

        printReceipt(ref, size, `${title} - ${sale.saleNumber}`);
    };

    const handlePrintAll = async () => {
        try {
            // 1. Print Receipt
            printReceipt(receiptRef, currentPaperSize, `Satış Fişi - ${sale.saleNumber}`);

            // 2. If has device, print other documents with small delays
            if (hasDevice) {
                setTimeout(() => {
                    printReceipt(contractRef, printFormat === "a4" ? "A4" : currentPaperSize, `Sözleşme - ${sale.saleNumber}`);
                }, 1500);

                setTimeout(() => {
                    printReceipt(warrantyRef, currentPaperSize, `Garanti Belgesi - ${sale.saleNumber}`);
                }, 3000);
            }
            toast.success("Yazdırma işlemleri sıraya alındı.");
        } catch (error) {
            toast.error("Yazdırma sırasında bir hata oluştu.");
        }
    };



    const buildSaleWhatsAppMessage = () => {
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
        const message = msgToSend || buildSaleWhatsAppMessage();
        const cleanPhone = sanitizeWhatsAppPhone(customPhone);
        const link = formatWhatsAppLink(cleanPhone, message, sendType);

        if (sendType === "desktop") {
            window.location.assign(link);
        } else {
            // Var olan WhatsApp sekmesini hedefler, her defasında yeni sekme açmaz
            window.open(link, "whatsapp_window");
        }
        toast.success(`Mesaj ${customPhone} numarasına gönderildi.`);
    };

    const handleWhatsApp = () => {
        if (!isPhoneValid) {
            toast.error("Lütfen geçerli bir telefon numarası girin (en az 10 hane).");
            return;
        }

        const msg = buildSaleWhatsAppMessage();
        setPreviewMessage(msg);

        if (quickSend) {
            sendWhatsAppDirect(msg);
        } else {
            setIsWhatsAppPreviewOpen(true);
        }
    };

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1100px] p-0 bg-[#0F172A] border border-border/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-[90vh]">

                {/* Left Side: Navigation & Info */}
                <div className="w-full md:w-80 border-r border-border/30 flex flex-col bg-slate-900/50 shrink-0 shrink-0 overflow-y-auto">
                    <div className="p-6 border-b border-border/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">{sale.saleNumber}</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">İşlem Özeti</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Müşteri ve Telefon Bilgisi */}
                            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Müşteri</span>
                                <span className="text-xs font-bold text-white uppercase">{sale.customer?.name || "Hızlı Satış"}</span>

                                <div className="mt-1 pt-1.5 border-t border-white/10 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Telefon (WhatsApp)</span>
                                        {!isPhoneValid && customPhone.trim() && (
                                            <span className="text-[8px] font-bold text-rose-400">10 hane olmalıdır</span>
                                        )}
                                        {isPhoneValid && (
                                            <span className="text-[8px] font-bold text-emerald-400">Hazır</span>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="05xx xxx xx xx"
                                        value={customPhone}
                                        onChange={(e) => setCustomPhone(e.target.value)}
                                        className={cn(
                                            "w-full h-8 px-2.5 rounded-xl bg-black/30 border text-white text-xs font-mono placeholder:text-white/30 outline-none transition-colors",
                                            isPhoneValid ? "border-emerald-500/40 focus:border-emerald-500" : "border-white/10 focus:border-blue-500/50"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Para Birimi Seçici (Dolar / TL) */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Para Birimi</span>
                                    {selectedCurrency === "USD" && (
                                        <span className="text-[8.5px] font-bold text-emerald-400/90">1$ = {usdRate} ₺</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCurrency("TRY")}
                                        className={cn(
                                            "h-7 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1",
                                            selectedCurrency === "TRY"
                                                ? "bg-white text-black shadow-md"
                                                : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        ₺ TL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCurrency("USD")}
                                        className={cn(
                                            "h-7 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1",
                                            selectedCurrency === "USD"
                                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        $ Dolar
                                    </button>
                                </div>
                            </div>

                            {/* Toplam Tutar */}
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Toplam Tutar</span>
                                <div className="flex flex-wrap items-baseline gap-1.5">
                                    <span className="text-xl font-black text-emerald-500">
                                        {selectedCurrency === "USD" ? `$${getPriceUSD(sale.finalAmount)}` : `₺${getPriceTRY(sale.finalAmount)}`}
                                    </span>
                                    {selectedCurrency === "USD" && (
                                        <span className="text-xs font-bold text-emerald-400/80">
                                            (₺{getPriceTRY(sale.finalAmount)})
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] font-bold text-emerald-500/50 uppercase">{sale.paymentMethod} ÖDEME</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 flex-1">
                        <h3 className="px-2 mb-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">İlgili Belgeler</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveTab("receipt")}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border outline-none",
                                    activeTab === "receipt"
                                        ? "bg-white/10 border-white/20 text-white shadow-lg"
                                        : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <Receipt className="h-4 w-4" />
                                <span className="text-xs font-black uppercase tracking-wider">Satış Fişi</span>
                                <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", activeTab === "receipt" ? "rotate-90" : "")} />
                            </button>

                            {hasDevice && (
                                <>
                                    <button
                                        onClick={() => setActiveTab("contract")}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border outline-none",
                                            activeTab === "contract"
                                                ? "bg-white/10 border-white/20 text-white shadow-lg"
                                                : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-wider">Satış Sözleşmesi</span>
                                        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", activeTab === "contract" ? "rotate-90" : "")} />
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("warranty")}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-2xl transition-all border outline-none",
                                            activeTab === "warranty"
                                                ? "bg-white/10 border-white/20 text-white shadow-lg"
                                                : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-wider">Garanti Belgesi</span>
                                        <ChevronRight className={cn("ml-auto h-3 w-3 transition-transform", activeTab === "warranty" ? "rotate-90" : "")} />
                                    </button>
                                </>
                            )}
                        </div>

                        {hasDevice && (
                            <div className="mt-6 space-y-4 px-2">
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2">Sözleşme & Garanti Ayarları</h4>

                                {/* Customer TC */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase pl-1">Müşteri TC Kimlik</label>
                                    <input
                                        type="text"
                                        maxLength={11}
                                        placeholder="TC Kimlik No"
                                        value={customer.tc}
                                        onChange={(e) => setCustomer(prev => ({ ...prev, tc: e.target.value.replace(/\D/g, "") }))}
                                        className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] uppercase font-bold focus:border-blue-500/50 outline-none transition-colors"
                                    />
                                </div>

                                {/* Warranty Duration */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase pl-1">Garanti Süresi (Ay)</label>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[3, 6, 12, 24].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setWarrantyMonths(m)}
                                                className={cn(
                                                    "h-8 rounded-lg text-[10px] font-black border transition-all",
                                                    warrantyMonths === m ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                )}
                                            >
                                                {m}M
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Özel Ay..."
                                        value={warrantyMonths}
                                        onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                                        className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] uppercase font-bold focus:border-blue-500/50 outline-none transition-colors mt-1"
                                    />
                                </div>

                                {/* Expertization */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase pl-1">Cihaz Ekspertiz</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={expert.screen}
                                            onChange={(e) => setExpert(prev => ({ ...prev, screen: e.target.value }))}
                                            className="h-9 px-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold outline-none"
                                        >
                                            <option value="Orijinal" className="bg-slate-900">Ekran: Org.</option>
                                            <option value="Değişmiş" className="bg-slate-900">Ekran: Değ.</option>
                                        </select>
                                        <select
                                            value={expert.liquid}
                                            onChange={(e) => setExpert(prev => ({ ...prev, liquid: e.target.value }))}
                                            className="h-9 px-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold outline-none"
                                        >
                                            <option value="Yok" className="bg-slate-900">Sıvı: Yok</option>
                                            <option value="Var" className="bg-slate-900">Sıvı: Var</option>
                                        </select>
                                    </div>
                                    <textarea
                                        placeholder="Tamir geçmişi veya ek notlar..."
                                        value={expert.repair}
                                        onChange={(e) => setExpert(prev => ({ ...prev, repair: e.target.value }))}
                                        className="w-full h-20 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold focus:border-blue-500/50 outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 mt-auto border-t border-border/30 bg-black/30 space-y-2.5">
                        {/* WhatsApp Gönderim Modu & Hızlı Gönder */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[8.5px] font-black text-muted-foreground uppercase tracking-widest">WhatsApp Modu</span>
                                <button
                                    type="button"
                                    onClick={() => handleQuickSendToggle(!quickSend)}
                                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                    title="Hızlı Gönder: Açıkken önizleme modalı açmadan doğrudan WhatsApp'a yönlendirir"
                                >
                                    <Zap className={cn("h-3 w-3", quickSend ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                                    <span className={cn("text-[8.5px] font-black uppercase tracking-tight", quickSend ? "text-amber-400" : "text-muted-foreground")}>
                                        {quickSend ? "Hızlı Gönder Açık" : "Önizlemeli"}
                                    </span>
                                </button>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => handleSendTypeChange('web')}
                                    className={cn(
                                        "flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                                        sendType === 'web'
                                            ? "bg-white text-black shadow-sm"
                                            : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    <Globe className="w-3 h-3" /> Web
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSendTypeChange('desktop')}
                                    className={cn(
                                        "flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                                        sendType === 'desktop'
                                            ? "bg-white text-black shadow-sm"
                                            : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    <Monitor className="w-3 h-3" /> Uygulama
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={handlePrintAll}
                            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 text-[11px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            {hasDevice ? "HEPSİNİ YAZDIR (FİŞ+SÖZLEŞME)" : "FİŞİ YAZDIR"}
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="h-10 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 text-[10px] font-black uppercase outline-none"
                            >
                                <Printer className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Tekli
                            </Button>
                            <Button
                                variant="outline"
                                disabled={!isPhoneValid}
                                onClick={handleWhatsApp}
                                title={!isPhoneValid ? "WhatsApp için geçerli bir telefon numarası girin" : undefined}
                                className={cn(
                                    "h-10 rounded-xl text-[10px] font-black uppercase outline-none transition-all",
                                    isPhoneValid
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95"
                                        : "bg-white/5 border-white/5 text-muted-foreground opacity-40 cursor-not-allowed"
                                )}
                            >
                                <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Preview */}
                <div className="flex-1 flex flex-col bg-[#05070A] overflow-hidden">
                    <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Baskı Önizleme</h2>
                            {activeTab === "contract" && (
                                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                                    <button
                                        onClick={() => setPrintFormat("thermal")}
                                        className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", printFormat === "thermal" ? "bg-white text-black shadow-lg" : "text-muted-foreground")}
                                    >Thermal</button>
                                    <button
                                        onClick={() => setPrintFormat("a4")}
                                        className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", printFormat === "a4" ? "bg-white text-black shadow-lg" : "text-muted-foreground")}
                                    >A4 Standart</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 flex justify-center items-start custom-scrollbar relative">
                        {/* Receipt Tab */}
                        <div
                            className={cn(
                                "shadow-[0_0_100px_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300",
                                activeTab !== "receipt" && "hidden"
                            )}
                        >
                            <div ref={receiptRef}>
                                <ReceiptTemplate
                                    settings={settings}
                                    subtitle={settings?.subtitle || "SATIŞ FİŞİ"}
                                    date={sale.createdAt ? new Date(sale.createdAt) : undefined}
                                    shopName={shop?.name}
                                    shopPhone={shop?.phone}
                                    shopAddress={shop?.address}
                                    shopLogo={shop?.logoUrl}
                                    shopWebsite={shop?.website}
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
                                            <span className="font-black text-xs text-black leading-tight block mt-0.5">
                                                {sale.saleNumber}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Ürün Listesi */}
                                    <div className="space-y-1 mb-2">
                                        {sale.items?.map((item: any, idx: number) => {
                                            const isUSD = selectedCurrency === "USD";
                                            return (
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
                                            );
                                        })}
                                    </div>

                                    {/* Alt Toplam & Ödeme Yöntemi */}
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
                                                    {selectedCurrency === "USD" ? `$${getPriceUSD(sale.finalAmount)}` : `₺${getPriceTRY(sale.finalAmount)}`}
                                                </span>
                                            </div>
                                            {selectedCurrency === "USD" && (
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
                            </div>
                        </div>

                        {/* Contract Tab */}
                        {hasDevice && (
                            <div className={cn(
                                "shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 transition-all bg-white",
                                printFormat === "a4" ? "w-[210mm] min-h-[297mm] p-[15mm]" : "w-[72mm]",
                                activeTab !== "contract" && "hidden"
                            )}>
                                <div ref={contractRef}>
                                    {printFormat === "a4" ? (
                                        <div className="text-black font-sans leading-tight">
                                            <div className="text-center mb-6">
                                                <h1 className="text-xl font-black underline mb-3">CİHAZ SATIŞ VE DEVİR SÖZLEŞMESİ</h1>
                                                <div className="flex justify-between font-bold text-[10px]">
                                                    <span>Tarih: {format(new Date(sale.createdAt), "dd.MM.yyyy")}</span>
                                                    <span>Sözleşme No: BTK-{firstDevice.product.deviceInfo?.imei?.slice(-4) || "0000"}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 mb-6">
                                                <div className="space-y-1">
                                                    <h2 className="text-[11px] font-black border-b border-black pb-1 mb-2 uppercase">1. SATICI (BAYİ)</h2>
                                                    <div className="text-[10px] space-y-1">
                                                        <div className="font-black">{shop?.name || "BAŞAR TEKNİK"}</div>
                                                        <div className="text-gray-600 leading-none">{shop?.address}</div>
                                                        <div className="font-bold">Tel: {shop?.phone}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h2 className="text-[11px] font-black border-b border-black pb-1 mb-2 uppercase">2. ALICI (MÜŞTERİ)</h2>
                                                    <div className="text-[10px] space-y-1">
                                                        <div className="font-black uppercase">{sale.customer?.name || "MÜŞTERİ"}</div>
                                                        <div>TC: {customer.tc || "................"}</div>
                                                        <div>Tel: {sale.customer?.phone || "................"}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h2 className="text-[11px] font-black border-b border-black pb-1 mb-2 uppercase">3. CİHAZ BİLGİLERİ</h2>
                                                <table className="w-full border-collapse text-[10px]">
                                                    <thead>
                                                        <tr className="bg-slate-50">
                                                            <th className="border border-black p-1.5 text-left uppercase">Marka / Model</th>
                                                            <th className="border border-black p-1.5 text-left uppercase">IMEI Numarası</th>
                                                            <th className="border border-black p-1.5 text-left uppercase">Kapasite / Renk</th>
                                                            <th className="border border-black p-1.5 text-left uppercase">Durum</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-black p-1.5 font-bold uppercase">{firstDevice.product?.name}</td>
                                                            <td className="border border-black p-1.5 font-mono">{firstDevice.product?.deviceInfo?.imei || "—"}</td>
                                                            <td className="border border-black p-1.5">
                                                                {firstDevice.product?.deviceInfo?.storage || "—"} / {firstDevice.product?.deviceInfo?.color || "—"}
                                                            </td>
                                                            <td className="border border-black p-1.5 font-bold">{firstDevice.product?.deviceInfo?.condition === 'NEW' ? 'SIFIR' : '2. EL'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="mb-6">
                                                <h2 className="text-[11px] font-black border-b border-black pb-1 mb-2 uppercase">4. SATIŞ BEYAN VE TAAHHÜTLERİ</h2>
                                                <div className="text-[9px] space-y-2 text-justify pr-2">
                                                    <p><strong>Mülkiyet Beyanı:</strong> Satıcı, yukarıda bilgileri kayıtlı cihazın mülkiyetinin tam olduğunu, cihazın çalıntı, buluntu, icralık veya herhangi bir hukuki kısıtlamasının bulunmadığını taahhüt eder.</p>
                                                    <p><strong>Hukuki Sorumluluk:</strong> Cihazın geçmişine yönelik doğabilecek her türlü hukuki, cezai ve mali sorumluluk Satıcı'ya aittir. Cihazın "Klon" veya "Kayıt Dışı" çıkması durumunda Satıcı, alınan bedeli iade etmekle yükümlüdür.</p>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <h2 className="text-[11px] font-black border-b border-black pb-1 mb-2 uppercase">5. EKSPERTİZ DURUMU</h2>
                                                <div className="grid grid-cols-2 gap-4 text-[10px]">
                                                    <div><strong>Ekran:</strong> {expert.screen}</div>
                                                    <div><strong>Sıvı Teması:</strong> {expert.liquid}</div>
                                                    <div className="col-span-2"><strong>Tamir Geçmişi:</strong> {expert.repair || "Yok"}</div>
                                                </div>
                                            </div>

                                            <div className="mt-12 text-center text-[10px]">
                                                <p className="mb-8 font-bold italic">
                                                    İşbu sözleşme tarafların hür iradesiyle {selectedCurrency === "USD" ? `$${getPriceUSD(sale.finalAmount)} (₺${getPriceTRY(sale.finalAmount)})` : `₺${getPriceTRY(sale.finalAmount)}`} karşılığında imzalanmıştır.
                                                </p>
                                                <div className="flex justify-between px-10">
                                                    <div className="text-center w-48">
                                                        <div className="font-black border-b border-black pb-2 mb-12 uppercase">ALICI (MÜŞTERİ)</div>
                                                        <div className="text-xs uppercase font-bold">{sale.customer?.name || "MÜŞTERİ"}</div>
                                                    </div>
                                                    <div className="text-center w-48">
                                                        <div className="font-black border-b border-black pb-2 mb-12 uppercase">SATICI (BAYİ)</div>
                                                        <div className="text-xs uppercase font-bold">{shop?.name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-black font-mono leading-tight">
                                            <div className="text-center border-b-2 border-black pb-2 mb-4">
                                                <div className="text-lg font-black uppercase leading-none">{shop?.name}</div>
                                                <div className="text-[10px] mt-1 uppercase">SATIŞ SÖZLEŞMESİ</div>
                                            </div>
                                            <div className="space-y-2 text-[10px]">
                                                <div className="flex justify-between"><span>TARİH:</span> <span>{format(new Date(sale.createdAt), "dd.MM.yyyy")}</span></div>
                                                <div className="flex justify-between"><span>MÜŞTERİ:</span> <span className="uppercase">{sale.customer?.name || "HIZLI SATIŞ"}</span></div>
                                                <div className="border-t border-black pt-2">
                                                    <div className="font-black uppercase">{firstDevice.product?.name}</div>
                                                    <div className="uppercase">IMEI: {firstDevice.product?.deviceInfo?.imei}</div>
                                                </div>
                                                <div className="flex justify-between text-base font-black border-t-2 border-black pt-2 mt-2">
                                                    <span>TUTAR:</span>
                                                    <span>{selectedCurrency === "USD" ? `$${getPriceUSD(sale.finalAmount)}` : `₺${getPriceTRY(sale.finalAmount)}`}</span>
                                                </div>
                                                <p className="text-[8px] text-center italic mt-6 border-t border-dashed border-black pt-2">
                                                    Ayrıntılı sözleşme şartları A4 nüshasındadır.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Warranty Tab */}
                        {hasDevice && (
                            <div className={cn(
                                "w-[210mm] min-h-[297mm] bg-white p-[15mm] shadow-2xl animate-in fade-in zoom-in duration-300",
                                activeTab !== "warranty" && "hidden"
                            )}>
                                <div ref={warrantyRef} className="text-black font-sans flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-6">
                                        <div className="space-y-1">
                                            <h1 className="text-3xl font-black tracking-tight">GARANTİ BELGESİ</h1>
                                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">WARRANTY CERTIFICATE</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black uppercase text-blue-600 leading-none">{shop?.name}</div>
                                            <div className="text-[11px] font-bold text-gray-500 mt-1">{shop?.address}</div>
                                            <div className="text-[11px] font-black mt-0.5">{shop?.phone}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-12 mb-12">
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h3 className="text-[13px] font-black border-b border-black/10 pb-1 uppercase tracking-wider">Cihaz Bilgileri</h3>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                                                        <span className="font-bold text-gray-400 uppercase">Model:</span>
                                                        <span className="font-black uppercase">{firstDevice.product?.name}</span>
                                                    </div>
                                                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                                                        <span className="font-bold text-gray-400 uppercase">IMEI:</span>
                                                        <span className="font-black">{firstDevice.product?.deviceInfo?.imei}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-[13px] font-black border-b border-black/10 pb-1 uppercase tracking-wider">Garanti Detayları</h3>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                                                        <span className="font-bold text-gray-400 uppercase">Süre:</span>
                                                        <span className="font-black">{warrantyMonths} AY</span>
                                                    </div>
                                                    <div className="flex justify-between p-2.5 bg-blue-50 rounded-xl">
                                                        <span className="font-bold text-blue-400 uppercase">Bitiş Tarihi:</span>
                                                        <span className="font-black text-blue-600">
                                                            {format(addMonths(new Date(sale.createdAt), warrantyMonths), "dd.MM.yyyy")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h3 className="text-[13px] font-black border-b border-black/10 pb-1 uppercase tracking-wider">Müşteri Bilgileri</h3>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                                                        <span className="font-bold text-gray-400 uppercase">Ad Soyad:</span>
                                                        <span className="font-black uppercase">{sale.customer?.name || "HIZLI SATIŞ"}</span>
                                                    </div>
                                                    <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                        <span className="font-bold text-gray-400 uppercase">TC Kimlik:</span>
                                                        <span className="font-black">{customer.tc || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 border-2 border-black/5 p-8 rounded-[2rem] bg-gray-50/50">
                                        <h3 className="text-[13px] font-black mb-4 flex items-center gap-3">
                                            <div className="h-6 w-1.5 bg-blue-600 rounded-full" />
                                            GARANTİ ŞARTLARI VE KAPSAMI
                                        </h3>
                                        <div className="grid grid-cols-2 gap-10 text-[11px] leading-relaxed text-gray-600">
                                            <ul className="space-y-2.5 list-disc pl-4">
                                                <li>Garanti süresi cihazın teslim tarihinden itibaren başlar.</li>
                                                <li>Sıvı teması, darbe, kırılma ve kullanıcı kaynaklı fiziksel hasarlar garanti dışıdır.</li>
                                                <li>Ekran kırılması ve batarya şişmesi garanti kapsamı dışındadır.</li>
                                            </ul>
                                            <ul className="space-y-2.5 list-disc pl-4">
                                                <li>Yazılımsal müdaheleler ve yetkisiz servis tamir denemeleri garantiyi geçersiz kılar.</li>
                                                <li>Garanti belgesinin ve satış fişinin ibrazı zorunludur.</li>
                                                <li>Aksesuarlar (şarj kablosu, kulaklık vb.) garanti kapsamı dışındadır.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-16 flex justify-between px-10">
                                        <div className="text-center">
                                            <div className="text-[11px] font-bold text-gray-400 mb-10 uppercase tracking-widest">Satıcı Kaşe / İmza</div>
                                            <div className="h-0.5 w-40 bg-gray-100 mx-auto" />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[11px] font-bold text-gray-400 mb-10 uppercase tracking-widest">Müşteri İmza</div>
                                            <div className="h-0.5 w-40 bg-gray-100 mx-auto" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

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
