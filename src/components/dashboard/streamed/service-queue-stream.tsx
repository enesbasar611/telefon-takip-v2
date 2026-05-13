import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn, serializePrisma } from "@/lib/utils";
import { getRecentSales } from "@/lib/actions/dashboard-actions";
import { getShopId } from "@/lib/auth";

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

export async function ServiceQueueStream({ title = "Servis Kuyruğu" }: { title?: string }) {
    const shopId = await getShopId(false);
    if (!shopId) return null;
    const recentTicketsRaw = await getRecentSales(shopId, 5);
    const recentTickets = serializePrisma(recentTicketsRaw);

    return (
        <Card className="h-auto flex flex-col border border-border/40 shadow-xl overflow-hidden rounded-[2rem] bg-card transition-all duration-500 animate-in fade-in">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-border/40 p-8 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-medium text-lg tracking-tight font-sans uppercase">{title}</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Aktif İş Emreleri</p>
                    </div>
                </div>
                <Link href="/servis/liste">
                    <Button variant="outline" className="text-[10px] uppercase tracking-tighter text-primary border-primary/20 hover:bg-primary/5 h-9 rounded-xl px-5 transition-all">
                        YÖNET <ChevronRight className="h-3 w-3 ml-2" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {(recentTickets ?? []).length > 0 ? (
                    <>
                        {(recentTickets ?? []).slice(0, 4).map((ticket: any) => (
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
                                        <h4 className="font-medium text-sm text-foreground tracking-tight truncate font-sans uppercase group-hover:text-primary transition-colors">{ticket.deviceBrand} {ticket.deviceModel}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight mt-1 truncate">
                                            {ticket.customer?.name} • <span className="text-primary tracking-tighter">#{ticket.ticketNumber}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <Badge
                                        variant="outline"
                                        className="text-[8px] uppercase tracking-tighter border-none px-3 py-1 rounded-lg mb-1"
                                        style={{ backgroundColor: `${statusColors[ticket.status]}15`, color: statusColors[ticket.status] }}
                                    >
                                        {statusLabels[ticket.status]}
                                    </Badge>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-tighter opacity-60">
                                        {ticket.technician?.name || "BOŞTA"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                        {(recentTickets ?? []).length > 4 && (
                            <Link href="/servis/liste" className="flex flex-col items-center justify-center py-4 bg-muted/5 border-t border-border/10 group cursor-pointer">
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] group-hover:text-primary transition-colors">
                                    {(recentTickets ?? []).length - 4} KAYIT DAHA VAR
                                </span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/30 rotate-90 mt-1 animate-bounce" />
                            </Link>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <Smartphone className="h-12 w-12 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Kuyruk Boş</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


