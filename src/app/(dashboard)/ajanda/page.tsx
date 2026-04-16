import { AjandaPageClient } from "@/components/agenda/ajanda-page-client";
import { getCalendarEventsAction } from "@/lib/actions/agenda-actions";
import { Suspense } from "react";
import { Calendar } from "lucide-react";

export const metadata = {
    title: 'Randevu Merkezi | Başar Teknik',
    description: 'Merkezi Operasyonel Takvim',
}

export const dynamic = "force-dynamic";

export default async function AjandaPage() {
    const today = new Date();
    // Default fetch for current month and year
    const initialEvents = await getCalendarEventsAction(today.getFullYear(), today.getMonth() + 1);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-10 bg-background">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Ajanda</h2>
                        <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mt-1 opacity-70">
                            Merkezi Operasyonel Takvim
                        </p>
                    </div>
                </div>
            </div>

            <Suspense fallback={<div className="text-muted-foreground">Takvim yükleniyor...</div>}>
                <AjandaPageClient initialEvents={initialEvents} />
            </Suspense>
        </div>
    );
}
