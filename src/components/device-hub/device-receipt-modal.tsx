"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, X, ShoppingCart, Package } from "lucide-react";

interface DeviceReceiptModalProps {
    device: any;
    children?: React.ReactNode;
}

type FormType = "purchase" | "sale";
type PrintFormat = "a4" | "thermal";

const SHOP_INFO = {
    name: "Başar Teknik (Enes Başar)",
    address: "İstiklal Cad. No:10, 34000 (Örnek Adres)",
    taxInfo: "Vergi Dairesi: Beşiktaş / No: 1234567890",
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
}: {
    device: DeviceReceiptModalProps["device"];
    formType: FormType;
    date: string;
    customer: CustomerInfo;
    expert: DeviceExpertInfo;
}) {
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
                    2. EL CİHAZ ALIM-SATIM VE DEVİR SÖZLEŞMESİ
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
                        {SHOP_INFO.name} <br />
                        {SHOP_INFO.taxInfo} <br />
                        {SHOP_INFO.address}
                    </div>
                    <div style={{ fontSize: "9pt" }}>
                        <strong style={{ display: "block", marginBottom: "2px" }}>SATICI:</strong>
                        {customer.name || "{Müşteri Ad Soyad}"} <br />
                        TC: {customer.tc || "{TC Kimlik No}"} <br />
                        Tel: {customer.phone || "{Telefon No}"}
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
                        <div style={{ marginTop: "5px", fontSize: "9pt" }}>Başar Teknik</div>
                    </div>
                    <div style={{ textAlign: "center", width: "200px" }}>
                        <span style={{ fontWeight: 800, fontSize: "10pt" }}>SATICI (Ad Soyad/İmza)</span>
                        <div style={{ marginTop: "5px", fontSize: "9pt" }}>{customer.name}</div>
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
}: {
    device: DeviceReceiptModalProps["device"];
    formType: FormType;
    date: string;
    customer: CustomerInfo;
}) {
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
                <div style={{ fontWeight: 900, fontSize: "10pt" }}>BAŞAR TEKNİK</div>
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

    const [customer, setCustomer] = useState<CustomerInfo>({ name: "", tc: "", phone: "" });
    const [expert, setExpert] = useState<DeviceExpertInfo>({ screen: "Orijinal", liquid: "Yok", repair: "" });

    const now = new Date().toLocaleDateString("tr-TR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

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
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-colors border border-slate-700/60">
                        <FileText className="h-3.5 w-3.5" />
                        Belge
                    </button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-[1100px] p-0 bg-[#0B0F19] text-slate-200 border border-slate-800/60 shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">

                {/* Left Side: Form Inputs */}
                <div className="w-full md:w-80 border-r border-slate-800/60 flex flex-col bg-slate-950/20 shrink-0">
                    <div className="p-5 border-b border-slate-800/60">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Sözleşme Bilgileri</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Baskı öncesi detayları doldurun.</p>
                    </div>

                    <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Customer Info */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Müşteri Bilgileri</label>
                            <input
                                placeholder="Adı Soyadı"
                                value={customer.name}
                                onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold focus:border-blue-500 transition-colors"
                            />
                            <input
                                placeholder="TC Kimlik No"
                                value={customer.tc}
                                onChange={e => setCustomer(prev => ({ ...prev, tc: e.target.value }))}
                                className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold focus:border-blue-500 transition-colors"
                            />
                            <input
                                placeholder="Telefon No"
                                value={customer.phone}
                                onChange={e => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Expert Info */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ekspertiz Detayları</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={expert.screen}
                                    onChange={e => setExpert(prev => ({ ...prev, screen: e.target.value }))}
                                    className="h-10 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold"
                                >
                                    <option value="Orijinal">Ekran: Org.</option>
                                    <option value="Değişmiş">Ekran: Değ.</option>
                                </select>
                                <select
                                    value={expert.liquid}
                                    onChange={e => setExpert(prev => ({ ...prev, liquid: e.target.value }))}
                                    className="h-10 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold"
                                >
                                    <option value="Yok">Sıvı: Yok</option>
                                    <option value="Var">Sıvı: Var</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="Tamir Geçmişi / Notlar"
                                value={expert.repair}
                                onChange={e => setExpert(prev => ({ ...prev, repair: e.target.value }))}
                                className="w-full h-20 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold focus:border-blue-500 transition-colors resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Preview & Settings */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800/60 bg-slate-950/40">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <FileText className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white">{device.name}</h2>
                                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Sözleşme Önizleme</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                                <button onClick={() => setFormType("purchase")} className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${formType === 'purchase' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>ALIŞ</button>
                                <button onClick={() => setFormType("sale")} className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${formType === 'sale' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>SATIŞ</button>
                            </div>
                            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                                <button onClick={() => setPrintFormat("a4")} className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${printFormat === 'a4' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>A4</button>
                                <button onClick={() => setPrintFormat("thermal")} className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${printFormat === 'thermal' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>FİŞ</button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-[#05070A] overflow-auto p-10 flex justify-center items-start custom-scrollbar">
                        <div className={`shadow-2xl ring-1 ring-white/5 ${printFormat === 'a4' ? 'w-[210mm]' : 'w-[80mm]'}`}>
                            {printFormat === "a4" ? (
                                <A4Receipt device={device} formType={formType} date={now} customer={customer} expert={expert} />
                            ) : (
                                <ThermalReceipt device={device} formType={formType} date={now} customer={customer} />
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex justify-between items-center">
                        <p className="text-[10px] text-slate-500 font-bold max-w-sm">
                            ⚠️ Sözleşme resmi evrak niteliğindedir. Bilgilerin doğruluğunu kontrol ediniz.
                        </p>
                        <Button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black gap-2 h-11 px-8 rounded-xl shadow-lg shadow-blue-600/20"
                        >
                            <Printer className="h-4 w-4" />
                            SÖZLEŞMEYİ YAZDIR
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
