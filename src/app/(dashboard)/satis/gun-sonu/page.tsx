import { getSalesHistoryReport, getUnifiedHistory } from "@/lib/actions/activity-actions";
import { endOfDay, startOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gün Sonu Özeti | Başar Teknik",
    description: "Gün sonu satış raporu çıktısı.",
};

export const dynamic = 'force-dynamic';

export default async function EndOfDayPrintPage({
    searchParams
}: {
    searchParams: { startDate?: string, endDate?: string }
}) {
    const now = new Date();
    const startDate = searchParams.startDate || startOfMonth(now).toISOString();
    const endDate = searchParams.endDate || endOfDay(now).toISOString();

    const [historyData, reportData] = await Promise.all([
        getUnifiedHistory({
            page: 1,
            pageSize: 1000,
            typeFilter: "ALL",
            startDate,
            endDate
        }),
        getSalesHistoryReport({ startDate, endDate })
    ]);

    const { current } = reportData.periods;

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-0 print:m-0 print:max-w-none">
            {/* Sadece yazdırırken görünen bir script veya CSS de eklenebilir. Şimdilik tarayıcının yazdır diyaloğunu kullanacağız. */}
            <div className="mb-6 flex items-end justify-between border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-3xl font-bold">GÜN SONU ÖZETİ</h1>
                    <p className="text-sm text-gray-600">Başar Teknik Servis & Mağaza</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold">Tarih Aralığı:</p>
                    <p className="text-sm">{format(new Date(startDate), "dd MMM yyyy", { locale: tr })} - {format(new Date(endDate), "dd MMM yyyy", { locale: tr })}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h2 className="text-lg font-bold border-b border-black mb-2">Genel Özet</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr><td className="py-1">Toplam Ciro:</td><td className="font-bold text-right">{current.revenue.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td></tr>
                            <tr><td className="py-1">Toplam Kâr:</td><td className="font-bold text-right">{current.profit.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td></tr>
                            <tr><td className="py-1">İşlem Sayısı:</td><td className="font-bold text-right">{current.saleCount}</td></tr>
                            <tr><td className="py-1">Ürün Sayısı:</td><td className="font-bold text-right">{current.itemCount}</td></tr>
                            <tr><td className="py-1">Kâr Marjı:</td><td className="font-bold text-right">%{current.profitMargin.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <h2 className="text-lg font-bold border-b border-black mb-2">Ödeme Kanalları</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {reportData.paymentBreakdown.map((pb) => (
                                <tr key={pb.method}>
                                    <td className="py-1">{pb.label}:</td>
                                    <td className="font-bold text-right">{pb.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {reportData.staffPerformance && reportData.staffPerformance.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold border-b border-black mb-2">Personel Performansı</h2>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2">Personel</th>
                                <th className="py-2 text-right">Kâr</th>
                                <th className="py-2 text-right">Ciro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.staffPerformance.map((staff) => (
                                <tr key={staff.id} className="border-b border-gray-200">
                                    <td className="py-2">{staff.name}</td>
                                    <td className="py-2 text-right">{staff.profit.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                                    <td className="py-2 text-right font-bold">{staff.revenue.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-lg font-bold border-b border-black mb-2">İşlem Detayları ({historyData.items.length} İşlem)</h2>
                <table className="w-full text-xs text-left border-collapse">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-2">Saat</th>
                            <th className="py-2">İşlem Tipi</th>
                            <th className="py-2">Ürün/Açıklama</th>
                            <th className="py-2">Personel</th>
                            <th className="py-2">Ödeme</th>
                            <th className="py-2 text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-300">
                                <td className="py-1.5">{format(new Date(item.date), "HH:mm")}</td>
                                <td className="py-1.5">{item.type === "SALE" ? "Satış" : item.type === "PAYMENT" ? "Tahsilat" : item.type === "DEBT_DIRECT" ? "Veresiye" : "İşlem"}</td>
                                <td className="py-1.5 truncate max-w-[200px]">{item.title || "-"}</td>
                                <td className="py-1.5">{item.staffName || "-"}</td>
                                <td className="py-1.5">{item.paymentMethod === "CASH" ? "Nakit" : item.paymentMethod === "CARD" ? "Kart" : item.paymentMethod === "TRANSFER" ? "Havale" : item.paymentMethod === "DEBT" ? "Veresiye" : item.paymentMethod}</td>
                                <td className="py-1.5 text-right font-semibold">{item.amount.toLocaleString("tr-TR", { style: "currency", currency: item.currency || "TRY" })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-12 pt-4 border-t-2 border-black text-center text-xs text-gray-500">
                <p>Bu belge {format(now, "dd.MM.yyyy HH:mm")} tarihinde sistem tarafından oluşturulmuştur.</p>
                <div className="mt-4 print:hidden">
                    <p className="text-sm font-semibold text-gray-700">Sayfayı yazdırmak için CTRL+P veya CMD+P tuşlarını kullanabilirsiniz.</p>
                </div>
            </div>
            {/* Auto trigger print when page loads in a real environment */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.onload = function() { setTimeout(function() { window.print(); }, 500); }`
                }}
            />
        </div>
    );
}
