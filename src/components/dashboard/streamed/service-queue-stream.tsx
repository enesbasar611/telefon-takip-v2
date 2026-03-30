import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn, serializePrisma } from "@/lib/utils";
import { getRecentServiceTickets } from "@/lib/actions/dashboard-actions";

const statusColors: Record<string, string> = {
    PENDING: "#94a3b8",      // Grey
    APPROVED: "#3b82f6",     // Blue
    REPAIRING: "#3b82f6",    // Orange
    WAITING_PART: "#8b5cf6", // Purple
    READY: "#10b981",        // Green
    DELIVERED: "#059669",    // Dark Green
    CANCELLED: "#ef4444",    // Red
};

const statusLabels: Record<string, string> = {
    PENDING: "Beklemede",
    APPROVED: "Onaylandı",
    REPAIRING: "Tamirde",
    WAITING_PART: "Parça bekliyor",
    READY: "Hazır",
    DELIVERED: "Teslim edildi",
    CANCELLED: "İptal edildi",
};

export async function ServiceQueueStream() {
    const recentTicketsRaw = await getRecentServiceTickets();
    const recentTickets = serializePrisma(recentTicketsRaw);

    return (
        <Card className="border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500 animate-in fade-in duration-1000">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black tracking-tight font-sans uppercase">Servis Kuyruğu</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">Aktif İş Emreleri</p>
                    </div>
                </div>
                <Link href="/servis/liste">
                    <Button variant="outline" className="text-[10px] font-black uppercase tracking-tighter text-primary border-primary/20 hover:bg-primary/5 h-9 rounded-xl px-5 transition-all">
                        YÖNET <ChevronRight className="h-3 w-3 ml-2" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
                {(recentTickets ?? []).map((ticket: any) => (
                    <Link
                        key={ticket.id}
                        href={`/servis/liste?status=${ticket.status}`}
                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/5 group hover:border-primary/20 hover:bg-card transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-xl bg-card border border-border/40 flex items-center justify-center shadow-sm relative shrink-0 group-hover:scale-105 transition-transform">
                                <Smartphone className="h-7 w-7 text-primary/80" />
                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-sm text-foreground tracking-tight truncate font-sans uppercase group-hover:text-primary transition-colors">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight mt-1 truncate">
                                    {ticket.customer?.name} • <span className="text-primary tracking-tighter">#{ticket.ticketNumber}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <Badge
                                variant="outline"
                                className="text-[8px] font-black uppercase tracking-tighter border-none px-3 py-1 rounded-lg mb-1"
                                style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}
                            >
                                {statusLabels[ticket.status]}
                            </Badge>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                                {ticket.technician?.name || "BOŞTA"}
                            </p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
