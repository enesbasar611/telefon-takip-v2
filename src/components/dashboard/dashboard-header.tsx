import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DashboardHeaderProps {
    title?: string;
    subtitle?: string;
}

export function DashboardHeader({
    title = "Yönetim Paneli",
    subtitle = "Operasyonel akış ve finansal performans verileri"
}: DashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-primary rounded-full" />
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans uppercase">
                        {title}
                    </h1>
                </div>
                <p className="text-[15px] text-muted-foreground font-semibold max-w-2xl leading-relaxed opacity-80">
                    {subtitle} • {format(new Date(), "d MMMM yyyy", { locale: tr })}
                </p>
            </div>

            <div className="flex items-center gap-5 bg-card/40 backdrop-blur-md border border-border/40 p-1 rounded-[1.8rem] shadow-sm">
                <div className="flex items-center gap-4 px-5 py-3 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-600/70 tracking-tighter uppercase leading-none mb-1">Sistem Durumu</span>
                        <span className="text-xs font-black text-emerald-600 tracking-tight">AKTİF & STABİL</span>
                    </div>
                </div>
                <div className="px-5 py-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter uppercase leading-none mb-1">Veri Akışı</span>
                        <span className="text-xs font-black text-foreground tracking-tight uppercase">Gerçek Zamanlı</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
