"use client";

import { useState, useTransition } from "react";
import { Search, Smartphone, ShieldCheck, Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryServiceStatus } from "@/lib/actions/service-actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";

const statusConfig: any = {
    PENDING: { label: "BEKLEMEDE", color: "bg-slate-500", desc: "Cihazınız teknik ekibimize ulaştı, inceleme sırası bekliyor." },
    APPROVED: { label: "ONAYLANDI", color: "bg-blue-500", desc: "Arıza tespiti yapıldı ve onayınız alındı. İşlem başlıyor." },
    REPAIRING: { label: "TAMİRDE", color: "bg-orange-500", desc: "Teknisyenimiz şu an cihazınız üzerinde çalışıyor." },
    WAITING_PART: { label: "PARÇA BEKLİYOR", color: "bg-purple-500", desc: "Onarım için gerekli parça tedarik aşamasındadır." },
    READY: { label: "HAZIR", color: "bg-emerald-500", desc: "Onarım tamamlandı! Cihazınızı teslim alabilirsiniz." },
    DELIVERED: { label: "TESLİM EDİLDİ", color: "bg-green-600", desc: "Cihazınız başarıyla teslim edilmiştir." },
    CANCELLED: { label: "İPTAL EDİLDİ", color: "bg-red-500", desc: "İşlem iptal edildi." },
};

export default function SorgulaPage() {
    const [ticketNumber, setTicketNumber] = useState("");
    const [phone, setPhone] = useState("");
    const [ticket, setTicket] = useState<any>(null);
    const [isPending, startTransition] = useTransition();
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await queryServiceStatus(ticketNumber, phone);
            setTicket(result);
            setSearched(true);
        });
    };

    return (
        <div className="min-h-screen bg-background text-white flex flex-col items-center p-6 md:p-20 font-sans">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6">
                        <ShieldCheck className="h-8 w-8 text-blue-500" />
                    </div>
                    <h1 className="text-4xl font-bold">CİHAZ <span className="text-blue-500">DURUMU</span> SORGULA</h1>
                    <p className="text-slate-500 font-bold text-[10px] mt-3">Orgelux Güvencesiyle 7/24 Şeffaf Takip</p>
                </div>

                {/* Search Form */}
                <Card className="matte-card border-border/10/50 mb-8 rounded-xl overflow-hidden">
                    <CardContent className="p-8">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 ml-1">Servis No (Örn: SRV-1001)</label>
                                <Input
                                    value={ticketNumber}
                                    onChange={(e) => setTicketNumber(e.target.value)}
                                    placeholder="Fiş üzerindeki no"
                                    className="bg-slate-900/60 border-border/10 h-14 rounded-2xl text-sm font-bold"
                                    required
                                />
                            </div>
                            <PhoneInput
                                label="Telefon Numarası (5xx...)"
                                required
                                value={phone}
                                onChange={(val: string) => setPhone(val)}
                            />
                            <div className="md:col-span-2">
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-sm"
                                >
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Search className="h-5 w-5 mr-3" />}
                                    SORGULAMAYI BAŞLAT
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                {searched && !ticket && !isPending && (
                    <div className="matte-card border-rose-500/20 bg-rose-500/5 p-8 rounded-xl text-center">
                        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-4" />
                        <p className="text-sm font-bold text-rose-500">Kayıt Bulunamadı</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Lütfen servis numarasını ve telefonunuzu kontrol ediniz.</p>
                    </div>
                )}

                {ticket && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <Card className="matte-card border-border/10/50 rounded-2xl overflow-hidden">
                            <div className="bg-blue-600/10 p-10 border-b border-border/10/50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <Badge className={`${statusConfig[ticket.status].color} border-none text-[10px] font-bold px-4 py-1.5 mb-4`}>
                                            {statusConfig[ticket.status].label}
                                        </Badge>
                                        <h2 className="text-3xl font-bold text-white">{ticket.deviceBrand} {ticket.deviceModel}</h2>
                                        <p className="text-slate-500 font-bold text-[10px] mt-2">IMEI: {ticket.imei || "BELİRTİLMEDİ"}</p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-bold text-slate-500 mb-1">Müşteri</p>
                                        <p className="text-xl font-bold text-white">{ticket.customer.name}</p>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-10 space-y-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <h3 className="text-xs font-bold text-white">GÜNCEL DURUM ANALİZİ</h3>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-border/10">
                                        <p className="text-sm font-medium text-slate-200 leading-relaxed">
                                            "{statusConfig[ticket.status].desc}"
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-3xl bg-slate-900/40 border border-border/10/50">
                                        <Calendar className="h-4 w-4 text-blue-500 mb-4" />
                                        <p className="text-[9px] font-bold text-slate-500 mb-1">Kayıt Tarihi</p>
                                        <p className="text-xs font-bold text-white">{format(new Date(ticket.createdAt), "dd MMMM yyyy", { locale: tr })}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-900/40 border border-border/10/50">
                                        <Clock className="h-4 w-4 text-blue-500 mb-4" />
                                        <p className="text-[9px] font-bold text-slate-500 mb-1">Teslim Tarihi</p>
                                        <p className="text-xs font-bold text-white">{ticket.estimatedDeliveryDate ? format(new Date(ticket.estimatedDeliveryDate), "dd MMMM yyyy", { locale: tr }) : "BELİRSİZ"}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-900/40 border border-border/10/50">
                                        <p className="text-blue-500 font-bold text-lg mb-2">₺</p>
                                        <p className="text-[9px] font-bold text-slate-500 mb-1">Tahmini Tutar</p>
                                        <p className="text-xs font-bold text-white">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <h3 className="text-xs font-bold text-white">SERVİS GEÇMİŞİ</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {ticket.logs.map((log: any, i: number) => (
                                            <div key={log.id} className="flex gap-4 relative">
                                                {i !== ticket.logs.length - 1 && <div className="absolute left-2.5 top-6 bottom-0 w-[1px] bg-slate-800" />}
                                                <div className={`h-5 w-5 rounded-full border-2 ${i === 0 ? 'bg-blue-600 border-blue-400 ' : 'bg-slate-900 border-border/10'} shrink-0`} />
                                                <div className="pb-4">
                                                    <p className={`text-xs font-bold ${i === 0 ? 'text-white' : 'text-slate-500'}`}>{log.message}</p>
                                                    <p className="text-[9px] font-bold text-slate-600 mt-1">{format(new Date(log.createdAt), "dd MMM yyyy - HH:mm", { locale: tr })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="text-center pb-20 opacity-30 flex flex-col items-center">
                            <div className="flex items-center gap-2 font-bold text-[10px] mb-1">
                                <Smartphone className="h-3 w-3" />
                                <span>TELEFON TAKİP V2</span>
                            </div>
                            <p className="text-[8px] font-bold text-slate-500">Orgelux Professional Service Infrastructure</p>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .matte-card {
            background: rgba(15, 23, 42, 0.4) !important;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        . {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }
      `}} />
        </div>
    );
}
