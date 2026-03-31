import { getServiceTicketById } from "@/lib/actions/service-actions";
import { getReceiptSettings } from "@/lib/actions/receipt-settings";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Smartphone, Mail, Globe, MapPin, Phone, ShieldCheck } from "lucide-react";
import { PrintButton } from "@/components/printing/print-button";
import { Barcode } from "@/components/barcode/barcode";

export const dynamic = 'force-dynamic';

export default async function YazdirPage({ searchParams }: { searchParams: { id: string } }) {
  const ticket = await getServiceTicketById(searchParams.id);
  const settings = await getReceiptSettings("service");

  if (!ticket) {
    return <div className="p-8 text-center text-red-500 font-bold bg-white">Servis kaydı bulunamadı.</div>;
  }

  return (
    <div className="bg-white text-black p-4 w-[80mm] mx-auto min-h-screen font-sans text-[10px] leading-tight flex flex-col">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-center gap-2 font-bold text-2xl mb-1">
          <Smartphone className="h-6 w-6" />
          <span>{settings?.title || "BAŞAR TEKNİK"}</span>
        </div>
        <p className="text-[9px] font-bold mb-2">{settings?.subtitle || "Mobil servis & teknik destek"}</p>

        <div className="flex flex-col gap-1 items-center text-[7px] font-medium text-gray-700">
          {settings?.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-2 w-2" />
              <span>{settings.address}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Phone className="h-2 w-2" />
              <span>{settings?.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-2 w-2" />
              <span>{settings?.website}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Info Bar */}
      <div className="flex justify-between items-center bg-black text-white px-2 py-2 mb-4">
        <span className="font-bold text-[10px]">SERVİS FİŞİ</span>
        <span className="text-sm font-bold">{ticket.ticketNumber}</span>
      </div>

      {/* Customer & Date */}
      <div className="space-y-2 mb-4 border-b pb-4 border-black/10">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[7px] font-bold text-gray-500 mb-0.5">Müşteri bilgisi</p>
            <p className="font-bold text-[11px] leading-none">{ticket.customer.name}</p>
            <p className="text-[9px] font-bold mt-1">{ticket.customer.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-bold text-gray-500 mb-0.5">Kayıt tarihi</p>
            <p className="font-bold text-[9px]">{format(new Date(ticket.createdAt), "dd.MM.yyyy", { locale: tr })}</p>
            <p className="text-[8px] font-medium text-gray-500">{format(new Date(ticket.createdAt), "HH:mm", { locale: tr })}</p>
          </div>
        </div>
      </div>

      {/* Device Info Section */}
      <div className="mb-4">
        <div className="bg-gray-100 px-2 py-1.5 mb-2 rounded-sm">
          <p className="text-[8px] font-bold text-center">CİHAZ VE ARIZA BİLGİLERİ</p>
        </div>
        <div className="space-y-1.5 px-1">
          <div className="flex justify-between items-baseline border-b border-dashed border-gray-200 pb-1">
            <span className="text-[8px] font-bold text-gray-500">MARKA / MODEL:</span>
            <span className="font-bold text-[10px]">{ticket.deviceBrand} {ticket.deviceModel}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-dashed border-gray-200 pb-1">
            <span className="text-[8px] font-bold text-gray-500">IMEI / SERİ NO:</span>
            <span className="font-bold text-[9px] select-all">{ticket.imei || ticket.serialNumber || "Yok"}</span>
          </div>
          <div className="mt-2">
            <p className="text-[8px] font-bold text-gray-500 mb-1">BİLDİRİLEN ARIZA:</p>
            <div className="bg-gray-50 p-2 border border-gray-100 rounded-sm text-[9px] leading-tight font-medium">
              "{ticket.problemDesc}"
            </div>
          </div>
        </div>
      </div>

      {/* Used Parts & Warranty */}
      {ticket.usedParts && ticket.usedParts.length > 0 && (
        <div className="mb-6">
          <div className="bg-gray-100 px-2 py-1.5 mb-2 rounded-sm">
            <p className="text-[8px] font-bold text-center">KULLANILAN PARÇALAR VE GARANTİ</p>
          </div>
          <div className="space-y-2">
            {ticket.usedParts.map((part: any, idx: number) => (
              <div key={idx} className="border-b border-gray-100 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-[9px]">{part.product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[7px] text-gray-500">Konum: {part.product.location || "Depo"}</span>
                      {part.product.warrantyMonths > 0 && (
                        <div className="flex items-center gap-1 text-blue-600 font-bold text-[7px]">
                          <ShieldCheck className="h-2 w-2" />
                          <span>{part.product.warrantyMonths} ay garanti</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-[9px] ml-4">₺{Number(part.unitPrice).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Section */}
      <div className="flex flex-col items-center justify-center my-6 py-4 border-y border-black/5 bg-gray-50/50">
        <Barcode value={ticket.ticketNumber} height={45} fontSize={10} />
        <p className="text-[7px] font-bold text-gray-400 mt-1">www.basarteknik.com/sorgula</p>
      </div>

      {/* Pricing & Summary */}
      <div className="mb-6">
        <div className="flex justify-between items-center border-t-2 border-black pt-3">
          <span className="text-[10px] font-bold">TOPLAM TUTAR</span>
          <span className="text-xl font-bold">₺{Number(ticket.actualCost > 0 ? ticket.actualCost : ticket.estimatedCost).toLocaleString('tr-TR')}</span>
        </div>
        <p className="text-[7px] font-bold text-gray-400 text-right mt-0.5">Fiyatlara KDV dahildir.</p>
      </div>

      {/* Terms & Conditions */}
      {settings?.terms && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
          <p className="text-[8px] font-bold mb-1.5 border-b border-gray-200 pb-1">ÖNEMLİ ŞARTLAR</p>
          <div className="text-[6.5px] text-gray-600 font-medium leading-relaxed whitespace-pre-line">
            {settings.terms}
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div className="flex justify-between items-end px-4 mb-8">
        <div className="text-center">
          <p className="text-[7px] font-bold mb-8">MÜŞTERİ İMZA</p>
          <div className="w-20 border-t border-black"></div>
        </div>
        <div className="text-center">
          <p className="text-[7px] font-bold mb-8">TEKNİSYEN İMZA</p>
          <div className="w-20 border-t border-black"></div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto text-center opacity-40 grayscale pb-2">
        <div className="flex items-center justify-center gap-1 font-bold text-[8px] mb-0.5">
          <Smartphone className="h-2 w-2" />
          <span>TELEFON TAKİP V2</span>
        </div>
        <p className="text-[6px] font-bold">POWERED BY WEBFONE SOFTWARE SOLUTIONS</p>
      </div>

      <PrintButton />

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');

        body {
            font-family: 'Inter', sans-serif !important;
            -webkit-print-color-adjust: exact;
        }

        @media print {
          .no-print { display: none !important; }
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .border { border-style: solid !important; }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
