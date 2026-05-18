import { checkSuperAdmin } from "@/lib/actions/superadmin-actions";
import { IndustryTemplatesAdmin } from "@/components/settings/industry-templates-admin";
import { PageHeader } from "@/components/ui/page-header";
import { Globe } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function SektorlerSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-4 w-96 rounded-lg" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

export default async function SektorlerPage() {
    try {
        await checkSuperAdmin();
    } catch {
        redirect("/ayarlar");
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Sektör Şablonları"
                description="AI tarafından oluşturulan sektör yapılandırmalarını buradan düzenleyebilirsiniz."
                icon={Globe}
            />
            <Suspense fallback={<SektorlerSkeleton />}>
                <IndustryTemplatesAdmin />
            </Suspense>
        </div>
    );
}
