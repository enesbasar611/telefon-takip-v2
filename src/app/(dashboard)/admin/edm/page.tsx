import { checkSuperAdmin } from "@/lib/actions/superadmin-actions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Zap } from "lucide-react";
import { EdmAdminClient } from "./edm-admin-client";

export const dynamic = "force-dynamic";

export default async function EdmAdminPage() {
    try {
        await checkSuperAdmin();
    } catch {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="e-Dönüşüm Yönetimi"
                description="Sistemdeki tüm bayilerin EDM e-Fatura entegrasyonlarını yönetin, kontörlerini takip edin."
                icon={Zap}
            />

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                    <p className="text-sm text-muted-foreground font-medium">Bayi listesi yükleniyor...</p>
                </div>
            }>
                <EdmAdminClient />
            </Suspense>
        </div>
    );
}
