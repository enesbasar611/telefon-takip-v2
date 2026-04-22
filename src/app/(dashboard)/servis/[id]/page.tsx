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
    CreditCard,
    Grid3x3,
    Lock
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServicePartManager } from "@/components/service/service-part-manager";
import { ServiceDetailActions } from "@/components/service/service-detail-actions";
import { TechnicalServiceAnalysisModal } from "@/components/service/technical-service-analysis-modal";
import { PatternLock } from "@/components/ui/pattern-lock";

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
    PENDING: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    APPROVED: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    REPAIRING: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    WAITING_PART: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    READY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    DELIVERED: "text-emerald-600 bg-emerald-600/10 border-emerald-600/20",
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
        <div className="flex flex-col gap-8 pb-20 bg-background text-foreground min-h-screen p-8">
            {/* Header Profile Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/servis/liste">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground transition-all">
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
                        <p className="text-xs text-muted-foreground  mt-1 tracking-wider">Servis Kaydı Analizi • #{ticket.ticketNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <TechnicalServiceAnalysisModal />
                    <Button variant="ghost" className="text-[10px]  text-blue-500 bg-blue-500/5 border border-blue-500/20 h-10 rounded-xl px-6 hover:bg-blue-500/10 transition-all font-bold">
                        DÜZENLE
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Device & Customer Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-card border-border/50 shadow-none group overflow-hidden relative">
                            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-blue-500" />
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-4 w-4 text-blue-500" />
                                    <CardTitle className="font-medium text-xs  text-foreground">Cihaz Bilgileri</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-xs  text-muted-foreground">IMEI / SERÍ NO</span>
                                    <span className="text-sm  text-foreground">{ticket.imei || ticket.serialNumber || 'Bilinmiyor'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-xs  text-muted-foreground">KOZMETİK DURUM</span>
                                    <span className="text-sm  text-foreground">{ticket.cosmeticCondition || 'Normal'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs  text-muted-foreground">ARIZA TANIMI</span>
                                    <span className="text-sm  text-blue-400">{ticket.problemDesc}</span>
                                </div>

                                {ticket.devicePassword && (
                                    <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-3 w-3 text-amber-500" />
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Cihaz Erişimi</span>
                                        </div>
                                        {ticket.devicePassword.startsWith("DESEN:") ? (
                                            <div className="flex items-start gap-6">
                                                <div className="bg-black/40 rounded-2xl p-2 border border-blue-500/10 inline-block">
                                                    <PatternLock
                                                        readOnly
                                                        width={120}
                                                        height={120}
                                                        initialPattern={ticket.devicePassword.replace("DESEN:", "").split(",").map(Number)}
                                                        className="opacity-80"
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                        <Grid3x3 className="h-3.5 w-3.5 text-blue-500" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-blue-500/60 uppercase">Ekran Deseni</span>
                                                            <span className="text-xs font-bold tracking-[0.2em] text-blue-400">
                                                                {ticket.devicePassword.replace("DESEN:", "").split(",").join("-")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 w-fit min-w-[200px]">
                                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                    <Hash className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-amber-500/60 uppercase">Kilit Şifresi</span>
                                                    <span className="text-sm font-bold text-amber-500 tracking-wider">
                                                        {ticket.devicePassword}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-6 border-t border-border/50">
                                    <ServicePartManager
                                        ticketId={ticket.id}
                                        products={products}
                                        currentParts={ticket.usedParts}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border/50 shadow-none group overflow-hidden relative">
                            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-emerald-500" />
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-emerald-500" />
                                    <CardTitle className="font-medium text-xs  text-foreground">Müşteri Profili</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-xs  text-muted-foreground">AD SOYAD</span>
                                    <span className="text-sm  text-foreground">{ticket.customer.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                                    <span className="text-xs  text-muted-foreground">İLETİŞİM</span>
                                    <span className="text-sm  text-foreground">{ticket.customer.phone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs  text-muted-foreground">TOPLAM İŞLEM</span>
                                    <span className="text-sm  text-emerald-500">{ticket.customer.loyaltyPoints} PUAN</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Vertical Journey Timeline */}
                    <Card className="bg-card border-border/50 shadow-none">
                        <CardHeader className="border-b border-border/50 pb-6 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <CardTitle className="font-medium text-sm  text-foreground">Servis Yolculuğu</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-blue-500 before:to-transparent">
                                {ticket.logs.map((log: any, idx: number) => (
                                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background text-blue-500 shadow-none z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:scale-110 group-hover:border-blue-500/50 transition-all">
                                            {idx === 0 ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl whisper-border border-border/50 bg-muted/30 shadow-none group-hover:bg-muted/50 transition-all">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className=" text-foreground text-xs">{statusLabels[log.status]}</div>
                                                <time className="text-[10px]  text-muted-foreground">{format(new Date(log.createdAt), "d MMM, HH:mm", { locale: tr })}</time>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground/80 font-medium">"{log.message}"</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Financial & Actions */}
                <div className="space-y-8">
                    <Card className="bg-card border-border/50 shadow-none group overflow-hidden relative">
                        <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 opacity-5 rounded-full bg-blue-500" />
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <CardTitle className="font-medium text-xs  text-foreground">Finansal Özet</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="text-center">
                                <p className="text-xs  text-muted-foreground mb-2">TAHMİNİ ÜCRET</p>
                                <h2 className="font-medium text-5xl  text-foreground">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                                    <p className="text-[11px]  text-muted-foreground mb-1">ALINAN KAPORA</p>
                                    <p className="text-lg  text-emerald-500">₺0</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center">
                                    <p className="text-[11px]  text-muted-foreground mb-1">KALAN TUTAR</p>
                                    <p className="text-lg  text-blue-500">₺{Number(ticket.estimatedCost).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/50 shadow-none group overflow-hidden relative">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <UserCog className="h-4 w-4 text-blue-500" />
                                <CardTitle className="font-medium text-xs  text-foreground">Ekip & Operasyon</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 whisper-border border-border/50">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500  text-xs">
                                    {ticket.technician?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-xs  text-muted-foreground">GÖREVLİ TEKNİSYEN</p>
                                    <p className="text-sm  text-foreground">{ticket.technician?.name || 'HENÜZ ATANMADI'}</p>
                                </div>
                            </div>
                            <ServiceDetailActions ticket={ticket} />
                        </CardContent>
                    </Card>

                    {differenceInDays(new Date(), new Date(ticket.createdAt)) > 3 &&
                        ticket.status !== 'DELIVERED' &&
                        ticket.status !== 'CANCELLED' && (
                            <div className="p-10 rounded-[2.5rem] whisper-border border-rose-500/20 bg-rose-500/5 flex items-start gap-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <AlertCircle className="h-32 w-32 text-rose-500 -mr-16 -mt-16" />
                                </div>
                                <AlertCircle className="h-8 w-8 text-rose-500 shrink-0 mt-1" />
                                <div className="relative z-10 space-y-3">
                                    <h4 className="font-medium text-sm text-rose-500 tracking-[0.2em]">Sistem Uyarısı</h4>
                                    <p className="text-lg text-rose-500/90 leading-tight animate-in fade-in slide-in-from-left-4 duration-700">
                                        "Bu cihaz {differenceInDays(new Date(), new Date(ticket.createdAt))} günden uzun süredir işlem bekliyor. Müşteri memnuniyeti için öncelik verin."
                                    </p>
                                    <div className="flex gap-2 pt-2">
                                        <div className="h-1 w-12 rounded-full bg-rose-500/40" />
                                        <div className="h-1 w-6 rounded-full bg-rose-500/20" />
                                    </div>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
