import { PageHeader } from "@/components/ui/page-header";
import { AjandaPageClient } from "@/components/agenda/ajanda-page-client";
import { Suspense } from "react";
import { Calendar } from "lucide-react";

export const metadata = {
    title: 'Randevu Merkezi | Başar Teknik',
    description: 'Merkezi Operasyonel Takvim',
}

export const dynamic = "force-dynamic";

export default async function AjandaPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-10 bg-background">
            <PageHeader
                title="Ajanda"
                description="Merkezi Operasyonel Takvim"
                icon={Calendar}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
            />

            <Suspense fallback={<div className="text-muted-foreground">Takvim yükleniyor...</div>}>
                <AjandaPageClient />
            </Suspense>
        </div>
    );
}
