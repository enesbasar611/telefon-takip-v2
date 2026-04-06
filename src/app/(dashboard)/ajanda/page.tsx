import { AjandaPageClient } from "@/components/agenda/ajanda-page-client";
import { getCalendarEventsAction } from "@/lib/actions/agenda-actions";
import { Suspense } from "react";

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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Merkezi Takvim</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium mt-1">OPERASYONEL GÖRÜNÜM</p>
                </div>
            </div>

            <Suspense fallback={<div className="text-muted-foreground">Takvim yükleniyor...</div>}>
                <AjandaPageClient initialEvents={initialEvents} />
            </Suspense>
        </div>
    );
}
