import { getServiceTicketById } from "@/lib/actions/service-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Smartphone,
    User,
    Calendar,
    Clock,
    CheckCircle2,
    Wrench,
    AlertCircle,
    Hash,
    Activity,
    UserCog,
    History,
    ArrowLeft,
    Settings2,
    Package,
    CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServicePartManager } from "@/components/service/service-part-manager";
import { ServiceStatusUpdater } from "@/components/service/service-status-updater";
import { formatPhone } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
    PENDING: "text-gray-500 bg-gray-500/10 border-gray-500/20",
    APPROVED: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    REPAIRING: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    WAITING_PART: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    READY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    DELIVERED: "text-blue-500 bg-blue-500/10 border-blue-500/20 ",
    CANCELLED: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};

const statusLabels: Record<string, string> = {
    PENDING: "BEKLEMEDE",
    APPROVED: "ONAYLANDI",
    REPAIRING: "TAMİRDE",
    WAITING_PART: "PARÇA BEKLİYOR",
    READY: "HAZIR",
    DELIVERED: "TESLİM EDİLDİ",
    CANCELLED: "İPTAL EDİLDİ",
};

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
    const ticket = await getServiceTicketById(params.id);
    const products = await getProducts();

    if (!ticket) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-8 pb-20 bg-background text-white min-h-screen p-8">
            {/* Header Profile Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/servis/liste">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 text-gray-500 hover:text-white transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="font-medium text-3xl ">{ticket.deviceBrand} <span className="text-blue-500">{ticket.deviceModel}</span></h1>
                            <Badge variant="outline" className={`text-[10px]  px-4 py-1 rounded-xl whisper-border ${statusColors[ticket.status]}`}>
                                {statusLabels[ticket.status]}
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500  mt-1 tracking-wider">Servis Kaydı Analizi • #{ticket.ticketNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-[10px]  text-blue-500 bg-blue-500/5 border border-blue-500/20 h-10 rounded-xl px-6 hover:bg-blue-500/10 transition-all">
                        PROFİLİ DÜZENLE
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Device & Customer Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-card border-white/5 shadow-none group overflow-hidden relative">
                            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-blue-500" />
                            <CardHeader className="border-b border-white/[0.03] pb-4 bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-4 w-4 text-blue-500" />
                                    <CardTitle className="font-medium text-xs  text-white">Cihaz Bilgileri</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                                    <span className="text-xs  text-gray-600">IMEI / SERÍ NO</span>
                                    <span className="text-sm  text-white">{ticket.imei || ticket.serialNumber || 'Bilinmiyor'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                                    <span className="text-xs  text-gray-600">KOZMETİK DURUM</span>
                                    <span className="text-sm  text-white">{ticket.cosmeticCondition || 'Normal'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs  text-gray-600">ARIZA TANIMI</span>
                                    <span className="text-sm  text-blue-400">{ticket.problemDesc}</span>
                                </div>
                                <div className="pt-6 border-t border-white/[0.03]">
                                    <ServicePartManager
                                        ticketId={ticket.id}
                                        products={products}
                                        currentParts={ticket.usedParts}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-white/5 shadow-none group overflow-hidden relative">
                            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-emerald-500" />
                            <CardHeader className="border-b border-white/[0.03] pb-4 bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-emerald-500" />
                                    <CardTitle className="font-medium text-xs  text-white">Müşteri Profili</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                                    <span className="text-xs  text-gray-600">AD SOYAD</span>
                                    <span className="text-sm  text-white">{ticket.customer.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/[0.02] pb-3">
                                    <span className="text-xs  text-gray-600">İLETİŞİM</span>
                                    <span className="text-sm  text-white">{ticket.customer.phone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs  text-gray-600">TOPLAM İŞLEM</span>
                                    <span className="text-sm  text-emerald-500">{ticket.customer.loyaltyPoints} PUAN</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Vertical Journey Timeline */}
                    <Card className="bg-card border-white/5 shadow-none">
                        <CardHeader className="border-b border-white/[0.03] pb-6 bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <CardTitle className="font-medium text-sm  text-white">Servis Yolculuğu</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-blue-500 before:to-transparent">
                                {ticket.logs.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-background text-blue-500 shadow-none z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:scale-110 group-hover:border-blue-500/50 transition-all">
                                            {idx === 0 ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl whisper-border border-white/5 bg-white/[0.02] shadow-none group-hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className=" text-white text-xs">{statusLabels[log.status]}</div>
                                                <time className="text-[10px]  text-gray-500">{format(new Date(log.createdAt), "d MMM, HH:mm", { locale: tr })}</time>
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-medium">"{log.message}"</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Financial & Actions */}
                <div className="space-y-8">
                    <Card className="bg-card border-white/5 shadow-none group overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-blue-500" />
                        <CardHeader className="border-b border-white/[0.03] pb-4 bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <CardTitle className="font-medium text-xs  text-white">Finansal Özet</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="text-center">
                                <p className="text-xs  text-gray-600 mb-2">TAHMİNİ ÜCRET</p>
                                <h2 className="font-medium text-5xl  text-white">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                    <p className="text-[11px]  text-gray-600 mb-1">ALINAN KAPORA</p>
                                    <p className="text-lg  text-emerald-500">₺0</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                    <p className="text-[11px]  text-gray-600 mb-1">KALAN TUTAR</p>
                                    <p className="text-lg  text-blue-500">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-white/5 shadow-none group overflow-hidden relative">
                        <CardHeader className="border-b border-white/[0.03] pb-4 bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <UserCog className="h-4 w-4 text-blue-500" />
                                <CardTitle className="font-medium text-xs  text-white">Ekip & Operasyon</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] whisper-border border-white/5">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500  text-xs">
                                    {ticket.technician?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-xs  text-gray-600">GÖREVLİ TEKNİSYEN</p>
                                    <p className="text-sm  text-white">{ticket.technician?.name || 'HENÜZ ATANMADI'}</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <ServiceStatusUpdater ticketId={ticket.id} currentStatus={ticket.status} />
                                <Button variant="outline" className="w-full h-12 rounded-2xl border-white/5 bg-white/[0.03] text-white  hover:bg-white/5 transition-all">
                                    FİŞ YAZDIR
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-10 rounded-[2.5rem] whisper-border border-rose-500/20 bg-rose-500/5 flex items-start gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertCircle className="h-32 w-32 text-rose-500 -mr-16 -mt-16" />
                        </div>
                        <AlertCircle className="h-8 w-8 text-rose-500 shrink-0 mt-1" />
                        <div className="relative z-10 space-y-3">
                            <h4 className="font-medium text-sm  text-rose-500 tracking-[0.2em]">Sistem Uyarısı</h4>
                            <p className="text-lg text-rose-500/90  leading-tight animate-in fade-in slide-in-from-left-4 duration-700">
                                "Bu cihaz 3 günden uzun süredir işlem bekliyor. Müşteri memnuniyeti için öncelik verin."
                            </p>
                            <div className="flex gap-2 pt-2">
                                <div className="h-1 w-12 rounded-full bg-rose-500/40" />
                                <div className="h-1 w-6 rounded-full bg-rose-500/20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}







