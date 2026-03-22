import { getServiceTicketById } from "@/lib/actions/service-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Smartphone } from "lucide-react";
import { PrintButton } from "@/components/printing/print-button";
import { Barcode } from "@/components/barcode/barcode";

export const dynamic = 'force-dynamic';

export default async function YazdirPage({ searchParams }: { searchParams: { id: string } }) {
  const ticket = await getServiceTicketById(searchParams.id);

  if (!ticket) {
    return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest bg-white">Servis kaydı bulunamadı.</div>;
  }

  return (
    <div className="bg-white text-black p-4 w-[80mm] mx-auto min-h-screen font-mono text-[10px] leading-tight flex flex-col gap-3">
      <div className="text-center border-b-2 pb-2 mb-2">
        <div className="flex items-center justify-center gap-1 font-bold text-lg">
          <Smartphone className="h-5 w-5" />
          <span>BAŞAR TEKNİK</span>
        </div>
        <p className="text-[8px] uppercase tracking-wider">Mobil Servis & Teknik Destek</p>
        <p className="text-[7px]">Tel: 0555 111 22 33 | Web: basarteknik.com</p>
      </div>

      <div className="flex justify-between items-center bg-gray-100 p-1 font-bold">
        <span>FİŞ NO:</span>
        <span className="text-sm">{ticket.ticketNumber}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="font-bold">TARİH:</span>
          <span>{format(new Date(ticket.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">MÜŞTERİ:</span>
          <span className="truncate w-32 text-right uppercase">{ticket.customer.name}</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span className="font-bold">TELEFON:</span>
          <span>{ticket.customer.phone}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="bg-gray-100 p-1 text-center font-bold text-[8px] uppercase">CİHAZ BİLGİLERİ</div>
        <div className="flex justify-between">
          <span className="font-bold">MODEL:</span>
          <span>{ticket.deviceBrand} {ticket.deviceModel}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">IMEI:</span>
          <span className="text-[9px]">{ticket.imei || "Bilinmiyor"}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="bg-gray-100 p-1 text-center font-bold text-[8px] uppercase">ARIZA VE DURUM</div>
        <p className="text-[9px] min-h-[20px] italic">"{ticket.problemDesc}"</p>
        <div className="flex justify-between items-center border-t pt-1">
          <span className="font-bold">DURUM:</span>
          <span className="font-bold border px-1 uppercase">{ticket.status}</span>
        </div>
      </div>

      <div className="flex justify-center my-2">
        <Barcode value={ticket.ticketNumber} height={40} fontSize={8} />
      </div>

      <div className="mt-4 border-t-2 border-dashed pt-4 text-center">
        <div className="bg-black text-white p-2 mb-2 font-bold text-lg">
          ₺{Number(ticket.estimatedCost || 0).toLocaleString('tr-TR')}
        </div>
        <p className="text-[7px] leading-none mb-4 italic">
          * Arıza tespit ücreti 150 TL'dir.<br/>
          * 3 ay içinde teslim alınmayan cihazlardan sorumluluk kabul edilmez.<br/>
          * Garanti sadece değişen parça için geçerlidir.
        </p>
        <div className="flex justify-around items-end pt-4 pb-2">
          <div className="flex flex-col gap-8">
            <span className="text-[7px]">Müşteri İmza</span>
            <div className="border-t border-black w-16"></div>
          </div>
          <div className="flex flex-col gap-8">
            <span className="text-[7px]">Teknisyen İmza</span>
            <div className="border-t border-black w-16"></div>
          </div>
        </div>
        <p className="text-[6px] mt-4 opacity-50">Telefon Takip v2 - Powered by Webfone</p>
      </div>

      <PrintButton />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .border { border: none !important; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}} />
    </div>
  );
}
