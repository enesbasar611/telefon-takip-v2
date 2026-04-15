import { getLiveActivity } from "@/lib/actions/live-actions";
import { Wrench, Banknote, User } from "lucide-react";
import { cn } from "@/lib/utils";

export async function MobileActivityStream() {
    const activity = await getLiveActivity();
    const recent = activity.slice(0, 5);

    if (recent.length === 0) {
        return (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border/40 rounded-3xl mx-4">
                Henüz aktivite bulunmuyor.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 px-4 pb-10">
            {recent.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-white/20 dark:border-zinc-800 shadow-xl shadow-black/5">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                        item.type === 'SERVICE' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                        {item.type === 'SERVICE' ? <Wrench className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-[14px] font-black tracking-tight leading-tight truncate">
                                {item.message}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                {new Date(item.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 opacity-60">
                            <User className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest truncate">{item.user}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
