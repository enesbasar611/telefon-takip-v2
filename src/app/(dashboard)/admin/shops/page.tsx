import { checkSuperAdmin } from "@/lib/actions/superadmin-actions";
import { ShopsClient } from "./shops-client";
import { PageHeader } from "@/components/ui/page-header";
import { ShieldAlert, Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function SuperAdminShopsPage() {
    try {
        await checkSuperAdmin();
    } catch {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Super Admin - Dükkanlar"
                description="Sistemdeki tüm dükkanları yönetin, ayarlarını değiştirin veya hesaplarına giriş yapın."
                icon={ShieldAlert}
            />

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                    <p className="text-sm text-muted-foreground font-medium">Yönetim paneli hazırlanıyor...</p>
                </div>
            }>
                <ShopsClient />
            </Suspense>
        </div>
    );
}
