"use client";

import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, X, ShoppingCart, Package, Image as ImageIcon, Upload, Eye, Plus, Paperclip, Loader2, Download, Trash2, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateDeviceEntry } from "@/lib/actions/device-hub-actions";
import { toast } from "sonner";
import { useEffect, useTransition } from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { formatProperCase, formatUppercase } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { getShopInfo } from "@/lib/actions/receipt-settings";

interface DeviceReceiptModalProps {
    device: any;
    children?: React.ReactNode;
}

type FormType = "purchase" | "sale";
type PrintFormat = "a4" | "thermal";

let SHOP_INFO = {
    name: "Başar Teknik (Enes Başar)",
    address: "İstiklal Cad. No:10, 34000 (Örnek Adres)",
    taxInfo: "Vergi Dairesi: - / No: -",
    phone: "0532 000 00 00",
};

interface CustomerInfo {
    name: string;
    tc: string;
    phone: string;
}

interface DeviceExpertInfo {
    screen: string;
    liquid: string;
    repair: string;
}

function A4Receipt({
    device,
    formType,
    date,
    customer,
    expert,
    shopInfo,
}: {
    device: DeviceReceiptModalProps["device"];
    formType: FormType;
    date: string;
    customer: CustomerInfo;
    expert: DeviceExpertInfo;
    shopInfo?: any;
}) {
    const info = shopInfo || SHOP_INFO;
    const isPurchase = formType === "purchase";
    const price = isPurchase ? device.buyPrice : device.sellPrice;
    const imeiLast4 = device.deviceInfo?.imei?.slice(-4) || "0000";

    return (
        <div
            id="receipt-content-a4"
            style={{
                width: "210mm",
                minHeight: "297mm",
                background: "#fff",
                color: "#111",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                padding: "15mm",
                boxSizing: "border-box",
                fontSize: "10pt",
                lineHeight: "1.4",
            }}
        >
            {/* Header / Title */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "16pt", fontWeight: 900, marginBottom: "8px", textDecoration: "underline" }}>
                    SIFIR / 2. EL CİHAZ ALIM-SATIM VE DEVİR SÖZLEŞMESİ
                </h1>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "10pt" }}>
                    <span>Tarih: {date.split(" ")[0]}</span>
                    <span>Sözleşme No: BTK-{imeiLast4}</span>
                </div>
            </div>

            {/* 1. TARAFLAR */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "11pt", fontWeight: 800, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>1. TARAFLAR</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ fontSize: "9pt" }}>
                        <strong style={{ display: "block", marginBottom: "2px" }}>ALICI:</strong>
                        {isPurchase ? (
                            <>
                                {info.name} <br />
                                {info.taxInfo} <br />
                                {info.address} <br />
                                Tel: {info.phone}
                            </>
                        ) : (
                            <>
                                {customer.name || "{Müşteri Ad Soyad}"} <br />
                                TC: {customer.tc || "{TC Kimlik No}"} <br />
                                Tel: {customer.phone || "{Telefon No}"}
                            </>
                        )}
                    </div>
                    <div style={{ fontSize: "9pt" }}>
                        <strong style={{ display: "block", marginBottom: "2px" }}>SATICI:</strong>
                        {!isPurchase ? (
                            <>
                                {info.name} <br />
                                {info.taxInfo} <br />
                                {info.address} <br />
                                Tel: {info.phone}
                            </>
                        ) : (
                            <>
                                {customer.name || "{Müşteri Ad Soyad}"} <br />
                                TC: {customer.tc || "{TC Kimlik No}"} <br />
                                Tel: {customer.phone || "{Telefon No}"}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. CİHAZ BİLGİLERİ */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "11pt", fontWeight: 800, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>2. CİHAZ BİLGİLERİ</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
                    <thead>
                        <tr style={{ background: "#f8fafc" }}>
                            <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Marka / Model</th>
                            <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>IMEI Numarası</th>
                            <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Kapasite / Renk</th>
                            <th style={{ border: "1px solid #ddd", padding: "6px", textAlign: "left" }}>Fiziksel Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ border: "1px solid #ddd", padding: "6px" }}>{device.name}</td>
                            <td style={{ border: "1px solid #ddd", padding: "6px" }}>{device.deviceInfo?.imei || "—"}</td>
                            <td style={{ border: "1px solid #ddd", padding: "6px" }}>
                                {device.deviceInfo?.storage || "—"} / {device.deviceInfo?.color || "—"}
                            </td>
                            <td style={{ border: "1px solid #ddd", padding: "6px" }}>{device.deviceInfo?.cosmeticScore}/10 - Çiziksiz</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 3. SATICI BEYAN VE TAAHHÜTLERİ */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "11pt", fontWeight: 800, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>3. SATICI BEYAN VE TAAHHÜTLERİ</h2>
                <div style={{ fontSize: "8.5pt", textAlign: "justify", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <p><strong>Mülkiyet Beyanı:</strong> Satıcı, yukarıda bilgileri kayıtlı cihazın kendisine ait olduğunu, cihazın çalıntı, buluntu, icralık veya herhangi bir suçla bağlantılı olmadığını beyan eder.</p>
                    <p><strong>Hukuki Sorumluluk:</strong> Cihazın geçmişine yönelik doğabilecek her türlü hukuki, cezai ve mali sorumluluk münhasıran Satıcı'ya aittir. Cihazın "Klon" veya "Kayıt Dışı" çıkması durumunda Satıcı, alınan bedeli derhal iade etmekle yükümlüdür.</p>
                    <p><strong>BTK Durumu:</strong> Cihazın BTK kayıtlarının yasal olduğu ve kullanımına engel bir durum bulunmadığı Satıcı tarafından garanti edilmiştir.</p>
                </div>
            </div>

            {/* 4. CİHAZIN DURUMU VE EKSPERTİZ */}
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "11pt", fontWeight: 800, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>4. CİHAZIN DURUMU VE EKSPERTİZ</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "9pt" }}>
                    <div><strong>Ekran:</strong> {expert.screen}</div>
                    <div><strong>Sıvı Teması:</strong> {expert.liquid}</div>
                    <div style={{ gridColumn: "span 2" }}><strong>Tamir Geçmişi:</strong> {expert.repair || "Yok"}</div>
                    <div><strong>Pil Sağlığı:</strong> %{device.deviceInfo?.batteryHealth || "—"}</div>
                </div>
            </div>

            {/* 5. SONUÇ VE İMZA */}
            <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "11pt", fontWeight: 800, borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>5. SONUÇ VE İMZA</h2>
                <p style={{ fontSize: "9.5pt", marginBottom: "15px" }}>
                    İşbu sözleşme, tarafların hür iradesiyle <strong>{price.toLocaleString("tr-TR")} ₺</strong> karşılığında imzalanmıştır.
                    Satıcı, cihazın içindeki tüm kişisel verilerini sildiğini ve iCloud/Google hesaplarından çıkış yaptığını onaylar.
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
                    <div style={{ textAlign: "center", width: "200px" }}>
                        <span style={{ fontWeight: 800, fontSize: "10pt" }}>ALICI (Kaşe/İmza)</span>
                        <div style={{ marginTop: "5px", fontSize: "9pt" }}>{isPurchase ? info.name : customer.name}</div>
                    </div>
                    <div style={{ textAlign: "center", width: "200px" }}>
                        <span style={{ fontWeight: 800, fontSize: "10pt" }}>SATICI (Ad Soyad/İmza)</span>
                        <div style={{ marginTop: "5px", fontSize: "9pt" }}>{!isPurchase ? info.name : customer.name}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ThermalReceipt({
    device,
    formType,
    date,
    customer,
    shopInfo,
}: {
    device: DeviceReceiptModalProps["device"];
    formType: FormType;
    date: string;
    customer: CustomerInfo;
    shopInfo?: any;
}) {
    const info = shopInfo || SHOP_INFO;
    const isPurchase = formType === "purchase";
    const price = isPurchase ? device.buyPrice : device.sellPrice;

    return (
        <div
            id="receipt-content-thermal"
            style={{
                width: "80mm",
                background: "#fff",
                color: "#000",
                fontFamily: "'Courier New', monospace",
                padding: "4mm",
                boxSizing: "border-box",
                fontSize: "9pt",
            }}
        >
            <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "8px" }}>
                <div style={{ fontWeight: 900, fontSize: "10pt" }}>{info.name}</div>
                <div style={{ fontSize: "7pt" }}>SLZ: BTK-{device.deviceInfo?.imei?.slice(-4)}</div>
                <div style={{ marginTop: "4px", fontWeight: 700 }}>{isPurchase ? "ALIŞ SÖZLEŞMESİ" : "SATIŞ BELGESİ"}</div>
            </div>
            <div style={{ marginBottom: "6px", fontSize: "8pt" }}>
                <div>Tarih: {date}</div>
                <div>Müşteri: {customer.name || "—"}</div>
                <div>Cihaz: {device.name}</div>
                <div>IMEI: {device.deviceInfo?.imei ?? "—"}</div>
                <div>Fiyat: {price.toLocaleString("tr-TR")} ₺</div>
            </div>
            {info.address && <div style={{ fontSize: "7pt", marginTop: "4px", opacity: 0.8 }}>{info.address}</div>}
            <div style={{ fontSize: "7pt", fontWeight: "bold" }}>Tel: {info.phone}</div>
            <div style={{ borderTop: "1px dashed #000", marginTop: "12px", paddingTop: "4px", fontSize: "7pt", textAlign: "center" }}>
                Sözleşme şartları A4 nüshasındadır.
            </div>
        </div>
    );
}

export function DeviceReceiptModal({ device, children }: DeviceReceiptModalProps) {
    const [open, setOpen] = useState(false);
    const [formType, setFormType] = useState<FormType>("purchase");
    const [printFormat, setPrintFormat] = useState<PrintFormat>("a4");
    const [shopInfo, setShopInfo] = useState<any>(null);

    useEffect(() => {
        const fetchShop = async () => {
            const data = await getShopInfo();
            if (data) {
                setShopInfo({
                    name: data.name,
                    address: data.address || "",
                    phone: data.phone || "",
                    taxInfo: "Vergi Dairesi: - / No: -",
                });
            }
        };
        fetchShop();
    }, []);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [customer, setCustomer] = useState<CustomerInfo>({ name: "", tc: "", phone: "" });
    const [expert, setExpert] = useState<DeviceExpertInfo>({ screen: "Orijinal", liquid: "Yok", repair: "" });

    // Auto-fill from device data if available
    useEffect(() => {
        if (open) {
            setCustomer(prev => ({
                name: prev.name || device.deviceInfo?.sellerName || "",
                tc: prev.tc || device.deviceInfo?.sellerTC || "",
                phone: prev.phone || device.deviceInfo?.sellerPhone || ""
            }));

            if (device.deviceInfo?.expertChecklist?.notes) {
                setExpert(prev => ({ ...prev, repair: device.deviceInfo.expertChecklist.notes }));
            }
        }
    }, [open, device.deviceInfo]);

    const now = new Date().toLocaleDateString("tr-TR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        startTransition(async () => {
            try {
                const formData = new FormData();
                Array.from(files).forEach(f => formData.append("files", f));

                const res = await fetch("/api/finance/upload", { method: "POST", body: formData });
                const json = await res.json();

                if (json.success) {
                    const newUrls = json.attachments.map((a: any) => a.url);
                    const currentUrls = device.deviceInfo?.photoUrls || [];

                    const result = await updateDeviceEntry(device.id, {
                        ...device,
                        brand: device.deviceInfo?.brand || device.name.split(" ")[0],
                        model: device.deviceInfo?.model || device.name.split(" ").slice(1).join(" "),
                        condition: device.deviceInfo?.condition || "USED",
                        buyPrice: device.buyPrice.toString(),
                        sellPrice: device.sellPrice.toString(),
                        photoUrls: [...currentUrls, ...newUrls]
                    });

                    if (result.success) {
                        toast.success("Belge başarıyla eklendi.");
                    } else {
                        toast.error("Veritabanı güncellenemedi.");
                    }
                } else {
                    toast.error("Dosya yüklenemedi.");
                }
            } catch (err) {
                toast.error("Bir hata oluştu.");
            } finally {
                setIsUploading(false);
            }
        });
    };

    const handlePrint = () => {
        const contentId = printFormat === "a4" ? "receipt-content-a4" : "receipt-content-thermal";
        const content = document.getElementById(contentId);
        if (!content) return;

        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (!printWindow) return;

        const isA4 = printFormat === "a4";
        printWindow.document.write(`
      <html>
        <head>
          <title>${formType === "purchase" ? "Alış-Satış Sözleşmesi" : "Belge"}</title>
          <style>
            @page { 
              size: ${isA4 ? "A4" : "80mm auto"}; 
              margin: 0; 
            }
            body { margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <button
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400 transition-all border border-orange-500/20 hover:border-orange-500/40"
                        title="Belgeler & Sözleşme"
                    >
                        <Paperclip className="h-4 w-4" />
                    </button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-[1100px] p-0 bg-[#0B0F19] text-slate-200 border border-slate-800/60 shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">

                {/* Left Side: Form Inputs */}
                <div className="w-full md:w-80 border-r border-slate-800/60 flex flex-col bg-slate-950/20 shrink-0">
                    <div className="p-5 border-b border-slate-800/60">
                        <h3 className="font-medium text-sm  text-white uppercase tracking-widest">Sözleşme Bilgileri</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Baskı öncesi detayları doldurun.</p>
                    </div>

                    <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Customer Info */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center group">
                                <Label className="font-medium text-[10px]  text-slate-500 uppercase tracking-widest pl-1 leading-none">Müşteri Bilgileri</Label>
                            </div>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                <input
                                    placeholder="Adı Soyadı"
                                    value={customer.name}
                                    onChange={e => setCustomer(prev => ({ ...prev, name: formatProperCase(e.target.value) }))}
                                    className="w-full h-11 pl-9 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-xs  focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <input
                                placeholder="TC Kimlik No"
                                value={customer.tc}
                                maxLength={11}
                                onChange={e => setCustomer(prev => ({ ...prev, tc: e.target.value.replace(/\D/g, "") }))}
                                className="w-full h-11 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs  focus:border-blue-500 transition-colors"
                            />
                            <PhoneInput
                                value={customer.phone}
                                onChange={val => setCustomer(prev => ({ ...prev, phone: val }))}
                                className="!bg-slate-900 !border-slate-800 !h-11 !rounded-xl"
                            />
                        </div>

                        {/* Expert Info */}
                        <div className="space-y-3">
                            <Label className="font-medium text-[10px]  text-slate-500 uppercase tracking-widest pl-1">Ekspertiz Detayları</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={expert.screen}
                                    onChange={e => setExpert(prev => ({ ...prev, screen: e.target.value }))}
                                    className="h-10 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs "
                                >
                                    <option value="Orijinal">Ekran: Org.</option>
                                    <option value="Değişmiş">Ekran: Değ.</option>
                                </select>
                                <select
                                    value={expert.liquid}
                                    onChange={e => setExpert(prev => ({ ...prev, liquid: e.target.value }))}
                                    className="h-10 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs "
                                >
                                    <option value="Yok">Sıvı: Yok</option>
                                    <option value="Var">Sıvı: Var</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="Tamir Geçmişi / Notlar"
                                value={expert.repair}
                                onChange={e => setExpert(prev => ({ ...prev, repair: e.target.value }))}
                                className="w-full h-24 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs  focus:border-blue-500 transition-colors resize-none custom-scrollbar"
                            />
                        </div>
                    </div>

                    {/* Print Section at the bottom of Sidebar */}
                    <div className="p-5 border-t border-slate-800/60 bg-slate-950/40 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                        <div className="flex items-start gap-2 text-[10px] text-slate-400  leading-relaxed">
                            <span className="text-amber-500 text-sm shrink-0">⚠️</span>
                            <span>Baskı öncesi girilen tüm bilgiler gerçek zamanlı olarak yan taraftaki önizlemeye yansır.</span>
                        </div>
                        <Button
                            onClick={handlePrint}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white  gap-2 h-12 rounded-xl shadow-lg shadow-blue-600/20 text-[11px] uppercase tracking-widest"
                        >
                            <Printer className="h-4 w-4" />
                            SÖZLEŞMEYİ YAZDIR
                        </Button>
                    </div>
                </div>

                {/* Right Side: Tabbed Content */}
                <Tabs defaultValue="contract" className="flex-1 flex flex-col min-w-0">
                    <div className="px-6 py-4 pr-14 flex justify-between items-center border-b border-slate-800/60 bg-slate-950/40">
                        <TabsList className="bg-slate-900 border-slate-800 p-1 rounded-2xl h-11 shrink-0">
                            <TabsTrigger value="contract" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 gap-2 h-9 text-[11px]  tracking-widest uppercase">
                                <FileText className="h-3.5 w-3.5" />
                                SÖZLEŞME
                            </TabsTrigger>
                            <TabsTrigger value="gallery" className="rounded-xl px-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-600/20 gap-2 h-9 text-[11px]  tracking-widest uppercase">
                                <Paperclip className="h-3.5 w-3.5" />
                                EKLER & GALERİ
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3">
                            <Eye className="h-4 w-4 text-slate-600" />
                            <div className="flex flex-col items-end shrink-0">
                                <h2 className="font-medium text-[12px]  text-white leading-none uppercase">{device.name}</h2>
                                <p className="text-[10px] text-slate-500  tracking-tight mt-1 truncate max-w-[150px]">IMEI: {device.deviceInfo?.imei || "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab 1: Contract Content */}
                    <TabsContent value="contract" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
                        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800/20 bg-slate-900/10">
                            <div className="flex gap-2">
                                <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                                    <button onClick={() => setFormType("purchase")} className={`px-3 py-1.5 rounded-md text-[10px]  transition-all ${formType === 'purchase' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>ALIŞ</button>
                                    <button onClick={() => setFormType("sale")} className={`px-3 py-1.5 rounded-md text-[10px]  transition-all ${formType === 'sale' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>SATIŞ</button>
                                </div>
                                <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                                    <button onClick={() => setPrintFormat("a4")} className={`px-3 py-1.5 rounded-md text-[10px]  transition-all ${printFormat === 'a4' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>A4 Standart</button>
                                    <button onClick={() => setPrintFormat("thermal")} className={`px-3 py-1.5 rounded-md text-[10px]  transition-all ${printFormat === 'thermal' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>80mm Termal</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-[#05070A] overflow-auto p-10 flex justify-center items-start custom-scrollbar">
                            <div className={`shadow-2xl ring-1 ring-white/5 ${printFormat === 'a4' ? 'w-[210mm]' : 'w-[80mm]'}`}>
                                {printFormat === "a4" ? (
                                    <A4Receipt device={device} formType={formType} date={now} customer={customer} expert={expert} shopInfo={shopInfo} />
                                ) : (
                                    <ThermalReceipt device={device} formType={formType} date={now} customer={customer} shopInfo={shopInfo} />
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Gallery Content */}
                    <TabsContent value="gallery" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden overflow-y-auto custom-scrollbar bg-[#05070A]">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="font-medium text-xl  text-white uppercase tracking-tight">Yüklenilen Belgeler</h3>
                                    <p className="text-xs text-slate-500 ">Cihaza ait fotoğraflar, faturalar ve kimlik görselleri.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*,application/pdf"
                                    />
                                    <Button
                                        disabled={isUploading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white  rounded-xl gap-2 shadow-lg shadow-emerald-600/20"
                                    >
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        YENİ EKLE
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {/* Photos Array */}
                                {device.deviceInfo?.photoUrls?.map((url: string, i: number) => {
                                    const isPdf = url.toLowerCase().includes('.pdf');

                                    const handleDelete = async () => {
                                        if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
                                        startTransition(async () => {
                                            const newPhotos = device.deviceInfo.photoUrls.filter((_: any, idx: number) => idx !== i);
                                            const res = await updateDeviceEntry(device.id, { photoUrls: newPhotos });
                                            if (res.success) toast.success("Fotoğraf silindi.");
                                            else toast.error("Hata oluştu.");
                                        });
                                    };

                                    const handleDownload = () => {
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `cihaz_foto_${i + 1}${isPdf ? '.pdf' : '.jpg'}`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    };

                                    return (
                                        <div key={`photo-${i}`} className="flex flex-col gap-2">
                                            <div className="group relative aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg shadow-black/40" onClick={() => window.open(url, '_blank')}>
                                                {isPdf ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 gap-2">
                                                        <FileText className="h-10 w-10 text-red-400" />
                                                        <span className="text-[10px]  text-slate-500 uppercase tracking-widest px-2 text-center">PDF Dosyası</span>
                                                    </div>
                                                ) : (
                                                    <img src={url} alt={`Photo ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                                    <span className="text-[9px]  text-white uppercase">Cihaz Görseli</span>
                                                    <div className="h-6 w-6 rounded-lg bg-emerald-500/20 backdrop-blur-md flex items-center justify-center border border-emerald-500/20">
                                                        {isPdf ? <FileText className="h-3 w-3 text-red-400" /> : <ImageIcon className="h-3 w-3 text-emerald-400" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleDownload} className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 text-[10px]  uppercase">
                                                    <Download className="h-3 w-3 text-blue-400" /> İndir
                                                </button>
                                                <button onClick={handleDelete} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Seller ID Photo */}
                                {device.deviceInfo?.sellerIdPhotoUrl && (() => {
                                    const url = device.deviceInfo.sellerIdPhotoUrl;
                                    const isPdf = url.toLowerCase().includes('.pdf');
                                    const handleDelete = async () => {
                                        if (!confirm("Kimlik görselini silmek istediğinize emin misiniz?")) return;
                                        startTransition(async () => {
                                            const res = await updateDeviceEntry(device.id, { sellerIdPhotoUrl: null });
                                            if (res.success) toast.success("Kimlik görseli silindi.");
                                            else toast.error("Hata oluştu.");
                                        });
                                    };
                                    const handleDownload = () => {
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `satıcı_kimlik${isPdf ? '.pdf' : '.jpg'}`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    };
                                    return (
                                        <div className="flex flex-col gap-2">
                                            <div className="group relative aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer shadow-lg shadow-black/40" onClick={() => window.open(url, '_blank')}>
                                                {isPdf ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 gap-2">
                                                        <FileText className="h-10 w-10 text-blue-400" />
                                                        <span className="text-[10px]  text-slate-500 uppercase tracking-widest px-2 text-center">Kimlik PDF</span>
                                                    </div>
                                                ) : (
                                                    <img src={url} alt="Kimlik" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                                    <span className="text-[9px]  text-blue-400 uppercase tracking-widest">KİMLİK BELGESİ</span>
                                                    <div className="h-6 w-6 rounded-lg bg-blue-500/20 backdrop-blur-md flex items-center justify-center border border-blue-500/20">
                                                        <FileText className="h-3 w-3 text-blue-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleDownload} className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 text-[10px]  uppercase">
                                                    <Download className="h-3 w-3 text-blue-400" /> İndir
                                                </button>
                                                <button onClick={handleDelete} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Invoice Photo / PDF */}
                                {device.deviceInfo?.invoiceUrl && (() => {
                                    const url = device.deviceInfo.invoiceUrl;
                                    const isPdf = url.toLowerCase().includes('.pdf');
                                    const handleDelete = async () => {
                                        if (!confirm("Fatura belgesini silmek istediğinize emin misiniz?")) return;
                                        startTransition(async () => {
                                            const res = await updateDeviceEntry(device.id, { invoiceUrl: null });
                                            if (res.success) toast.success("Fatura silindi.");
                                            else toast.error("Hata oluştu.");
                                        });
                                    };
                                    const handleDownload = () => {
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = `cihaz_faturası${isPdf ? '.pdf' : '.jpg'}`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    };
                                    return (
                                        <div className="flex flex-col gap-2">
                                            <div className="group relative aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer shadow-lg shadow-black/40" onClick={() => window.open(url, '_blank')}>
                                                {isPdf ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 gap-2">
                                                        <FileText className="h-10 w-10 text-red-400" />
                                                        <span className="text-[10px]  text-slate-500 uppercase tracking-widest px-2 text-center">Fatura PDF</span>
                                                    </div>
                                                ) : (
                                                    <img src={url} alt="Fatura" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
                                                    <span className="text-[9px]  text-purple-400 uppercase tracking-widest">SATIN ALMA FATURASI</span>
                                                    <div className="h-6 w-6 rounded-lg bg-purple-500/20 backdrop-blur-md flex items-center justify-center border border-purple-500/20">
                                                        <Paperclip className="h-3 w-3 text-purple-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleDownload} className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 text-[10px]  uppercase">
                                                    <Download className="h-3 w-3 text-blue-400" /> İndir
                                                </button>
                                                <button onClick={handleDelete} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Empty State */}
                                {!device.deviceInfo?.photoUrls?.length &&
                                    !device.deviceInfo?.sellerIdPhotoUrl &&
                                    !device.deviceInfo?.invoiceUrl && (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl opacity-30">
                                            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                                <Package className="h-8 w-8 text-slate-500" />
                                            </div>
                                            <h4 className="font-medium text-sm  text-white uppercase tracking-widest">HENÜZ BELGE YOK</h4>
                                            <p className="text-[10px] text-slate-500  mt-1 uppercase">YUKARIDAKİ BUTONDAN EKLEME YAPABİLİRSİNİZ</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}









