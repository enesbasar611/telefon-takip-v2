import { getAllShops, checkSuperAdmin } from "@/lib/actions/superadmin-actions";
import { ShopsClient } from "./shops-client";
import { PageHeader } from "@/components/ui/page-header";
import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SuperAdminShopsPage() {
    try {
        await checkSuperAdmin();
    } catch {
        redirect("/dashboard");
    }

    const result = await getAllShops();
    const shops = result.success ? (result.data || []) : [];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Super Admin - Dükkanlar"
                description="Sistemdeki tüm dükkanları yönetin, ayarlarını değiştirin veya hesaplarına giriş yapın."
                icon={ShieldAlert}
            />

            <ShopsClient initialShops={shops as any} />
        </div>
    );
}
