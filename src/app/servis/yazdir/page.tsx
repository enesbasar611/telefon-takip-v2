import { getServiceTicketById } from "@/lib/actions/service-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Smartphone, Mail, Globe, MapPin, Phone } from "lucide-react";
import { PrintButton } from "@/components/printing/print-button";
import { Barcode } from "@/components/barcode/barcode";

export const dynamic = 'force-dynamic';

export default async function YazdirPage({ searchParams }: { searchParams: { id: string } }) {
  const ticket = await getServiceTicketById(searchParams.id);

  if (!ticket) {
    return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest bg-white">Servis kaydı bulunamadı.</div>;
  }

  return (
    <div className="bg-white text-black p-4 w-[80mm] mx-auto min-h-screen font-sans text-[10px] leading-tight flex flex-col">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-center gap-2 font-black text-2xl mb-1">
          <Smartphone className="h-6 w-6" />
          <span>BAŞAR TEKNİK</span>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Mobil Servis & Teknik Destek</p>

        <div className="flex flex-col gap-1 items-center text-[7px] font-medium text-gray-700">
          <div className="flex items-center gap-1">
            <MapPin className="h-2 w-2" />
            <span>Merkez Mah. Atatürk Cad. No:123/A İstanbul</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Phone className="h-2 w-2" />
              <span>0555 111 22 33</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-2 w-2" />
              <span>basarteknik.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Info Bar */}
      <div className="flex justify-between items-center bg-black text-white px-2 py-2 mb-4">
        <span className="font-black text-[10px] tracking-widest uppercase">SERVİS FİŞİ</span>
        <span className="text-sm font-black tracking-tighter">{ticket.ticketNumber}</span>
      </div>

      {/* Customer & Date */}
      <div className="space-y-2 mb-4 border-b pb-4 border-black/10">
        <div className="grid grid-cols-2 gap-2">
            <div>
                <p className="text-[7px] font-black text-gray-500 uppercase mb-0.5">Müşteri Bilgisi</p>
                <p className="font-black text-[11px] uppercase leading-none">{ticket.customer.name}</p>
                <p className="text-[9px] font-bold mt-1 tracking-tighter">{ticket.customer.phone}</p>
            </div>
            <div className="text-right">
                <p className="text-[7px] font-black text-gray-500 uppercase mb-0.5">Kayıt Tarihi</p>
                <p className="font-bold text-[9px]">{format(new Date(ticket.createdAt), "dd.MM.yyyy", { locale: tr })}</p>
                <p className="text-[8px] font-medium text-gray-500">{format(new Date(ticket.createdAt), "HH:mm", { locale: tr })}</p>
            </div>
        </div>
      </div>

      {/* Device Info Section */}
      <div className="mb-4">
        <div className="bg-gray-100 px-2 py-1.5 mb-2 rounded-sm">
            <p className="text-[8px] font-black uppercase tracking-widest text-center">CİHAZ VE ARIZA BİLGİLERİ</p>
        </div>
        <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-baseline border-b border-dashed border-gray-200 pb-1">
                <span className="text-[8px] font-bold text-gray-500 uppercase">MARKA / MODEL:</span>
                <span className="font-black text-[10px]">{ticket.deviceBrand} {ticket.deviceModel}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-dashed border-gray-200 pb-1">
                <span className="text-[8px] font-bold text-gray-500 uppercase">IMEI / SERİ NO:</span>
                <span className="font-bold text-[9px] tracking-tighter select-all">{ticket.imei || ticket.serialNumber || "YOK"}</span>
            </div>
            <div className="mt-2">
                <p className="text-[8px] font-bold text-gray-500 uppercase mb-1">BİLDİRİLEN ARIZA:</p>
                <div className="bg-gray-50 p-2 border border-gray-100 rounded-sm italic text-[9px] leading-tight font-medium">
                    "{ticket.problemDesc}"
                </div>
            </div>
            {ticket.cosmeticCondition && (
                <div className="mt-2">
                    <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">KOZMETİK DURUM:</p>
                    <p className="text-[8px] font-medium text-gray-700">{ticket.cosmeticCondition}</p>
                </div>
            )}
        </div>
      </div>

      {/* Barcode Section */}
      <div className="flex flex-col items-center justify-center my-6 py-4 border-y border-black/5 bg-gray-50/50">
        <Barcode value={ticket.ticketNumber} height={45} fontSize={10} />
        <p className="text-[7px] font-bold text-gray-400 mt-1 tracking-[0.3em]">www.basarteknik.com/sorgula</p>
      </div>

      {/* Pricing & Summary */}
      <div className="mb-6">
        <div className="flex justify-between items-center border-t-2 border-black pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest">TOPLAM TUTAR</span>
            <span className="text-xl font-black tracking-tighter">₺{Number(ticket.estimatedCost || 0).toLocaleString('tr-TR')}</span>
        </div>
        <p className="text-[7px] font-bold text-gray-400 text-right mt-0.5">Tahmini tutardır, parça değişiminde güncellenebilir.</p>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
        <p className="text-[8px] font-black uppercase mb-1.5 border-b border-gray-200 pb-1">ÖNEMLİ ŞARTLAR</p>
        <ul className="text-[6px] text-gray-600 space-y-1 font-medium leading-relaxed">
          <li className="flex gap-1"><span>•</span> <span>Arıza tespit ücreti 150 TL'dir. İptal edilen cihazlarda bu ücret tahsil edilir.</span></li>
          <li className="flex gap-1"><span>•</span> <span>30 gün içinde teslim alınmayan cihazlardan işletmemiz sorumlu değildir.</span></li>
          <li className="flex gap-1"><span>•</span> <span>Sıvı temaslı ve darbe almış cihazlarda işlem sonrası farklı arızalar oluşabilir.</span></li>
          <li className="flex gap-1"><span>•</span> <span>Yedekleme sorumluluğu müşteriye aittir. Veri kaybından firmamız sorumlu tutulamaz.</span></li>
        </ul>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end px-4 mb-8">
        <div className="text-center">
          <p className="text-[7px] font-black uppercase mb-8">MÜŞTERİ İMZA</p>
          <div className="w-20 border-t border-black"></div>
        </div>
        <div className="text-center">
          <p className="text-[7px] font-black uppercase mb-8">TEKNİSYEN İMZA</p>
          <div className="w-20 border-t border-black"></div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto text-center opacity-40 grayscale pb-2">
        <div className="flex items-center justify-center gap-1 font-bold text-[8px] mb-0.5">
            <Smartphone className="h-2 w-2" />
            <span>TELEFON TAKİP V2</span>
        </div>
        <p className="text-[6px] tracking-widest font-black uppercase">POWERED BY WEBFONE SOFTWARE SOLUTIONS</p>
      </div>

      <PrintButton />

      <style dangerouslySetInnerHTML={{ __html: `
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
