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
    Search
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { getReceiptSettings, getShopInfo } from "@/lib/actions/receipt-settings";
import { getSettings, getShop } from "@/lib/actions/setting-actions";
import { ReceiptTemplate } from "@/components/common/receipt-template";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { printReceipt, downloadReceiptImage, generateReceiptImage, getReceiptWidthClass } from "@/lib/receipt-print-styles";

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
    const [defaultCurrency, setDefaultCurrency] = useState<string>(initialDefaultCurrency || "TRY");
    const [activeTab, setActiveTab] = useState("receipt");
    const [printFormat, setPrintFormat] = useState<"a4" | "thermal">("thermal");

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
                    setDefaultCurrency(curr);
                });
            }

            // Sync customer info
            setCustomer({
                name: sale.customer?.name || "",
                phone: sale.customer?.phone || "",
                tc: sale.customer?.tc || ""
            });
        }
    }, [isOpen, sale, initialDefaultCurrency]);

    if (!sale) return null;

    const currencySymbol = defaultCurrency === "USD" ? "$" : (defaultCurrency === "EUR" ? "€" : "₺");
    const currentPaperSize = settings?.paperSize || "72mm";

    const getPrice = (price: number) => {
        if (defaultCurrency === 'USD') {
            const rate = Number(rates?.usd || 34.5);
            return Number(price / rate).toFixed(2);
        }
        if (defaultCurrency === 'EUR') {
            const rate = Number(rates?.eur || 37.0);
            return Number(price / rate).toFixed(2);
        }
        return Number(price).toFixed(2);
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

    const handleWhatsApp = async () => {
        const phoneClean = sale.customer?.phone?.replace(/[^0-9]/g, "") || "";
        const waUrl = phoneClean
            ? `https://wa.me/90${phoneClean.replace(/^0/, "")}`
            : "https://web.whatsapp.com";

        const waWindow = window.open(waUrl, "_blank");

        let ref = receiptRef;
        if (activeTab === "contract") ref = contractRef;
        if (activeTab === "warranty") ref = warrantyRef;

        try {
            const blob = await generateReceiptImage(ref);
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${activeTab}-${sale.saleNumber}.png`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        } catch (err) {
            console.error("WhatsApp image error:", err);
        }

        if (waWindow) waWindow.focus();
    };

    return (
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

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Müşteri</span>
                                <span className="text-xs font-bold text-white uppercase">{sale.customer?.name || "Hızlı Satış"}</span>
                                {sale.customer?.phone && <span className="text-[10px] text-muted-foreground font-medium">{sale.customer.phone}</span>}
                            </div>

                            <div className="flex flex-col gap-1 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">Toplam Tutar</span>
                                <span className="text-xl font-black text-emerald-500">{currencySymbol}{getPrice(sale.finalAmount)}</span>
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

                    <div className="p-6 mt-auto border-t border-border/30 bg-black/30">
                        <Button
                            onClick={handlePrintAll}
                            className="w-full h-14 mb-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 text-[11px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                        >
                            <Printer className="h-5 w-5" />
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
                                onClick={handleWhatsApp}
                                className="h-10 rounded-xl bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-[10px] font-black uppercase outline-none"
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
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 flex justify-center items-start custom-scrollbar">
                        {/* Receipt Tab */}
                        {activeTab === "receipt" && (
                            <div className="shadow-[0_0_100px_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
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
                                        <div className="mb-4 border-b-[1.5px] border-black pb-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-black text-[9px] text-black uppercase">FİŞ NO:</span>
                                                <span className="font-black text-sm text-black">{sale.saleNumber}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6 min-h-[50px]">
                                            {sale.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-start py-1 border-b border-black/5 last:border-0">
                                                    <div className="flex flex-col flex-1 pr-4">
                                                        <span className="text-[9px] font-black uppercase leading-none block text-black">
                                                            {item.product?.name}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-black/60">
                                                            {item.quantity} ADET x {currencySymbol}{getPrice(item.unitPrice)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right whitespace-nowrap">
                                                        <div className="text-[11px] font-black text-black">
                                                            {currencySymbol}{getPrice(item.totalPrice)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t-[1.5px] border-black pt-4 space-y-2">
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-[10px] font-black text-black uppercase">ÖDEME YÖNTEMİ:</span>
                                                <span className="text-[11px] font-black text-black uppercase">{sale.paymentMethod}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-[1.5px] border-black p-2 mt-2">
                                                <span className="text-[10px] font-black text-black uppercase tracking-wider">GENEL TOPLAM</span>
                                                <span className="text-lg font-black text-black">
                                                    {currencySymbol}{getPrice(sale.finalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </ReceiptTemplate>
                                </div>
                            </div>
                        )}

                        {/* Contract Tab */}
                        {activeTab === "contract" && hasDevice && (
                            <div className={cn(
                                "shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 transition-all bg-white",
                                printFormat === "a4" ? "w-[210mm] min-h-[297mm] p-[15mm]" : "w-[72mm]"
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
                                                <p className="mb-8 font-bold italic">İşbu sözleşme tarafların hür iradesiyle {currencySymbol}{getPrice(sale.finalAmount)} karşılığında imzalanmıştır.</p>
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
                                                    <span>{currencySymbol}{getPrice(sale.finalAmount)}</span>
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
                        {activeTab === "warranty" && hasDevice && (
                            <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] shadow-2xl animate-in fade-in zoom-in duration-300">
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
    );
}
